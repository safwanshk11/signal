package com.signalapp.frameprocessors

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.graphics.YuvImage
import android.graphics.ImageFormat
import android.util.Log
import java.io.ByteArrayOutputStream
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarkerResult
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

/**
 * VisionCamera Frame Processor Plugin: "detectHandLandmarks".
 *
 * Wraps Google's MediaPipe Tasks Vision HandLandmarker to run fully
 * on-device, per camera frame. No network calls, no cloud inference —
 * the .task model is bundled locally under android/app/src/main/assets/.
 *
 * Registered from MainApplication.kt via:
 *   FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectHandLandmarks") { proxy, options ->
 *     HandLandmarkerFrameProcessorPlugin(proxy, options)
 *   }
 *
 * Returns to JS an array of per-hand results:
 *   [{ handedness: "left" | "right", landmarks: [{x,y,z}, ...21] }, ...]
 */
class HandLandmarkerFrameProcessorPlugin(
    proxy: VisionCameraProxy,
    options: Map<String, Any>?,
) : FrameProcessorPlugin() {

    companion object {
        private const val TAG = "HandLandmarkerPlugin"
        private const val MODEL_ASSET_PATH = "hand_landmarker.task"
    }

    private var handLandmarker: HandLandmarker? = null

    private fun getOrCreateLandmarker(context: Context): HandLandmarker {
        handLandmarker?.let { return it }

        val baseOptions = BaseOptions.builder()
            .setModelAssetPath(MODEL_ASSET_PATH)
            .setDelegate(Delegate.CPU)
            .build()

        val options = HandLandmarker.HandLandmarkerOptions.builder()
            .setBaseOptions(baseOptions)
            .setRunningMode(RunningMode.IMAGE)
            .setNumHands(2)
            .setMinHandDetectionConfidence(0.5f)
            .setMinHandPresenceConfidence(0.5f)
            .setMinTrackingConfidence(0.5f)
            .build()

        val created = HandLandmarker.createFromOptions(context, options)
        handLandmarker = created
        return created
    }

    override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
        return try {
            // The application Context is required by MediaPipe's model loader
            // (reads the .task file from assets); VisionCameraProxy doesn't
            // expose it on `frame`, so it's held statically by MainApplication.
            val context = com.signalapp.MainApplication.appContext
                ?: throw IllegalStateException("Application context not available")

            val landmarker = getOrCreateLandmarker(context)

            // MediaPipe's HandLandmarker expects an upright image. CameraX
            // delivers the raw sensor buffer un-rotated (rotationDegrees
            // tells us what's needed to make it upright) — wrapping it
            // directly, as an earlier version of this file did, silently
            // produced zero detections on any device where the sensor
            // isn't already upright relative to the app's orientation
            // (i.e. basically always, for a portrait phone). So we convert
            // to a Bitmap and rotate it first.
            val rotationDegrees = orientationToDegrees(frame.orientation)
            val bitmap = yuvFrameToUprightBitmap(frame, rotationDegrees)
            val mpImage: MPImage = BitmapImageBuilder(bitmap).build()

            val result: HandLandmarkerResult = landmarker.detect(mpImage)
            mapResultToJs(result)
        } catch (e: Exception) {
            Log.e(TAG, "detectHandLandmarks failed", e)
            emptyList<Map<String, Any>>()
        }
    }

    /** Degrees to rotate the raw sensor buffer clockwise to make it upright. */
    private fun orientationToDegrees(orientation: Orientation): Int =
        when (orientation) {
            Orientation.PORTRAIT -> 0
            Orientation.LANDSCAPE_RIGHT -> 90
            Orientation.PORTRAIT_UPSIDE_DOWN -> 180
            Orientation.LANDSCAPE_LEFT -> 270
        }

    /**
     * Converts a YUV_420_888 camera Image into an upright RGB Bitmap,
     * rotating by the sensor's rotationDegrees so MediaPipe sees the frame
     * the same way a person holding the phone would.
     */
    private fun yuvFrameToUprightBitmap(frame: Frame, rotationDegrees: Int): Bitmap {
        val image = frame.image
        val width = image.width
        val height = image.height
        val nv21 = ByteArray(width * height * 3 / 2)

        // Y plane: usually tightly packed, but respect rowStride in case of
        // padding (common on e.g. Samsung/Xiaomi sensors).
        val yPlane = image.planes[0]
        var pos = 0
        val yBuffer = yPlane.buffer
        val yRowStride = yPlane.rowStride
        for (row in 0 until height) {
            yBuffer.position(row * yRowStride)
            yBuffer.get(nv21, pos, width)
            pos += width
        }

        // U/V planes: chroma is subsampled 2x2 and pixelStride is often 2
        // (interleaved VUVU..), so we can't just bulk-copy — walk pixel by
        // pixel using each plane's own row/pixel stride. NV21 wants V
        // before U, interleaved.
        val uPlane = image.planes[1]
        val vPlane = image.planes[2]
        val uBuffer = uPlane.buffer
        val vBuffer = vPlane.buffer
        val uRowStride = uPlane.rowStride
        val uPixelStride = uPlane.pixelStride
        val vRowStride = vPlane.rowStride
        val vPixelStride = vPlane.pixelStride
        val chromaHeight = height / 2
        val chromaWidth = width / 2

        for (row in 0 until chromaHeight) {
            for (col in 0 until chromaWidth) {
                val vIndex = row * vRowStride + col * vPixelStride
                val uIndex = row * uRowStride + col * uPixelStride
                nv21[pos++] = vBuffer.get(vIndex)
                nv21[pos++] = uBuffer.get(uIndex)
            }
        }

        val yuvImage = YuvImage(nv21, ImageFormat.NV21, width, height, null)
        val out = ByteArrayOutputStream()
        yuvImage.compressToJpeg(android.graphics.Rect(0, 0, image.width, image.height), 90, out)
        val bytes = out.toByteArray()
        val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)

        if (rotationDegrees == 0) return bitmap

        val matrix = Matrix().apply { postRotate(rotationDegrees.toFloat()) }
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }

    private fun mapResultToJs(result: HandLandmarkerResult): List<Map<String, Any>> {
        val handedness = result.handednesses()
        val landmarksPerHand = result.landmarks()
        val output = mutableListOf<Map<String, Any>>()

        for (i in landmarksPerHand.indices) {
            val categories = handedness.getOrNull(i) ?: continue
            val label = categories.firstOrNull()?.categoryName()?.lowercase() ?: continue
            // MediaPipe's "left"/"right" is anatomical (mirrored for a front
            // camera selfie view); we pass it through as-is and treat it as
            // an opaque, consistent label — the classifier only needs
            // consistency across recordings, not real-world anatomical truth.
            val landmarks = landmarksPerHand[i].map { lm ->
                mapOf("x" to lm.x().toDouble(), "y" to lm.y().toDouble(), "z" to lm.z().toDouble())
            }
            output.add(mapOf("handedness" to label, "landmarks" to landmarks))
        }

        return output
    }
}

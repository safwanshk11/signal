import Foundation
import MediaPipeTasksVision
import VisionCamera

/// VisionCamera Frame Processor Plugin: "detectHandLandmarks".
///
/// Wraps Google's MediaPipe Tasks Vision HandLandmarker to run fully
/// on-device, per camera frame. No network calls, no cloud inference —
/// the .task model is bundled locally as an app resource
/// (ios/SignalApp/Resources/hand_landmarker.task).
///
/// Registered via the VISION_EXPORT_SWIFT_FRAME_PROCESSOR macro at the
/// bottom of this file (see FrameProcessorPlugin.h for how the macro
/// wires this into FrameProcessorPluginRegistry automatically at launch).
///
/// Returns to JS an array of per-hand results:
///   [{ handedness: "left" | "right", landmarks: [{x,y,z}, ...21] }, ...]
@objc(HandLandmarkerFrameProcessorPlugin)
public class HandLandmarkerFrameProcessorPlugin: FrameProcessorPlugin {
  private var handLandmarker: HandLandmarker?

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
  }

  private func getOrCreateLandmarker() throws -> HandLandmarker {
    if let existing = handLandmarker {
      return existing
    }

    guard let modelPath = Bundle.main.path(forResource: "hand_landmarker", ofType: "task") else {
      throw NSError(
        domain: "SignalApp",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "hand_landmarker.task not found in app bundle"]
      )
    }

    let options = HandLandmarkerOptions()
    options.baseOptions.modelAssetPath = modelPath
    options.runningMode = .image
    options.numHands = 2
    options.minHandDetectionConfidence = 0.5
    options.minHandPresenceConfidence = 0.5
    options.minTrackingConfidence = 0.5

    let created = try HandLandmarker(options: options)
    handLandmarker = created
    return created
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    do {
      let landmarker = try getOrCreateLandmarker()

      guard let pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
        return []
      }

      let mpImage = try MPImage(pixelBuffer: pixelBuffer, orientation: frame.orientation)
      let result = try landmarker.detect(image: mpImage)

      return mapResultToJs(result)
    } catch {
      NSLog("[HandLandmarkerPlugin] detectHandLandmarks failed: \(error)")
      return []
    }
  }

  private func mapResultToJs(_ result: HandLandmarkerResult) -> [[String: Any]] {
    var output: [[String: Any]] = []

    for (index, landmarks) in result.landmarks.enumerated() {
      guard let categories = result.handedness[safe: index], let top = categories.first else {
        continue
      }
      // MediaPipe's categoryName is "Left"/"Right"; normalize to lowercase
      // to match the JS-side Handedness type.
      let label = top.categoryName?.lowercased() ?? "right"

      let mapped = landmarks.map { lm -> [String: Any] in
        ["x": Double(lm.x), "y": Double(lm.y), "z": Double(lm.z)]
      }

      output.append(["handedness": label, "landmarks": mapped])
    }

    return output
  }
}

private extension Array {
  subscript(safe index: Int) -> Element? {
    indices.contains(index) ? self[index] : nil
  }
}

// Registration happens in HandLandmarkerFrameProcessorPlugin.m, via the
// VISION_EXPORT_SWIFT_FRAME_PROCESSOR macro (a Swift file can't use that
// C macro directly — VisionCamera's documented pattern is a thin .m
// companion file that references the auto-generated Swift bridging header).

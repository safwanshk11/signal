import {VisionCameraProxy, Frame} from 'react-native-vision-camera';
import {HandFrame, Landmark} from '../ml/types';

// Bound to the native Frame Processor Plugin registered as
// "detectHandLandmarks" — see:
//   android/app/src/main/java/com/signalapp/frameprocessors/HandLandmarkerFrameProcessorPlugin.kt
//   ios/SignalApp/FrameProcessors/HandLandmarkerFrameProcessorPlugin.swift
// Both wrap Google's MediaPipe Tasks Vision HandLandmarker natively — no
// WASM, no WebView, no network.
const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectHandLandmarks', {});

// Raw shape returned across the JSI boundary by the native plugin.
type NativeHandResult = {
  handedness: 'left' | 'right';
  landmarks: {x: number; y: number; z: number}[];
};

/**
 * Runs native MediaPipe hand landmark detection on a single camera frame.
 * Must be called from within a frame processor worklet.
 */
export function detectHandLandmarks(frame: Frame): NativeHandResult[] {
  'worklet';
  if (plugin == null) {
    throw new Error(
      'detectHandLandmarks native plugin not found — did the native module link correctly?',
    );
  }
  const result = plugin.call(frame) as unknown as NativeHandResult[] | undefined;
  return result ?? [];
}

/** Maps the plugin's raw per-hand results into one normalized-model HandFrame. */
export function toHandFrame(
  results: NativeHandResult[],
  timestamp: number,
): HandFrame {
  'worklet';
  let left: Landmark[] | undefined;
  let right: Landmark[] | undefined;

  for (const hand of results) {
    if (hand.handedness === 'left') left = hand.landmarks;
    else if (hand.handedness === 'right') right = hand.landmarks;
  }

  return {timestamp, left, right};
}

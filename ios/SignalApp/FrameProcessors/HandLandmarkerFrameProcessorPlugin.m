// Registers HandLandmarkerFrameProcessorPlugin.swift with VisionCamera's
// Frame Processor runtime under the name "detectHandLandmarks", matching
// src/camera/handLandmarkerPlugin.ts. Swift classes can't invoke this C
// macro themselves, so VisionCamera's documented pattern is this thin
// Objective-C companion file, which references the Swift class through
// the project's auto-generated bridging header.
#import <VisionCamera/FrameProcessorPlugin.h>
#import "SignalApp-Swift.h"

VISION_EXPORT_SWIFT_FRAME_PROCESSOR(HandLandmarkerFrameProcessorPlugin, detectHandLandmarks)

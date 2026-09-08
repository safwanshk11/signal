import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {LayoutChangeEvent, StyleSheet, View} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {Worklets} from 'react-native-worklets-core';
import {detectHandLandmarks, toHandFrame} from './handLandmarkerPlugin';
import {HandFrame} from '../ml/types';
import {HandSkeleton} from '../components/HandSkeleton';

// The skeleton only needs to look smooth, not match camera fps — redrawing
// ~21 joints + 21 bones on every frame would churn the JS thread for no
// visible gain.
const SKELETON_INTERVAL_MS = 1000 / 12;

type Props = {
  /** Called on the JS thread for every frame the detector produces. */
  onFrame: (frame: HandFrame) => void;
  /** Which physical camera to use. Defaults to the front ("selfie") camera. */
  position?: 'front' | 'back';
  /** Draw the live 21-point hand skeleton over the preview. */
  showSkeleton?: boolean;
  /** Fires only when hand presence changes, so callers don't re-render per frame. */
  onHandPresenceChange?: (present: boolean) => void;
};

export function LandmarkCamera({
  onFrame,
  position = 'front',
  showSkeleton = true,
  onHandPresenceChange,
}: Props) {
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice(position);

  const [skeletonFrame, setSkeletonFrame] = useState<HandFrame | null>(null);
  const [size, setSize] = useState({width: 0, height: 0});
  const lastSkeletonAt = useRef(0);
  const lastPresence = useRef<boolean | null>(null);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // Single JS-thread entry point for the worklet: fan out to the caller,
  // and throttle the skeleton/presence updates separately.
  const handleFrame = useCallback(
    (frame: HandFrame) => {
      onFrame(frame);

      const present = !!(frame.left || frame.right);
      if (present !== lastPresence.current) {
        lastPresence.current = present;
        onHandPresenceChange?.(present);
      }

      const now = Date.now();
      if (now - lastSkeletonAt.current < SKELETON_INTERVAL_MS) return;
      lastSkeletonAt.current = now;
      setSkeletonFrame(present ? frame : null);
    },
    [onFrame, onHandPresenceChange],
  );

  const handleFrameJS = useMemo(() => Worklets.createRunOnJS(handleFrame), [handleFrame]);

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      const results = detectHandLandmarks(frame);
      handleFrameJS(toHandFrame(results, frame.timestamp));
    },
    [handleFrameJS],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    setSize({width, height});
  };

  // Kept out of the render path of skeleton state so the native camera view
  // is never torn down and rebuilt as landmarks stream in.
  const cameraElement = useMemo(() => {
    if (!device || !hasPermission) return null;
    return (
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />
    );
  }, [device, hasPermission, frameProcessor]);

  if (!cameraElement) return null;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {cameraElement}
      {showSkeleton && (
        <HandSkeleton
          frame={skeletonFrame}
          width={size.width}
          height={size.height}
          mirrored={position === 'front'}
        />
      )}
    </View>
  );
}

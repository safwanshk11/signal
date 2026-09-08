import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {Worklets} from 'react-native-worklets-core';
import {detectHandLandmarks, toHandFrame} from './handLandmarkerPlugin';
import {HandFrame} from '../ml/types';

type Props = {
  /** Called on the JS thread for every frame the detector produces. */
  onFrame: (frame: HandFrame) => void;
  /** Which physical camera to use. Defaults to the front ("selfie") camera. */
  position?: 'front' | 'back';
  /** Fires only when hand presence changes, so callers don't re-render per frame. */
  onHandPresenceChange?: (present: boolean) => void;
};

export function LandmarkCamera({
  onFrame,
  position = 'front',
  onHandPresenceChange,
}: Props) {
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice(position);
  const lastPresence = useRef<boolean | null>(null);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const handleFrame = useCallback(
    (frame: HandFrame) => {
      onFrame(frame);

      const present = !!(frame.left || frame.right);
      if (present !== lastPresence.current) {
        lastPresence.current = present;
        onHandPresenceChange?.(present);
      }
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
    <View style={StyleSheet.absoluteFill}>
      {cameraElement}
    </View>
  );
}

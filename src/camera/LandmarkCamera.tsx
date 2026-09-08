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
import {HandSkeleton, HandSkeletonHandle} from '../components/HandSkeleton';

type Props = {
  /** Called on the JS thread for every frame the detector produces. */
  onFrame: (frame: HandFrame) => void;
  /** Which physical camera to use. Defaults to the front ("selfie") camera. */
  position?: 'front' | 'back';
  /** Draw the live 21-point hand skeleton over the preview. Defaults to true. */
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

  const skeletonRef = useRef<HandSkeletonHandle>(null);
  const sizeRef = useRef({width: 0, height: 0});
  const showSkeletonRef = useRef(showSkeleton);
  const positionRef = useRef(position);
  const lastPresence = useRef<boolean | null>(null);

  useEffect(() => {
    showSkeletonRef.current = showSkeleton;
    if (!showSkeleton) {
      skeletonRef.current?.updateFrame(null, 0, 0);
    }
  }, [showSkeleton]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // Single JS-thread entry point for the worklet: fan out to the caller
  // and directly update the skeleton ref without triggering React re-renders.
  const handleFrame = useCallback(
    (frame: HandFrame) => {
      onFrame(frame);

      const present = !!(frame.left || frame.right);
      if (present !== lastPresence.current) {
        lastPresence.current = present;
        onHandPresenceChange?.(present);
      }

      if (showSkeletonRef.current) {
        skeletonRef.current?.updateFrame(
          frame,
          sizeRef.current.width,
          sizeRef.current.height,
          positionRef.current === 'front',
        );
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

  const onLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    sizeRef.current = {width, height};
  };

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
      {showSkeleton && <HandSkeleton ref={skeletonRef} />}
    </View>
  );
}

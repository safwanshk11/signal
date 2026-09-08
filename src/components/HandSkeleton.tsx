import React, {forwardRef, useImperativeHandle, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {HandFrame, Landmark} from '../ml/types';
import {colors} from '../theme';

// MediaPipe's standard 21-point hand topology.
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const JOINT = 8;
const TIP_JOINT = 12;
const BONE = 3;
const FINGERTIPS = new Set([4, 8, 12, 16, 20]);
const LERP_ALPHA = 0.45; // Smoothing factor (0 = frozen, 1 = no smoothing)

export type HandSkeletonHandle = {
  updateFrame: (frame: HandFrame | null, width: number, height: number, mirrored?: boolean) => void;
};

type Props = {
  color?: string;
};

type Point2D = {x: number; y: number};

export const HandSkeleton = forwardRef<HandSkeletonHandle, Props>(function HandSkeleton(
  {color = colors.spark},
  ref,
) {
  // Pre-create refs for 2 hands x (21 joints + 21 bones) = 84 static View nodes
  const jointRefs = [
    Array.from({length: 21}).map(() => useRef<View>(null)),
    Array.from({length: 21}).map(() => useRef<View>(null)),
  ];

  const boneRefs = [
    Array.from({length: 21}).map(() => useRef<View>(null)),
    Array.from({length: 21}).map(() => useRef<View>(null)),
  ];

  // Store previous points for LERP exponential smoothing
  const prevPointsRef = useRef<Record<number, Point2D[]>>({});

  useImperativeHandle(ref, () => ({
    updateFrame(frame: HandFrame | null, width: number, height: number, mirrored = true) {
      if (width === 0 || height === 0) return;

      const hands = frame ? [frame.left, frame.right] : [null, null];

      [0, 1].forEach(handIdx => {
        const landmarks = hands[handIdx] as Landmark[] | null;

        if (!landmarks || landmarks.length < 21) {
          // Hide hand joints and bones immediately when hand is lost
          jointRefs[handIdx].forEach(r => r.current?.setNativeProps({style: {opacity: 0}}));
          boneRefs[handIdx].forEach(r => r.current?.setNativeProps({style: {opacity: 0}}));
          delete prevPointsRef.current[handIdx];
          return;
        }

        // Calculate raw target points
        const targetPoints: Point2D[] = landmarks.map(lm => ({
          x: (mirrored ? 1 - lm.x : lm.x) * width,
          y: lm.y * height,
        }));

        // Apply LERP smoothing against previous frame points
        const prevPoints = prevPointsRef.current[handIdx];
        const smoothedPoints: Point2D[] = targetPoints.map((target, i) => {
          if (!prevPoints || !prevPoints[i]) return target;
          return {
            x: prevPoints[i].x + LERP_ALPHA * (target.x - prevPoints[i].x),
            y: prevPoints[i].y + LERP_ALPHA * (target.y - prevPoints[i].y),
          };
        });

        prevPointsRef.current[handIdx] = smoothedPoints;

        // 1. Update 21 joint positions directly on native views (0 React re-renders)
        smoothedPoints.forEach((p, i) => {
          const size = FINGERTIPS.has(i) ? TIP_JOINT : JOINT;
          jointRefs[handIdx][i].current?.setNativeProps({
            style: {
              left: p.x - size / 2,
              top: p.y - size / 2,
              opacity: 1,
            },
          });
        });

        // 2. Update 21 bone segment transforms directly on native views
        CONNECTIONS.forEach(([a, b], i) => {
          const p1 = smoothedPoints[a];
          const p2 = smoothedPoints[b];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          boneRefs[handIdx][i].current?.setNativeProps({
            style: {
              left: p1.x + dx / 2 - length / 2,
              top: p1.y + dy / 2 - BONE / 2,
              width: length,
              transform: [{rotate: `${angle}rad`}],
              opacity: 0.85,
            },
          });
        });
      });
    },
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[0, 1].map(handIdx => (
        <View key={`hand-${handIdx}`} style={StyleSheet.absoluteFill}>
          {CONNECTIONS.map(([_, __], i) => (
            <View
              key={`bone-${i}`}
              ref={boneRefs[handIdx][i]}
              style={[
                styles.bone,
                {backgroundColor: color},
              ]}
            />
          ))}

          {Array.from({length: 21}).map((_, i) => {
            const isWrist = i === 0;
            const isTip = FINGERTIPS.has(i);
            const size = isTip ? TIP_JOINT : JOINT;

            return (
              <View
                key={`joint-${i}`}
                ref={jointRefs[handIdx][i]}
                style={[
                  styles.joint,
                  {
                    width: size,
                    height: size,
                    backgroundColor: isWrist ? colors.signal : color,
                    borderColor: colors.ink,
                    borderWidth: 1,
                  },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  joint: {
    position: 'absolute',
    opacity: 0,
  },
  bone: {
    position: 'absolute',
    height: BONE,
    opacity: 0,
  },
});

import React from 'react';
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

const JOINT = 7;
const TIP_JOINT = 11;
const BONE = 2;
const FINGERTIPS = new Set([4, 8, 12, 16, 20]);

type Props = {
  frame: HandFrame | null;
  width: number;
  height: number;
  /** Front-camera preview is mirrored, so landmark x must be flipped to line up. */
  mirrored?: boolean;
  color?: string;
};

/**
 * Draws the live 21-point hand skeleton over the camera preview using plain
 * Views — square joints and rotated bone segments, matching the design
 * system's square-corner language (and avoiding an SVG dependency).
 */
export function HandSkeleton({frame, width, height, mirrored = true, color = colors.spark}: Props) {
  if (!frame || width === 0 || height === 0) return null;

  const hands = [frame.left, frame.right].filter(Boolean) as Landmark[][];
  if (hands.length === 0) return null;

  const toPoint = (lm: Landmark) => ({
    x: (mirrored ? 1 - lm.x : lm.x) * width,
    y: lm.y * height,
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {hands.map((landmarks, handIndex) => {
        if (landmarks.length < 21) return null;
        const points = landmarks.map(toPoint);

        return (
          <View key={handIndex} style={StyleSheet.absoluteFill}>
            {CONNECTIONS.map(([a, b], i) => {
              const p1 = points[a];
              const p2 = points[b];
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx);

              return (
                <View
                  key={`bone-${i}`}
                  style={{
                    position: 'absolute',
                    left: p1.x + dx / 2 - length / 2,
                    top: p1.y + dy / 2 - BONE / 2,
                    width: length,
                    height: BONE,
                    backgroundColor: color,
                    opacity: 0.9,
                    transform: [{rotate: `${angle}rad`}],
                  }}
                />
              );
            })}

            {points.map((p, i) => {
              const size = FINGERTIPS.has(i) ? TIP_JOINT : JOINT;
              return (
                <View
                  key={`joint-${i}`}
                  style={{
                    position: 'absolute',
                    left: p.x - size / 2,
                    top: p.y - size / 2,
                    width: size,
                    height: size,
                    backgroundColor: i === 0 ? colors.signal : color,
                  }}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

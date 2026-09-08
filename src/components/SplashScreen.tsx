import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {colors, fontFamily, space} from '../theme';

// A hardcoded open-hand pose in normalized (0..1) space — the same 21-point
// topology the recognizer actually uses, so the intro is literally the thing
// the app does.
const POSE: [number, number][] = [
  [0.5, 0.95],
  [0.38, 0.85], [0.3, 0.76], [0.25, 0.68], [0.2, 0.6],
  [0.42, 0.62], [0.4, 0.48], [0.39, 0.38], [0.38, 0.3],
  [0.5, 0.6], [0.5, 0.45], [0.5, 0.34], [0.5, 0.25],
  [0.58, 0.62], [0.6, 0.48], [0.61, 0.38], [0.62, 0.3],
  [0.66, 0.66], [0.7, 0.55], [0.72, 0.47], [0.74, 0.4],
];

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const BOX = {width: 220, height: 260};
const JOINT = 9;
const BONE = 2;

type Props = {onFinish: () => void};

export function SplashScreen({onFinish}: Props) {
  const draw = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(draw, {
        toValue: 1,
        duration: 900,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      Animated.timing(reveal, {
        toValue: 1,
        duration: 420,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      Animated.delay(280),
      Animated.timing(exit, {
        toValue: 1,
        duration: 360,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
    ]).start(({finished}) => {
      if (finished) onFinish();
    });
  }, [draw, reveal, exit, onFinish]);

  const points = POSE.map(([x, y]) => ({x: x * BOX.width, y: y * BOX.height}));

  // Each element eases in over its own slice of the draw timeline, so the
  // skeleton assembles wrist-outward instead of all at once.
  const staggered = (index: number, total: number) => {
    const start = (index / total) * 0.65;
    return draw.interpolate({
      inputRange: [start, Math.min(start + 0.35, 1)],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: exit.interpolate({inputRange: [0, 1], outputRange: [1, 0]}),
        },
      ]}
      pointerEvents="none">
      <View style={styles.stage}>
        <View style={BOX}>
          {CONNECTIONS.map(([a, b], i) => {
            const p1 = points[a];
            const p2 = points[b];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const t = staggered(i, CONNECTIONS.length);

            return (
              <Animated.View
                key={`bone-${i}`}
                style={{
                  position: 'absolute',
                  left: p1.x + dx / 2 - length / 2,
                  top: p1.y + dy / 2 - BONE / 2,
                  width: length,
                  height: BONE,
                  backgroundColor: colors.spark,
                  opacity: t,
                  transform: [{rotate: `${angle}rad`}, {scaleX: t}],
                }}
              />
            );
          })}

          {points.map((p, i) => {
            const t = staggered(i, points.length);
            return (
              <Animated.View
                key={`joint-${i}`}
                style={{
                  position: 'absolute',
                  left: p.x - JOINT / 2,
                  top: p.y - JOINT / 2,
                  width: JOINT,
                  height: JOINT,
                  backgroundColor: i === 0 ? colors.signal : colors.spark,
                  opacity: t,
                  transform: [{scale: t}],
                }}
              />
            );
          })}
        </View>

        <Animated.View
          style={{
            opacity: reveal,
            transform: [
              {translateY: reveal.interpolate({inputRange: [0, 1], outputRange: [16, 0]})},
            ],
          }}>
          <Animated.Text style={styles.wordmark}>SIGNAL</Animated.Text>
          <Animated.View
            style={[
              styles.underline,
              {transform: [{scaleX: reveal}]},
            ]}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  stage: {alignItems: 'center', gap: space[8]},
  wordmark: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: 44,
    letterSpacing: -1.5,
    color: colors.paper,
    textAlign: 'center',
  },
  underline: {height: 3, backgroundColor: colors.spark, marginTop: space[2]},
});

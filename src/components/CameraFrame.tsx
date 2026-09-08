import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {colors} from '../theme';

type Props = {
  /** Highlight the frame (e.g. when recording or hand detected). */
  active?: boolean;
  /** Recording state — pulses the frame red. */
  recording?: boolean;
};

const CORNER = 28;   // length of each bracket arm
const THICK = 3;     // stroke width
const INSET = 18;    // distance from edge

/**
 * Four-corner bracket frame overlaid on the camera preview.
 * Uses hard square corners to match the Feelings System design language.
 * Color transitions smoothly between idle (ink/50%), active (spark), recording (signal).
 */
export function CameraFrame({active = false, recording = false}: Props) {
  const colorAnim = useRef(new Animated.Value(0)).current; // 0=idle, 1=active, 2=recording
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const target = recording ? 2 : active ? 1 : 0;
    Animated.timing(colorAnim, {
      toValue: target,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [active, recording, colorAnim]);

  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {toValue: 1.012, duration: 500, useNativeDriver: true}),
          Animated.timing(scaleAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
        ]),
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [recording, scaleAnim]);

  const borderColor = colorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['rgba(18,17,15,0.45)', colors.spark, colors.signal],
  });

  const corner = (pos: 'tl' | 'tr' | 'bl' | 'br') => {
    const isTop = pos[0] === 't';
    const isLeft = pos[1] === 'l';
    return (
      <Animated.View
        style={[
          styles.corner,
          isTop ? {top: INSET} : {bottom: INSET},
          isLeft ? {left: INSET} : {right: INSET},
        ]}>
        {/* Horizontal arm */}
        <Animated.View
          style={[
            styles.armH,
            isTop ? {top: 0} : {bottom: 0},
            isLeft ? {left: 0} : {right: 0},
            {backgroundColor: borderColor},
          ]}
        />
        {/* Vertical arm */}
        <Animated.View
          style={[
            styles.armV,
            isTop ? {top: 0} : {bottom: 0},
            isLeft ? {left: 0} : {right: 0},
            {backgroundColor: borderColor},
          ]}
        />
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[styles.frame, {transform: [{scale: scaleAnim}]}]}
      pointerEvents="none">
      {corner('tl')}
      {corner('tr')}
      {corner('bl')}
      {corner('br')}

      {/* Subtle scan line when recording */}
      {recording && <ScanLine />}
    </Animated.View>
  );
}

function ScanLine() {
  const pos = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pos, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pos, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pos]);

  const translateY = pos.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

  return (
    <Animated.View
      style={[styles.scanLine, {transform: [{translateY}]}]}
    />
  );
}

const styles = StyleSheet.create({
  frame: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  armH: {
    position: 'absolute',
    width: CORNER,
    height: THICK,
  },
  armV: {
    position: 'absolute',
    width: THICK,
    height: CORNER,
  },
  scanLine: {
    position: 'absolute',
    top: INSET + CORNER,
    left: INSET,
    right: INSET,
    height: 1.5,
    backgroundColor: `${colors.signal}55`,
  },
});

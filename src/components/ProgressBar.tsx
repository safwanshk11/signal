import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {colors} from '../theme';

type Props = {
  active: boolean;
  durationMs: number;
  color?: string;
};

/** Fills over `durationMs` while active — real feedback during a capture window. */
export function ProgressBar({active, durationMs, color = colors.signal}: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      progress.setValue(0);
    }
  }, [active, durationMs, progress]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: progress.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']}),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {height: 4, backgroundColor: colors.line, width: '100%'},
  fill: {height: 4},
});

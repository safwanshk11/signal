import React, {useEffect, useRef} from 'react';
import {Animated, Easing, ViewProps} from 'react-native';
import {duration as durations} from '../theme';

type Props = ViewProps & {
  children: React.ReactNode;
  delay?: number;
};

/**
 * Mount animation using the design system's motion tokens — content rises
 * and fades in on the system's ease-out curve rather than snapping in.
 */
export function Reveal({children, delay = 0, style, ...rest}: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: durations.base,
      delay,
      // cubic-bezier(0.22, 1, 0.36, 1) from the design system's motion spec.
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{translateY: anim.interpolate({inputRange: [0, 1], outputRange: [12, 0]})}],
        },
      ]}
      {...rest}>
      {children}
    </Animated.View>
  );
}

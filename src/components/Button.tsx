import React, {useRef} from 'react';
import {ActivityIndicator, Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, fontFamily, space} from '../theme';
import {HardShadow} from './HardShadow';

type Variant = 'primary' | 'secondary' | 'signal' | 'text';
type Size = 'small' | 'medium' | 'large';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
};

// 44px minimum hit target per the design system's button spec, regardless
// of visual size.
const MIN_HIT_TARGET = 44;
const SHADOW_OFFSET = space[2];

const sizeStyles: Record<Size, {paddingVertical: number; paddingHorizontal: number; fontSize: number}> = {
  small: {paddingVertical: space[2], paddingHorizontal: space[3], fontSize: 13},
  medium: {paddingVertical: space[3], paddingHorizontal: space[4], fontSize: 15},
  large: {paddingVertical: space[4], paddingHorizontal: space[6], fontSize: 17},
};

export function Button({label, onPress, variant = 'primary', size = 'large', disabled, loading}: Props) {
  const sizing = sizeStyles[size];
  const press = useRef(new Animated.Value(0)).current;

  const animateTo = (value: number) => {
    Animated.spring(press, {toValue: value, useNativeDriver: true, speed: 40, bounciness: 0}).start();
  };

  if (variant === 'text') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={() => animateTo(1)}
        onPressOut={() => animateTo(0)}
        style={[styles.textButton, {minHeight: MIN_HIT_TARGET}]}>
        <Animated.Text
          style={[
            styles.textLabel,
            disabled && styles.disabledText,
            {opacity: press.interpolate({inputRange: [0, 1], outputRange: [1, 0.5]})},
          ]}>
          {label} →
        </Animated.Text>
      </Pressable>
    );
  }

  const variantStyle = disabled ? styles.disabled : styles[variant];
  const labelStyle = disabled
    ? styles.disabledLabel
    : variant === 'secondary'
    ? styles.inkLabel
    : styles.paperLabel;

  const translate = press.interpolate({inputRange: [0, 1], outputRange: [0, SHADOW_OFFSET]});

  const body = (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}>
      <Animated.View
        style={[
          styles.base,
          variantStyle,
          {
            paddingVertical: sizing.paddingVertical,
            paddingHorizontal: sizing.paddingHorizontal,
            minHeight: MIN_HIT_TARGET,
            transform: [{translateX: translate}, {translateY: translate}],
          },
        ]}>
        {loading ? (
          <ActivityIndicator color={variant === 'secondary' ? colors.ink : colors.paper} />
        ) : (
          <Text style={[styles.label, {fontSize: sizing.fontSize}, labelStyle]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );

  if (disabled || variant === 'secondary') {
    return <View>{body}</View>;
  }

  // The button visually "pushes into" its own hard shadow on press —
  // the content translates toward the shadow instead of just dimming.
  return <HardShadow>{body}</HardShadow>;
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  primary: {backgroundColor: colors.ink},
  signal: {backgroundColor: colors.signal},
  secondary: {
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  disabled: {backgroundColor: colors.line},
  label: {fontFamily: fontFamily.bodySemiBold, letterSpacing: 0.4},
  paperLabel: {color: colors.paper},
  inkLabel: {color: colors.ink},
  disabledLabel: {color: colors.ink300},
  textButton: {justifyContent: 'center'},
  textLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  disabledText: {color: colors.ink300},
});

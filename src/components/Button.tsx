import React, {useRef} from 'react';
import {ActivityIndicator, Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, fontFamily, space} from '../theme';

type Variant = 'primary' | 'secondary' | 'signal' | 'text' | 'outline';
type Size = 'small' | 'medium' | 'large';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
};

const MIN_HIT_TARGET = 44;

const sizeStyles: Record<Size, {paddingVertical: number; paddingHorizontal: number; fontSize: number}> = {
  small: {paddingVertical: space[2], paddingHorizontal: space[4], fontSize: 13},
  medium: {paddingVertical: space[3], paddingHorizontal: space[5], fontSize: 15},
  large: {paddingVertical: space[4], paddingHorizontal: space[6], fontSize: 16},
};

export function Button({label, onPress, variant = 'primary', size = 'large', disabled, loading}: Props) {
  const sizing = sizeStyles[size];
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  if (variant === 'text') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={() => animateTo(0.95)}
        onPressOut={() => animateTo(1)}
        style={[styles.textButton, {minHeight: MIN_HIT_TARGET}]}>
        <Animated.Text
          style={[
            styles.textLabel,
            disabled && styles.disabledText,
            {transform: [{scale}]},
          ]}>
          {label} →
        </Animated.Text>
      </Pressable>
    );
  }

  const variantStyle = disabled
    ? (variant === 'outline' || variant === 'secondary' ? styles.disabledOutline : styles.disabled)
    : styles[variant];

  const labelStyle = disabled
    ? styles.disabledLabel
    : variant === 'secondary' || variant === 'outline'
    ? styles.inkLabel
    : styles.paperLabel;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => animateTo(0.97)}
      onPressOut={() => animateTo(1)}>
      <Animated.View
        style={[
          styles.base,
          variantStyle,
          {
            paddingVertical: sizing.paddingVertical,
            paddingHorizontal: sizing.paddingHorizontal,
            minHeight: MIN_HIT_TARGET,
            transform: [{scale}],
          },
        ]}>
        {loading ? (
          <ActivityIndicator color={variant === 'secondary' || variant === 'outline' ? colors.ink : colors.paper} />
        ) : (
          <Text style={[styles.label, {fontSize: sizing.fontSize}, labelStyle]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  primary: {
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  signal: {
    backgroundColor: colors.signal,
    borderWidth: 2,
    borderColor: colors.signal,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  disabledOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.line,
  },
  disabled: {
    backgroundColor: colors.line,
    borderWidth: 2,
    borderColor: colors.line,
  },
  label: {
    fontFamily: fontFamily.bodySemiBold,
    letterSpacing: 0.4,
  },
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

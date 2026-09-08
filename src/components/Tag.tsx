import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, fontFamily, radius, space} from '../theme';

type Variant = 'wash' | 'solid' | 'outline' | 'live';

type Props = {
  label: string;
  variant?: Variant;
  color?: string;
};

// Pills are reserved for status pieces (tags/badges) — never buttons or
// cards, per the design system's do/don't rules.
export function Tag({label, variant = 'outline', color}: Props) {
  if (variant === 'live') {
    return (
      <View style={[styles.base, styles.outline]}>
        <View style={[styles.dot, {backgroundColor: color ?? colors.success}]} />
        <Text style={styles.outlineLabel}>{label}</Text>
      </View>
    );
  }

  const variantStyle = variant === 'solid' ? styles.solid : variant === 'wash' ? styles.wash : styles.outline;
  const labelStyle = variant === 'solid' ? styles.solidLabel : styles.outlineLabel;

  return (
    <View style={[styles.base, variantStyle]}>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingVertical: space[1],
    paddingHorizontal: space[3],
    alignSelf: 'flex-start',
    gap: space[1],
  },
  wash: {backgroundColor: colors.sparkWash},
  solid: {backgroundColor: colors.ink},
  outline: {backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.ink},
  solidLabel: {fontFamily: fontFamily.monoMedium, fontSize: 11, color: colors.paper, letterSpacing: 0.4},
  outlineLabel: {fontFamily: fontFamily.monoMedium, fontSize: 11, color: colors.ink, letterSpacing: 0.4},
  dot: {width: 6, height: 6, borderRadius: 3},
});

import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {colors, fontFamily} from '../theme';

type Props = {
  active: boolean;
  onPress: () => void;
};

/** Small control docked near top controls to toggle hand skeleton overlay ON/OFF. */
export function SkeletonToggleButton({active, onPress}: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, active && styles.activeButton]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={8}>
      <Text style={[styles.text, active && styles.activeText]}>
        {active ? 'SKELETON ON' : 'SKELETON OFF'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(18,17,15,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: colors.spark,
    borderColor: colors.ink,
  },
  text: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 9,
    letterSpacing: 0.6,
    color: colors.paper,
  },
  activeText: {
    color: colors.ink,
  },
});

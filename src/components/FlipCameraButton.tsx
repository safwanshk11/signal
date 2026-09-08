import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {colors, fontFamily} from '../theme';

type Props = {
  onPress: () => void;
};

/** Small circular control that toggles front/back camera, docked top-right. */
export function FlipCameraButton({onPress}: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.7} hitSlop={12}>
      <Text style={styles.glyph}>⟲</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(18,17,15,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 20,
    color: colors.paper,
  },
});

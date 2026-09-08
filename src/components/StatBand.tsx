import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, fontFamily, space} from '../theme';

type Stat = {value: string; label: string; accent?: string};

/** The design system's black stat band — big numbers, mono caption labels. */
export function StatBand({stats}: {stats: Stat[]}) {
  return (
    <View style={styles.band}>
      {stats.map((s, i) => (
        <View key={i} style={styles.stat}>
          <Text
            style={[styles.value, s.accent ? {color: s.accent} : null]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}>
            {s.value}
          </Text>
          <Text style={styles.label} numberOfLines={2}>
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row',
    backgroundColor: colors.ink,
    padding: space[4],
    gap: space[4],
  },
  stat: {flex: 1, gap: space[1]},
  value: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors.paper,
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.ink300,
    textTransform: 'uppercase',
  },
});

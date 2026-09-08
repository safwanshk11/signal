import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import {colors, fontFamily, space} from '../theme';

type Props = {
  items: string[];
  /** Pixels per second. */
  speed?: number;
};

/**
 * The design system's scrolling marquee band — ink ground, expanded display
 * caps, spark diamonds as separators. Content is rendered twice and
 * translated by exactly one copy's width, so the loop is seamless.
 */
export function Marquee({items, speed = 45}: Props) {
  const translate = useRef(new Animated.Value(0)).current;
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    if (contentWidth === 0) return;

    translate.setValue(0);
    const animation = Animated.loop(
      Animated.timing(translate, {
        toValue: -contentWidth,
        duration: (contentWidth / speed) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [contentWidth, speed, translate]);

  if (items.length === 0) return null;

  const renderRun = (key: string, onLayout?: (w: number) => void) => (
    <View
      key={key}
      style={styles.run}
      onLayout={onLayout ? e => onLayout(e.nativeEvent.layout.width) : undefined}>
      {items.map((item, i) => (
        <View key={`${key}-${i}`} style={styles.item}>
          <Text style={styles.text}>{item.toUpperCase()}</Text>
          <Text style={styles.diamond}>◆</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.band}>
      <Animated.View style={[styles.track, {transform: [{translateX: translate}]}]}>
        {renderRun('a', setContentWidth)}
        {renderRun('b')}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.ink,
    paddingVertical: space[3],
    overflow: 'hidden',
  },
  track: {flexDirection: 'row'},
  run: {flexDirection: 'row'},
  item: {flexDirection: 'row', alignItems: 'center'},
  text: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: colors.paper,
  },
  diamond: {
    fontSize: 12,
    color: colors.spark,
    marginHorizontal: space[4],
  },
});

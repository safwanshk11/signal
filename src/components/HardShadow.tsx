import React, {useState} from 'react';
import {LayoutChangeEvent, StyleSheet, View, ViewProps} from 'react-native';
import {colors, space} from '../theme';

type Props = ViewProps & {
  offset?: number;
  children: React.ReactNode;
};

/**
 * The design system's "shadow-hard" token — an 8px solid ink offset, no
 * blur — implemented as a same-shaped ink block behind the content rather
 * than a native shadow, since Android's elevation can't produce a hard
 * offset and iOS/Android shadow rendering would otherwise diverge.
 */
export function HardShadow({offset = space[2], children, style, ...rest}: Props) {
  const [size, setSize] = useState({width: 0, height: 0});

  const onLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    setSize({width, height});
  };

  return (
    <View style={[styles.wrap, {paddingRight: offset, paddingBottom: offset}, style]} {...rest}>
      <View
        pointerEvents="none"
        style={[styles.shadow, {top: offset, left: offset, width: size.width, height: size.height}]}
      />
      <View style={styles.content} onLayout={onLayout}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {position: 'relative', alignSelf: 'stretch'},
  shadow: {
    position: 'absolute',
    backgroundColor: colors.ink,
  },
  content: {backgroundColor: colors.paperRaised},
});

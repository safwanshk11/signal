import React from 'react';
import {StyleSheet, View, ViewProps} from 'react-native';
import {colors, space} from '../theme';

interface CameraFrameProps extends ViewProps {
  children?: React.ReactNode;
}

export function CameraFrame({children, style, ...props}: CameraFrameProps) {
  return (
    <View style={[styles.container, style]} pointerEvents="box-none" {...props}>
      <View style={styles.frame} pointerEvents="box-none">
        {/* Top Left Corner */}
        <View style={[styles.corner, styles.topLeftCorner]} />
        <View style={[styles.cornerEdge, styles.topLeftEdgeHorizontal]} />
        <View style={[styles.cornerEdge, styles.topLeftEdgeVertical]} />

        {/* Top Right Corner */}
        <View style={[styles.corner, styles.topRightCorner]} />
        <View style={[styles.cornerEdge, styles.topRightEdgeHorizontal]} />
        <View style={[styles.cornerEdge, styles.topRightEdgeVertical]} />

        {/* Bottom Left Corner */}
        <View style={[styles.corner, styles.bottomLeftCorner]} />
        <View style={[styles.cornerEdge, styles.bottomLeftEdgeHorizontal]} />
        <View style={[styles.cornerEdge, styles.bottomLeftEdgeVertical]} />

        {/* Bottom Right Corner */}
        <View style={[styles.corner, styles.bottomRightCorner]} />
        <View style={[styles.cornerEdge, styles.bottomRightEdgeHorizontal]} />
        <View style={[styles.cornerEdge, styles.bottomRightEdgeVertical]} />

        {/* Reticle */}
        <View style={styles.reticleHorizontal} />
        <View style={styles.reticleVertical} />
      </View>
      {children}
    </View>
  );
}

const BORDER_WIDTH = 3;
const CORNER_SIZE = 32;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: '80%',
    aspectRatio: 3 / 4,
    position: 'relative',
    maxWidth: 400,
    maxHeight: 500,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  cornerEdge: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderTopWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
  },
  topLeftEdgeHorizontal: {
    top: 0,
    left: 0,
    width: CORNER_SIZE,
    height: BORDER_WIDTH,
  },
  topLeftEdgeVertical: {
    top: 0,
    left: 0,
    width: BORDER_WIDTH,
    height: CORNER_SIZE,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderTopWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
  },
  topRightEdgeHorizontal: {
    top: 0,
    right: 0,
    width: CORNER_SIZE,
    height: BORDER_WIDTH,
  },
  topRightEdgeVertical: {
    top: 0,
    right: 0,
    width: BORDER_WIDTH,
    height: CORNER_SIZE,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
  },
  bottomLeftEdgeHorizontal: {
    bottom: 0,
    left: 0,
    width: CORNER_SIZE,
    height: BORDER_WIDTH,
  },
  bottomLeftEdgeVertical: {
    bottom: 0,
    left: 0,
    width: BORDER_WIDTH,
    height: CORNER_SIZE,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
  },
  bottomRightEdgeHorizontal: {
    bottom: 0,
    right: 0,
    width: CORNER_SIZE,
    height: BORDER_WIDTH,
  },
  bottomRightEdgeVertical: {
    bottom: 0,
    right: 0,
    width: BORDER_WIDTH,
    height: CORNER_SIZE,
  },
  reticleHorizontal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{translateX: -12}, {translateY: -0.5}],
  },
  reticleVertical: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{translateX: -0.5}, {translateY: -12}],
  },
});

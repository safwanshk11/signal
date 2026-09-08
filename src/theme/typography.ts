import {TextStyle} from 'react-native';
import {colors} from './colors';

// Static instances cut from the Archivo variable font at the design
// system's exact axis values (wdth 125 = "Expanded", wght 800/700), plus
// standard-width weights for UI/body text. See assets/fonts/ and README.
export const fontFamily = {
  displayExtraBold: 'ArchivoExpanded-ExtraBold', // Archivo wdth 125 · 800
  displayBold: 'ArchivoExpanded-Bold', // Archivo wdth 125 · 700
  bodyRegular: 'Archivo-Regular',
  bodyMedium: 'Archivo-Medium',
  bodySemiBold: 'Archivo-SemiBold',
  bodyBold: 'Archivo-Bold',
  mono: 'IBMPlexMono-Regular',
  monoMedium: 'IBMPlexMono-Medium',
} as const;

// Desktop tokens (DISPLAY-XL 96/0.86, DISPLAY-L 56/0.92, HEADING-M 28/1.15,
// BODY-L 20/1.45, BODY-M 16/1.55) scaled down for a phone viewport while
// keeping the same weight/tracking relationships.
export const type: Record<string, TextStyle> = {
  displayXL: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: 44,
    lineHeight: 44 * 0.92,
    letterSpacing: -44 * 0.03,
    color: colors.ink,
  },
  displayL: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: 30,
    lineHeight: 30 * 0.98,
    letterSpacing: -30 * 0.02,
    color: colors.ink,
  },
  headingM: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 22,
    lineHeight: 22 * 1.15,
    color: colors.ink,
  },
  bodyL: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 17,
    lineHeight: 17 * 1.45,
    color: colors.ink700,
  },
  bodyM: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 15,
    lineHeight: 15 * 1.5,
    color: colors.ink700,
  },
  // Meta, dates, numbers, eyebrows — always mono, always caps, wide tracking.
  monoCaption: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 11 * 1.4,
    letterSpacing: 11 * 0.08,
    color: colors.ink500,
    textTransform: 'uppercase',
  },
  monoLabel: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 13,
    lineHeight: 13 * 1.4,
    letterSpacing: 13 * 0.04,
    color: colors.ink,
  },
} as const;

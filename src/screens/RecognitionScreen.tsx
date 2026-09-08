import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {LandmarkCamera} from '../camera/LandmarkCamera';
import {useGestureRecorder, RECORDING_DURATION_MS} from '../camera/gestureRecorder';
import {extractGestureFeatures} from '../ml/gestureFeatures';
import {classifyGesture} from '../ml/classifier';
import {getAllSigns} from '../storage/signRepository';
import {addHistoryEntry} from '../storage/historyRepository';
import {RecognitionResult} from '../ml/types';
import {speak} from '../speech/speak';
import {Stopwatch, logLatency} from '../utils/latency';
import {FlipCameraButton} from '../components/FlipCameraButton';
import {ProgressBar} from '../components/ProgressBar';
import {colors, fontFamily, space, type} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Recognition'>;

export function RecognitionScreen(_props: Props) {
  const recorder = useGestureRecorder();
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const [handPresent, setHandPresent] = useState(false);
  const isRecording = recorder.status === 'recording';

  // Pulse animation for the idle FAB ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Result card slide-in
  const resultSlide = useRef(new Animated.Value(80)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isRecording && !result) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseLoop.current?.stop();
  }, [isRecording, result, pulseAnim]);

  useEffect(() => {
    if (result) {
      resultSlide.setValue(80);
      resultOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(resultSlide, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
        Animated.timing(resultOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [result, resultSlide, resultOpacity]);

  useEffect(() => {
    if (recorder.status !== 'done') return;

    const frames = recorder.getFrames();
    const sw = new Stopwatch();
    sw.mark('landmarks');

    if (frames.length === 0) {
      setResult({label: null, confidence: 0});
      addHistoryEntry(null, 0);
      recorder.reset();
      return;
    }

    const landmarkExtractionMs = sw.elapsedSince('landmarks');
    sw.mark('features');
    const featureVector = extractGestureFeatures(frames);
    const featureProcessingMs = sw.elapsedSince('features');

    sw.mark('classify');
    const recognized = classifyGesture(featureVector, getAllSigns());
    const classificationMs = sw.elapsedSince('classify');

    logLatency('recognize', {
      landmarkExtractionMs,
      featureProcessingMs,
      classificationMs,
      totalMs: sw.totalElapsed(),
    });

    setResult(recognized);
    addHistoryEntry(recognized.label, recognized.confidence);
    recorder.reset();

    if (recognized.label) speak(recognized.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.status]);

  const handleFabPress = () => {
    if (result) {
      // Second tap: clear result and ready for next
      setResult(null);
    } else if (!isRecording) {
      recorder.start();
    }
  };

  const fabLabel = isRecording ? 'READING…' : result ? 'TAP AGAIN' : handPresent ? 'TAP TO READ' : 'SHOW HAND';
  const fabSublabel = isRecording
    ? 'Hold your sign steady'
    : result
    ? 'Clear & recognize again'
    : handPresent
    ? 'Hand detected'
    : 'Raise your hand';

  return (
    <View style={styles.container}>
      <LandmarkCamera
        onFrame={recorder.pushFrame}
        position={cameraPosition}
        onHandPresenceChange={setHandPresent}
      />

      {/* Top bar */}
      <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
        <View style={styles.handPill}>
          <View style={[styles.handDot, {backgroundColor: handPresent ? colors.spark : colors.ink300}]} />
          <Text style={styles.handText}>{handPresent ? 'HAND DETECTED' : 'NO HAND'}</Text>
        </View>
        <FlipCameraButton
          onPress={() => setCameraPosition(p => (p === 'front' ? 'back' : 'front'))}
        />
      </SafeAreaView>

      {/* Recording progress bar at very top */}
      <ProgressBar active={isRecording} durationMs={RECORDING_DURATION_MS} />

      {/* Result card — slides up from bottom */}
      {result && (
        <Animated.View
          style={[
            styles.resultCard,
            {transform: [{translateY: resultSlide}], opacity: resultOpacity},
          ]}>
          <Text style={styles.resultEyebrow}>
            {result.label ? 'RECOGNIZED' : 'NOT SURE'}
          </Text>
          <Text
            style={[
              styles.resultWord,
              !result.label && {color: colors.caution},
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {result.label ? result.label.toUpperCase() : '—'}
          </Text>
          <Text style={styles.resultConfidence}>
            {Math.round(result.confidence * 100)}% confidence
          </Text>
        </Animated.View>
      )}

      {/* Floating Action Button */}
      <SafeAreaView style={styles.fabArea} edges={['bottom']} pointerEvents="box-none">
        <Pressable
          onPress={handleFabPress}
          disabled={isRecording}
          style={({pressed}) => [{opacity: pressed ? 0.85 : 1}]}>
          <View style={styles.fabWrapper}>
            {/* Pulse ring — only visible when idle & no result */}
            {!isRecording && !result && (
              <Animated.View
                style={[
                  styles.fabRing,
                  {transform: [{scale: pulseAnim}]},
                ]}
              />
            )}
            {/* Core button */}
            <View
              style={[
                styles.fab,
                isRecording && styles.fabRecording,
                result && styles.fabResult,
              ]}>
              <Text style={styles.fabLabel}>{fabLabel}</Text>
            </View>
          </View>
          <Text style={styles.fabSublabel}>{fabSublabel}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const FAB_SIZE = 148;
const RING_SIZE = FAB_SIZE + 28;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.ink},

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space[4],
  },
  handPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: 'rgba(18,17,15,0.6)',
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    marginTop: space[4],
  },
  handDot: {width: 8, height: 8},
  handText: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.paper,
  },

  // Result card
  resultCard: {
    position: 'absolute',
    top: '28%',
    left: space[6],
    right: space[6],
    backgroundColor: 'rgba(18,17,15,0.82)',
    padding: space[6],
    gap: space[1],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultEyebrow: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.spark,
  },
  resultWord: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -1.5,
    color: colors.paper,
  },
  resultConfidence: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: 'rgba(247,245,240,0.5)',
    letterSpacing: 0.4,
  },

  // FAB
  fabArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: space[8],
    gap: space[3],
  },
  fabWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(224,225,17,0.35)',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.spark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
  },
  fabRecording: {
    backgroundColor: colors.signal,
    borderColor: '#8B0000',
  },
  fabResult: {
    backgroundColor: colors.paperRaised,
    borderColor: colors.ink,
  },
  fabLabel: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: 13,
    letterSpacing: 1.2,
    color: colors.ink,
    textAlign: 'center',
  },
  fabSublabel: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    color: 'rgba(247,245,240,0.55)',
    textAlign: 'center',
    marginTop: space[2],
  },
});

import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
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
import {Button} from '../components/Button';
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

  // Result card slide-in animation
  const resultSlide = useRef(new Animated.Value(80)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

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

  const handleRecognize = () => {
    setResult(null);
    recorder.start();
  };

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

      {/* Result card — slides up from behind the bottom sheet */}
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

      {/* Bottom sheet — original style */}
      <View style={styles.sheet}>
        <ProgressBar active={isRecording} durationMs={RECORDING_DURATION_MS} />
        <SafeAreaView style={styles.sheetBody} edges={['bottom']}>
          {!result && (
            <View style={styles.promptRow}>
              <Text style={type.headingM}>
                {isRecording ? 'Hold the sign…' : 'Show me a sign'}
              </Text>
              <Text style={[type.monoCaption, styles.hint]}>
                {isRecording ? 'RECORDING' : handPresent ? 'READY' : 'RAISE YOUR HAND'}
              </Text>
            </View>
          )}
          <Button
            label={result ? 'Again' : 'Recognize'}
            variant="outline"
            onPress={handleRecognize}
            disabled={isRecording}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}

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

  // Result card — floats over the camera, above the sheet
  resultCard: {
    position: 'absolute',
    bottom: 180,
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

  // Bottom sheet — original
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.paperRaised,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
  },
  sheetBody: {padding: space[6], gap: space[4]},
  promptRow: {gap: space[1]},
  hint: {color: colors.ink300},
});

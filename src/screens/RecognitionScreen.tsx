import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
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
import {StatBand} from '../components/StatBand';
import {ProgressBar} from '../components/ProgressBar';
import {Reveal} from '../components/Reveal';
import {colors, fontFamily, space, type} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Recognition'>;

export function RecognitionScreen(_props: Props) {
  const recorder = useGestureRecorder();
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const [handPresent, setHandPresent] = useState(false);
  const isRecording = recorder.status === 'recording';

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

      <SafeAreaView style={styles.topControls} edges={['top']} pointerEvents="box-none">
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, {backgroundColor: handPresent ? colors.spark : colors.ink300}]} />
          <Text style={styles.statusText}>{handPresent ? 'HAND DETECTED' : 'NO HAND'}</Text>
        </View>
        <FlipCameraButton
          onPress={() => setCameraPosition(p => (p === 'front' ? 'back' : 'front'))}
        />
      </SafeAreaView>

      <View style={styles.sheet}>
        <ProgressBar active={isRecording} durationMs={RECORDING_DURATION_MS} />
        <SafeAreaView style={styles.sheetBody} edges={['bottom']}>
          {result ? (
            <Reveal key={`${result.label}-${result.confidence}`}>
              <StatBand
                stats={[
                  result.label
                    ? {
                        value: result.label.toUpperCase(),
                        label: `${Math.round(result.confidence * 100)}% match`,
                        accent: colors.spark,
                      }
                    : {
                        value: 'NOT SURE',
                        label: `${Math.round(result.confidence * 100)}% — below threshold`,
                        accent: colors.caution,
                      },
                ]}
              />
            </Reveal>
          ) : (
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
            variant="signal"
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
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: space[4],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: 'rgba(18,17,15,0.55)',
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    marginTop: space[4],
  },
  statusDot: {width: 8, height: 8},
  statusText: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.paper,
  },
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

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {LandmarkCamera} from '../camera/LandmarkCamera';
import {useGestureRecorder, RECORDING_DURATION_MS} from '../camera/gestureRecorder';
import {extractGestureFeatures} from '../ml/gestureFeatures';
import {classifyGesture} from '../ml/classifier';
import {UserSign} from '../ml/types';
import {getAllSigns} from '../storage/signRepository';
import {addQuizAttempt} from '../storage/quizRepository';
import {speak} from '../speech/speak';
import {Button} from '../components/Button';
import {CameraFrame} from '../components/CameraFrame';
import {StatBand} from '../components/StatBand';
import {FlipCameraButton} from '../components/FlipCameraButton';
import {ProgressBar} from '../components/ProgressBar';
import {Reveal} from '../components/Reveal';
import {colors, space, type} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;
type RoundResult = {correct: boolean; predictedLabel: string | null; confidence: number};

function pickTarget(signs: UserSign[], excludeId?: string): UserSign {
  const pool = signs.length > 1 ? signs.filter(s => s.id !== excludeId) : signs;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function QuizScreen({navigation}: Props) {
  const [signs, setSigns] = useState<UserSign[]>([]);
  const [target, setTarget] = useState<UserSign | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [session, setSession] = useState({correct: 0, total: 0});
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const recorder = useGestureRecorder();

  useFocusEffect(
    useCallback(() => {
      const all = getAllSigns();
      setSigns(all);
      if (all.length > 0) setTarget(pickTarget(all));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  useEffect(() => {
    if (recorder.status !== 'done' || !target) return;

    const frames = recorder.getFrames();
    if (frames.length === 0) {
      setResult({correct: false, predictedLabel: null, confidence: 0});
      recorder.reset();
      return;
    }

    const featureVector = extractGestureFeatures(frames);
    const recognized = classifyGesture(featureVector, signs);
    const correct = recognized.label === target.label;

    addQuizAttempt(target.id, correct, recognized.confidence);
    setSession(s => ({correct: s.correct + (correct ? 1 : 0), total: s.total + 1}));
    setResult({correct, predictedLabel: recognized.label, confidence: recognized.confidence});
    recorder.reset();

    if (recognized.label) speak(recognized.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.status]);

  const nextRound = () => {
    setResult(null);
    setTarget(t => pickTarget(signs, t?.id));
  };

  const scoreLabel = useMemo(
    () => `${session.correct}/${session.total} THIS SESSION`,
    [session],
  );

  if (signs.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={type.headingM}>Nothing to practice yet.</Text>
        <Text style={[type.bodyM, styles.hint]}>Teach SIGNAL a sign first, then come back here.</Text>
        <Button label="Back to Home" variant="text" onPress={() => navigation.navigate('Home')} />
      </SafeAreaView>
    );
  }

  if (!target) return null;

  return (
    <View style={styles.container}>
      <LandmarkCamera onFrame={recorder.pushFrame} position={cameraPosition} />
      <CameraFrame recording={recorder.status === 'recording'} />

      <SafeAreaView style={styles.topControls} edges={['top']} pointerEvents="box-none">
        <FlipCameraButton
          onPress={() => setCameraPosition(p => (p === 'front' ? 'back' : 'front'))}
        />
      </SafeAreaView>

      <View style={styles.sheet}>
        <ProgressBar active={recorder.status === 'recording'} durationMs={RECORDING_DURATION_MS} />
        <SafeAreaView style={styles.sheetBody} edges={['bottom']}>
          <View style={styles.overlayHeader}>
            <Text style={type.monoCaption}>PRACTICE</Text>
            <Text style={type.monoCaption}>{scoreLabel}</Text>
          </View>

          {!result && (
            <View style={styles.promptRow}>
              <Text style={[type.monoCaption, styles.promptEyebrow]}>SHOW ME</Text>
              <Text style={type.displayL}>{target.label}</Text>
            </View>
          )}

          {result && (
            <Reveal key={`${target.id}-${session.total}`}>
              <StatBand
                stats={[
                  result.correct
                    ? {value: 'CORRECT', label: target.label, accent: colors.spark}
                    : {
                        value: 'TRY AGAIN',
                        label: result.predictedLabel
                          ? `Saw "${result.predictedLabel}" instead`
                          : 'Not recognized',
                        accent: colors.caution,
                      },
                ]}
              />
            </Reveal>
          )}

          <Button
            label={result ? 'Next Sign' : 'Recognize'}
            variant="signal"
            onPress={result ? nextRound : () => recorder.start()}
            disabled={recorder.status === 'recording'}
          />
          <Button label="End Practice" variant="text" onPress={() => navigation.navigate('Home')} />
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.ink},
  emptyContainer: {flex: 1, backgroundColor: colors.paper, padding: space[6], justifyContent: 'center'},
  hint: {marginTop: space[2], marginBottom: space[8]},
  topControls: {position: 'absolute', top: 0, left: 0, right: 0},
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.paperRaised,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
  },
  sheetBody: {padding: space[6], gap: space[3]},
  overlayHeader: {flexDirection: 'row', justifyContent: 'space-between'},
  promptRow: {gap: space[1]},
  promptEyebrow: {color: colors.signal},
});

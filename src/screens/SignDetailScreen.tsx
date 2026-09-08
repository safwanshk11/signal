import React, {useCallback, useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {LandmarkCamera} from '../camera/LandmarkCamera';
import {useGestureRecorder} from '../camera/gestureRecorder';
import {extractGestureFeatures} from '../ml/gestureFeatures';
import {UserSign} from '../ml/types';
import {addSampleToSign, deleteSign, getSignById} from '../storage/signRepository';
import {getQuizAttemptsForSign} from '../storage/quizRepository';
import {Button} from '../components/Button';
import {StatBand} from '../components/StatBand';
import {FlipCameraButton} from '../components/FlipCameraButton';
import {colors, fontFamily, space, type} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignDetail'>;

export function SignDetailScreen({route, navigation}: Props) {
  const {signId} = route.params;
  const [sign, setSign] = useState<UserSign | undefined>(undefined);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [recording, setRecording] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const recorder = useGestureRecorder();

  const reload = useCallback(() => {
    const s = getSignById(signId);
    setSign(s);
    const attempts = getQuizAttemptsForSign(signId);
    setAttemptCount(attempts.length);
    setAccuracy(attempts.length > 0 ? attempts.filter(a => a.correct).length / attempts.length : null);
  }, [signId]);

  useFocusEffect(reload);

  useEffect(() => {
    if (recorder.status !== 'done') return;

    const frames = recorder.getFrames();
    if (frames.length === 0) {
      Alert.alert('No hand detected', 'Please try again, keeping your hand in frame.');
      recorder.reset();
      setRecording(false);
      return;
    }

    const featureVector = extractGestureFeatures(frames);
    addSampleToSign(signId, {frames, featureVector});
    recorder.reset();
    setRecording(false);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.status]);

  const confirmDelete = () => {
    if (!sign) return;
    Alert.alert('Delete sign', `Remove "${sign.label}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSign(sign.id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!sign) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={type.bodyM}>This sign no longer exists.</Text>
        <Button label="Back to My Signs" variant="text" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  if (recording) {
    return (
      <View style={styles.container}>
        <LandmarkCamera onFrame={recorder.pushFrame} position={cameraPosition} />
        <SafeAreaView style={styles.topControls} edges={['top']} pointerEvents="box-none">
          <FlipCameraButton
            onPress={() => setCameraPosition(p => (p === 'front' ? 'back' : 'front'))}
          />
        </SafeAreaView>
        <View style={styles.overlay}>
          <Text style={type.headingM}>Perform "{sign.label}" once more.</Text>
          <Button
            label={recorder.status === 'recording' ? 'Recording…' : 'Record Example'}
            variant="signal"
            onPress={() => recorder.start()}
            disabled={recorder.status === 'recording'}
          />
        </View>
      </View>
    );
  }

  const stats = [
    {value: String(sign.samples.length), label: 'Examples'},
    ...(accuracy !== null
      ? [
          {
            value: `${Math.round(accuracy * 100)}%`,
            label: `Quiz accuracy · ${attemptCount} ${attemptCount === 1 ? 'try' : 'tries'}`,
            accent: colors.spark,
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={type.monoCaption}>
          CREATED {new Date(sign.createdAt).toLocaleDateString()}
        </Text>
        <Text style={type.displayL}>{sign.label}</Text>
        <View style={styles.rule} />
        <StatBand stats={stats} />
      </View>

      <View style={styles.actions}>
        <Button label="Add Another Example" variant="secondary" onPress={() => setRecording(true)} />
        <View style={styles.secondaryActions}>
          <Button label="Back to My Signs" variant="text" onPress={() => navigation.goBack()} />
          <TouchableOpacity onPress={confirmDelete} hitSlop={space[2]}>
            <Text style={styles.delete}>DELETE SIGN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.paper, padding: space[6], justifyContent: 'space-between'},
  rule: {height: 2, backgroundColor: colors.ink, marginTop: space[4], marginBottom: space[6]},
  actions: {gap: space[3]},
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  delete: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 11,
    letterSpacing: 0.4,
    color: colors.critical,
  },
  topControls: {position: 'absolute', top: 0, left: 0, right: 0},
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.paperRaised,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
    padding: space[6],
    gap: space[3],
  },
});

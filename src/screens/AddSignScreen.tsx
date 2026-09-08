import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {LandmarkCamera} from '../camera/LandmarkCamera';
import {useGestureRecorder, RECORDING_DURATION_MS} from '../camera/gestureRecorder';
import {extractGestureFeatures} from '../ml/gestureFeatures';
import {GestureSample} from '../ml/types';
import {createSign} from '../storage/signRepository';
import {Stopwatch} from '../utils/latency';
import {Button} from '../components/Button';
import {Tag} from '../components/Tag';
import {FlipCameraButton} from '../components/FlipCameraButton';
import {ProgressBar} from '../components/ProgressBar';
import {Reveal} from '../components/Reveal';
import {colors, fontFamily, space, type} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddSign'>;
const SAMPLES_NEEDED = 5;

export function AddSignScreen({navigation}: Props) {
  const [step, setStep] = useState<'name' | 'record' | 'done'>('name');
  const [label, setLabel] = useState('');
  const [samples, setSamples] = useState<GestureSample[]>([]);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const [handPresent, setHandPresent] = useState(false);
  const recorder = useGestureRecorder();
  const isRecording = recorder.status === 'recording';

  useEffect(() => {
    if (recorder.status !== 'done') return;

    const frames = recorder.getFrames();
    if (frames.length === 0) {
      Alert.alert('No hand detected', 'Please try that sample again, keeping your hand in frame.');
      recorder.reset();
      return;
    }

    const sw = new Stopwatch();
    sw.mark('start');
    const featureVector = extractGestureFeatures(frames);
    console.log(
      `[AddSign] sample ${samples.length + 1}/${SAMPLES_NEEDED}: ${frames.length} frames -> ` +
        `${featureVector.length} features in ${sw.elapsedSince('start')}ms`,
    );

    setSamples(prev => [...prev, {frames, featureVector}]);
    recorder.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.status]);

  useEffect(() => {
    if (samples.length === SAMPLES_NEEDED) {
      createSign(label, samples);
      setStep('done');
    }
  }, [samples, label]);

  if (step === 'name') {
    return (
      <SafeAreaView style={styles.container}>
        <View>
          <Text style={[type.monoCaption, styles.eyebrow]}>STEP 1 / 2</Text>
          <Text style={type.displayL}>Teach SIGNAL{'\n'}a sign.</Text>
          <View style={styles.rule} />

          <Text style={[type.monoCaption, styles.label]}>WHAT DOES THIS SIGN MEAN?</Text>
          <TextInput
            style={[type.bodyL, styles.input]}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Water"
            placeholderTextColor={colors.ink300}
            autoFocus
          />
        </View>
        <Button label="Next" onPress={() => setStep('record')} disabled={!label.trim()} />
      </SafeAreaView>
    );
  }

  if (step === 'record') {
    const currentSample = Math.min(samples.length + 1, SAMPLES_NEEDED);
    return (
      <View style={styles.cameraContainer}>
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
            <View style={styles.overlayHeader}>
              <Text style={[type.monoCaption, styles.recordEyebrow]}>
                "{label.toUpperCase()}" · SAMPLE {currentSample}/{SAMPLES_NEEDED}
              </Text>
              <Tag
                label={isRecording ? 'RECORDING' : 'READY'}
                variant="live"
                color={isRecording ? colors.signal : colors.success}
              />
            </View>

            <Text style={type.headingM}>
              {isRecording ? 'Hold the sign…' : 'Perform your sign naturally.'}
            </Text>

            <View style={styles.dotsRow}>
              {Array.from({length: SAMPLES_NEEDED}).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < samples.length && styles.dotDone,
                    i === samples.length && styles.dotCurrent,
                  ]}
                />
              ))}
            </View>

            <Button
              label={isRecording ? 'Recording…' : 'Record Sample'}
              variant="signal"
              onPress={() => recorder.start()}
              disabled={isRecording}
            />
          </SafeAreaView>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Reveal>
        <Text style={[type.monoCaption, styles.eyebrow]}>SIGN SAVED</Text>
        <Text style={type.displayL}>{label} learned.</Text>
        <Text style={[type.bodyM, styles.hint]}>
          SIGNAL saved 5 examples of this sign locally — nothing left this device.
        </Text>
      </Reveal>
      <View style={styles.doneActions}>
        <Button label="Try It" variant="signal" onPress={() => navigation.replace('Recognition')} />
        <View style={styles.backLink}>
          <Button label="Back to Home" variant="text" onPress={() => navigation.navigate('Home')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.paper, padding: space[6], justifyContent: 'space-between'},
  eyebrow: {color: colors.signal, marginTop: space[8], marginBottom: space[3]},
  rule: {height: 2, backgroundColor: colors.ink, marginTop: space[6], marginBottom: space[6]},
  label: {marginBottom: space[2]},
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    padding: space[4],
  },
  cameraContainer: {flex: 1, backgroundColor: colors.ink},
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
  sheetBody: {padding: space[6], gap: space[3]},
  recordEyebrow: {color: colors.ink500},
  overlayHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  dotsRow: {flexDirection: 'row', alignItems: 'center', gap: space[2]},
  dot: {width: 14, height: 14, borderWidth: 1, borderColor: colors.ink300},
  dotDone: {backgroundColor: colors.ink, borderColor: colors.ink},
  dotCurrent: {borderColor: colors.signal, borderWidth: 2},
  hint: {marginTop: space[3]},
  doneActions: {gap: space[2]},
  backLink: {alignItems: 'flex-start'},
});

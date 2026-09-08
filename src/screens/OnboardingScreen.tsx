import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {Button} from '../components/Button';
import {markOnboardingComplete} from '../storage/onboarding';
import {colors, space, type} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const STEPS = [
  {
    n: '01',
    title: 'Show it a sign.',
    body: 'Any gesture — a family sign, a home sign, one you make up right now. Perform it 5 times.',
  },
  {
    n: '02',
    title: 'It learns, right here.',
    body: 'No upload, no account. The camera feed never leaves this phone — only the shape of your hand is remembered.',
  },
  {
    n: '03',
    title: 'It says the word.',
    body: 'Show the same sign again and SIGNAL recognizes it — and speaks it, out loud.',
  },
];

export function OnboardingScreen({navigation}: Props) {
  const finish = () => {
    markOnboardingComplete();
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[type.monoCaption, styles.eyebrow]}>WELCOME TO SIGNAL</Text>
        <Text style={[type.displayL, styles.headline]}>Your signs.{'\n'}Your language.</Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map(s => (
          <View key={s.n} style={styles.step}>
            <Text style={[type.monoCaption, styles.stepNumber]}>{s.n}</Text>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={[type.bodyM, styles.stepBody]}>{s.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View>
        <Button label="Get Started" variant="signal" onPress={finish} />
        <Text style={[type.monoCaption, styles.footer]}>RUNS PRIVATELY ON THIS DEVICE</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: space[6],
    justifyContent: 'space-between',
  },
  header: {marginTop: space[8]},
  eyebrow: {color: colors.signal, marginBottom: space[3]},
  headline: {color: colors.ink},
  steps: {gap: space[8]},
  step: {flexDirection: 'row', gap: space[4]},
  stepNumber: {color: colors.ink300, width: 28, marginTop: 4},
  stepText: {flex: 1, gap: space[1]},
  stepTitle: {
    fontFamily: 'Archivo-SemiBold',
    fontSize: 19,
    color: colors.ink,
  },
  stepBody: {color: colors.ink500},
  footer: {textAlign: 'center', marginTop: space[4]},
});

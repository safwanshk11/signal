import React, {useCallback, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {Button} from '../components/Button';
import {Marquee} from '../components/Marquee';
import {Reveal} from '../components/Reveal';
import {getAllSigns} from '../storage/signRepository';
import {getHistory, HistoryEntry} from '../storage/historyRepository';
import {UserSign} from '../ml/types';
import {colors, fontFamily, space, type} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({navigation}: Props) {
  const [signs, setSigns] = useState<UserSign[]>([]);
  const [lastEntry, setLastEntry] = useState<HistoryEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      setSigns(getAllSigns());
      setLastEntry(getHistory()[0] ?? null);
    }, []),
  );

  const labels = signs.map(s => s.label);
  const hasSigns = signs.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <Reveal>
          <Marquee
            items={hasSigns ? labels : ['TEACH ME A SIGN', 'ANY GESTURE', 'STAYS ON THIS PHONE']}
          />
        </Reveal>

        <Reveal delay={80} style={styles.top}>
          {/* Tapping the wordmark replays the intro. */}
          <TouchableOpacity activeOpacity={0.6} onPress={() => navigation.navigate('Onboarding')}>
            <Text style={styles.wordmark}>SIGNAL</Text>
          </TouchableOpacity>
          <Text style={[type.bodyL, styles.subtitle]}>Your signs. Your language.</Text>
        </Reveal>
      </SafeAreaView>

      <Reveal delay={120} style={styles.vocabulary}>
        <View style={styles.sectionHeader}>
          <Text style={[type.monoCaption, styles.sectionLabel]}>
            {lastEntry ? 'LAST RECOGNIZED' : 'YOUR VOCABULARY'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Analytics')} hitSlop={12}>
            <Text style={styles.teaserLink}>ANALYTICS →</Text>
          </TouchableOpacity>
        </View>

        {lastEntry && (
          <Text style={lastEntry.label ? styles.teaserLabel : styles.teaserNotSure}>
            {lastEntry.label ? lastEntry.label.toUpperCase() : 'NOT SURE'}
          </Text>
        )}

        {hasSigns ? (
          <View style={styles.chipGrid}>
            {signs.map(sign => (
              <TouchableOpacity
                key={sign.id}
                activeOpacity={0.7}
                style={styles.chip}
                onPress={() => navigation.navigate('SignDetail', {signId: sign.id})}>
                <Text style={styles.chipLabel}>{sign.label}</Text>
                <Text style={styles.chipMeta}>{sign.samples.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyBlock}>
            <Text style={[type.bodyM, styles.emptyText]}>
              Nothing taught yet. Show SIGNAL any gesture five times and it becomes a word.
            </Text>
          </View>
        )}

      </Reveal>

      <SafeAreaView style={styles.bottom} edges={['bottom']}>

        <Reveal delay={180} style={styles.actions}>
          <Button
            label="Start Recognizing"
            variant="primary"
            onPress={() => navigation.navigate('Recognition')}
          />

          <View style={styles.actionGrid}>
            <View style={styles.gridItem}>
              <Button
                label="Teach a Sign"
                variant="signal"
                size="medium"
                onPress={() => navigation.navigate('AddSign')}
              />
            </View>
            <View style={styles.gridItem}>
              <Button
                label={hasSigns ? 'Practice' : 'Practice'}
                variant="secondary"
                size="medium"
                disabled={!hasSigns}
                onPress={() => navigation.navigate('Quiz')}
              />
            </View>
          </View>

          <View style={styles.linkRow}>
            <Button label="My Signs" variant="text" onPress={() => navigation.navigate('MySigns')} />
          </View>
          <Text style={[type.monoCaption, styles.footer]}>RUNS PRIVATELY ON THIS DEVICE</Text>
        </Reveal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.paper, justifyContent: 'space-between'},
  top: {paddingHorizontal: space[6], paddingTop: space[8]},
  bottom: {paddingHorizontal: space[6], paddingBottom: space[2], gap: space[6]},
  wordmark: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -2,
    color: colors.ink,
  },
  subtitle: {marginTop: space[3], color: colors.ink500},
  vocabulary: {
    flex: 1,
    paddingHorizontal: space[6],
    paddingTop: space[6],
    gap: space[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingBottom: space[2],
  },
  sectionLabel: {color: colors.ink500},
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: space[2]},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.paperRaised,
    paddingVertical: space[2],
    paddingHorizontal: space[3],
  },
  chipLabel: {fontFamily: fontFamily.bodySemiBold, fontSize: 15, color: colors.ink},
  chipMeta: {fontFamily: fontFamily.mono, fontSize: 10, color: colors.ink300},
  emptyBlock: {
    backgroundColor: colors.sparkWash,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space[4],
  },
  emptyText: {color: colors.ink700},
  teaserLabel: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: 26,
    letterSpacing: -0.6,
    color: colors.ink,
    marginTop: space[1],
  },
  teaserNotSure: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: 26,
    letterSpacing: -0.6,
    color: colors.caution,
    marginTop: space[1],
  },
  teaserLink: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.signal,
    paddingBottom: space[1],
  },
  actions: {gap: space[3]},
  actionGrid: {flexDirection: 'row', gap: space[3]},
  gridItem: {flex: 1},
  linkRow: {flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'},
  footer: {color: colors.ink300, textAlign: 'center'},
});

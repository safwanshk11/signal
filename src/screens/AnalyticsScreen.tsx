import React, {useCallback, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {getHistory, HistoryEntry} from '../storage/historyRepository';
import {getAllQuizAttempts} from '../storage/quizRepository';
import {getAllSigns} from '../storage/signRepository';
import {Button} from '../components/Button';
import {StatBand} from '../components/StatBand';
import {colors, space, type} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Analytics'>;

function formatTime(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) +
    ' · ' +
    d.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'})
  );
}

export function AnalyticsScreen({navigation}: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState({signCount: 0, sampleCount: 0, quizAccuracy: null as number | null});

  useFocusEffect(
    useCallback(() => {
      setEntries(getHistory());
      const signs = getAllSigns();
      const attempts = getAllQuizAttempts();
      setStats({
        signCount: signs.length,
        sampleCount: signs.reduce((sum, s) => sum + s.samples.length, 0),
        quizAccuracy: attempts.length > 0 ? attempts.filter(a => a.correct).length / attempts.length : null,
      });
    }, []),
  );

  const statList = [
    {value: String(stats.signCount), label: 'Signs taught', accent: colors.spark},
    {value: String(stats.sampleCount), label: 'Examples recorded'},
    stats.quizAccuracy !== null
      ? {value: `${Math.round(stats.quizAccuracy * 100)}%`, label: 'Practice accuracy'}
      : {value: '0KB', label: 'Sent to the cloud'},
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={type.displayL}>Analytics</Text>
        <Text style={type.monoCaption}>ALL ON-DEVICE</Text>
      </View>
      <View style={styles.rule} />

      <StatBand stats={statList} />

      <View style={styles.listHeader}>
        <Text style={[type.monoCaption, styles.listHeaderLabel]}>RECOGNITION LOG</Text>
        <Text style={type.monoCaption}>{entries.length} ATTEMPTS</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[type.bodyM, styles.emptyText]}>
            Nothing recognized yet. Try a sign from the Recognition screen.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={e => e.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({item}) => (
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={item.label ? styles.label : styles.notSure}>
                  {item.label ? item.label.toUpperCase() : 'NOT SURE'}
                </Text>
                <Text style={[type.monoCaption, styles.meta]}>{formatTime(item.timestamp)}</Text>
              </View>
              <Text style={[type.monoCaption, styles.confidence]}>
                {Math.round(item.confidence * 100)}%
              </Text>
            </View>
          )}
        />
      )}

      <View style={styles.back}>
        <Button label="Back to Home" variant="text" onPress={() => navigation.navigate('Home')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.paper, padding: space[6]},
  header: {
    marginTop: space[6],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: space[4],
  },
  rule: {height: 2, backgroundColor: colors.ink, marginBottom: space[6]},
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: space[8],
    marginBottom: space[2],
  },
  listHeaderLabel: {color: colors.ink300},
  empty: {paddingVertical: space[12], alignItems: 'center'},
  emptyText: {textAlign: 'center'},
  separator: {height: 1, backgroundColor: colors.line},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space[4],
  },
  rowBody: {gap: space[1]},
  label: {fontFamily: 'Archivo-SemiBold', fontSize: 17, color: colors.ink},
  notSure: {fontFamily: 'Archivo-SemiBold', fontSize: 17, color: colors.caution},
  meta: {color: colors.ink500},
  confidence: {color: colors.signal},
  back: {marginTop: space[4], alignItems: 'flex-start'},
});

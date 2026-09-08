import React, {useCallback, useState} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {getAllSigns} from '../storage/signRepository';
import {UserSign} from '../ml/types';
import {Button} from '../components/Button';
import {colors, fontFamily, space, type} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MySigns'>;

export function MySignsScreen({navigation}: Props) {
  const [signs, setSigns] = useState<UserSign[]>([]);

  const reload = useCallback(() => {
    setSigns(getAllSigns());
  }, []);

  useFocusEffect(reload);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={type.displayL}>My Signs</Text>
        <Text style={type.monoCaption}>
          {signs.length} {signs.length === 1 ? 'SIGN' : 'SIGNS'}
        </Text>
      </View>
      <View style={styles.rule} />

      {signs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[type.bodyM, styles.emptyText]}>No signs yet. Teach SIGNAL one from Home.</Text>
        </View>
      ) : (
        <FlatList
          data={signs}
          keyExtractor={s => s.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({item, index}) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.6}
              onPress={() => navigation.navigate('SignDetail', {signId: item.id})}>
              <Text style={[type.monoCaption, styles.index]}>{String(index + 1).padStart(2, '0')}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={[type.monoCaption, styles.meta]}>
                  {item.samples.length} EXAMPLES · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
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
  rule: {height: 2, backgroundColor: colors.ink, marginBottom: space[2]},
  empty: {paddingVertical: space[12], alignItems: 'center'},
  emptyText: {textAlign: 'center'},
  separator: {height: 1, backgroundColor: colors.line},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[4],
    gap: space[4],
  },
  index: {color: colors.ink300, width: 24},
  rowBody: {flex: 1, gap: space[1]},
  label: {fontFamily: fontFamily.bodySemiBold, fontSize: 18, color: colors.ink},
  meta: {color: colors.ink500},
  chevron: {fontFamily: fontFamily.bodySemiBold, fontSize: 18, color: colors.ink300},
  back: {marginTop: space[4], alignItems: 'flex-start'},
});

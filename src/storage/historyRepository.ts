import {MMKV} from 'react-native-mmkv';
import uuid from 'react-native-uuid';

export type HistoryEntry = {
  id: string;
  label: string | null;
  confidence: number;
  timestamp: number;
};

const storage = new MMKV({id: 'signal-history'});
const KEY = 'signal.history.v1';
const MAX_ENTRIES = 50;

export function getHistory(): HistoryEntry[] {
  const raw = storage.getString(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addHistoryEntry(label: string | null, confidence: number): void {
  const entry: HistoryEntry = {id: uuid.v4() as string, label, confidence, timestamp: Date.now()};
  const all = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
  storage.set(KEY, JSON.stringify(all));
}

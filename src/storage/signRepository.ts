import {MMKV} from 'react-native-mmkv';
import uuid from 'react-native-uuid';
import {GestureSample, UserSign} from '../ml/types';
import {centroid} from '../ml/similarity';

// Single MMKV instance for the whole app. Data never leaves the device:
// no cloud sync, no analytics, no network calls.
const storage = new MMKV({id: 'signal-signs'});

const SIGNS_KEY = 'signal.signs.v1';

function readAll(): UserSign[] {
  const raw = storage.getString(SIGNS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as UserSign[];
  } catch {
    // Corrupt store should not crash the app; treat as empty.
    return [];
  }
}

function writeAll(signs: UserSign[]): void {
  storage.set(SIGNS_KEY, JSON.stringify(signs));
}

export function getAllSigns(): UserSign[] {
  return readAll();
}

export function getSignById(id: string): UserSign | undefined {
  return readAll().find(s => s.id === id);
}

/**
 * Persists a new sign from exactly N recorded gesture samples. Only
 * normalized feature vectors (and the frames they came from) are stored —
 * never raw camera images or video.
 */
export function createSign(label: string, samples: GestureSample[]): UserSign {
  const sign: UserSign = {
    id: uuid.v4() as string,
    label: label.trim(),
    createdAt: Date.now(),
    samples,
    centroid: centroid(samples.map(s => s.featureVector)),
  };

  const all = readAll();
  all.push(sign);
  writeAll(all);
  return sign;
}

export function deleteSign(id: string): void {
  writeAll(readAll().filter(s => s.id !== id));
}

/** Appends one more recorded example to an existing sign and recomputes its centroid. */
export function addSampleToSign(id: string, sample: GestureSample): UserSign | undefined {
  const all = readAll();
  const sign = all.find(s => s.id === id);
  if (!sign) return undefined;

  sign.samples.push(sample);
  sign.centroid = centroid(sign.samples.map(s => s.featureVector));
  writeAll(all);
  return sign;
}

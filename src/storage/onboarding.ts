import {MMKV} from 'react-native-mmkv';

const storage = new MMKV({id: 'signal-onboarding'});
const KEY = 'signal.onboarding.completed';

export function hasCompletedOnboarding(): boolean {
  return storage.getBoolean(KEY) ?? false;
}

export function markOnboardingComplete(): void {
  storage.set(KEY, true);
}

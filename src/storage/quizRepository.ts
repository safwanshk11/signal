import {MMKV} from 'react-native-mmkv';
import uuid from 'react-native-uuid';

export type QuizAttempt = {
  id: string;
  signId: string;
  correct: boolean;
  confidence: number;
  timestamp: number;
};

const storage = new MMKV({id: 'signal-quiz'});
const KEY = 'signal.quiz.attempts.v1';

export function getAllQuizAttempts(): QuizAttempt[] {
  const raw = storage.getString(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QuizAttempt[];
  } catch {
    return [];
  }
}

export function addQuizAttempt(signId: string, correct: boolean, confidence: number): void {
  const attempt: QuizAttempt = {id: uuid.v4() as string, signId, correct, confidence, timestamp: Date.now()};
  storage.set(KEY, JSON.stringify([attempt, ...getAllQuizAttempts()]));
}

export function getQuizAttemptsForSign(signId: string): QuizAttempt[] {
  return getAllQuizAttempts().filter(a => a.signId === signId);
}

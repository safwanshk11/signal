import Tts from 'react-native-tts';

let initialized = false;

async function ensureInit(): Promise<boolean> {
  if (initialized) return true;
  try {
    await Tts.getInitStatus();
    initialized = true;
    return true;
  } catch (err) {
    // Recognition must never depend on speech — log and move on.
    console.warn('[speak] TTS unavailable, continuing without speech', err);
    return false;
  }
}

/** Speaks text locally via the platform TTS engine. Never throws. */
export async function speak(text: string): Promise<void> {
  const ready = await ensureInit();
  if (!ready) return;
  try {
    Tts.stop();
    Tts.speak(text);
  } catch (err) {
    console.warn('[speak] failed to speak', err);
  }
}

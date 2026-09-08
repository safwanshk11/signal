import {useCallback, useRef, useState} from 'react';
import {HandFrame} from '../ml/types';

// Camera streams at ~30fps; we only need enough temporal resolution to
// capture gesture motion, and sampling every frame wastes CPU on the
// worklet thread and produces a lot of near-duplicate frames. Sampling at
// ~12fps over a 1.5s recording still yields ~18 raw frames, comfortably
// above the TEMPORAL_STEPS=20 resample target.
export const SAMPLE_INTERVAL_MS = 1000 / 12;
export const RECORDING_DURATION_MS = 1500;

export type RecorderStatus = 'idle' | 'recording' | 'done';

/**
 * JS-thread state machine for one gesture recording. The frame processor
 * worklet calls `pushFrame` (via runOnJS) for every sampled frame while a
 * recording is active; this hook owns the timing/buffering so the worklet
 * itself stays trivial.
 */
export function useGestureRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const framesRef = useRef<HandFrame[]>([]);
  const lastSampleAtRef = useRef(0);
  const recordingUntilRef = useRef(0);
  const isRecordingRef = useRef(false);

  const start = useCallback((durationMs: number = RECORDING_DURATION_MS) => {
    framesRef.current = [];
    lastSampleAtRef.current = 0;
    recordingUntilRef.current = Date.now() + durationMs;
    isRecordingRef.current = true;
    setStatus('recording');
  }, []);

  // Called from JS (via runOnJS from the frame processor worklet) once per
  // camera frame. Applies the sample-rate throttle and the recording
  // window, then flips to "done" once the window elapses.
  const pushFrame = useCallback((frame: HandFrame) => {
    if (!isRecordingRef.current) return;

    const now = Date.now();
    if (now >= recordingUntilRef.current) {
      isRecordingRef.current = false;
      setStatus('done');
      return;
    }

    if (now - lastSampleAtRef.current < SAMPLE_INTERVAL_MS) return;
    lastSampleAtRef.current = now;

    // Only keep frames where a hand was actually detected — otherwise a
    // recording where the camera never found a hand would silently produce
    // an all-zero feature vector instead of surfacing "no hand detected".
    if (frame.left || frame.right) {
      framesRef.current.push(frame);
    }
  }, []);

  const reset = useCallback(() => {
    framesRef.current = [];
    isRecordingRef.current = false;
    setStatus('idle');
  }, []);

  const isRecording = useCallback(() => isRecordingRef.current, []);

  return {
    status,
    start,
    pushFrame,
    reset,
    isRecording,
    getFrames: () => framesRef.current,
  };
}

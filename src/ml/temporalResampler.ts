import {HandFrame, TEMPORAL_STEPS} from './types';

/**
 * Resamples a variable-length sequence of frames to exactly TEMPORAL_STEPS
 * frames using linear interpolation over each landmark coordinate. This
 * makes gesture sequences of different recorded lengths (e.g. one user
 * performed a sign in 18 frames, another in 27) directly comparable.
 */
export function resampleFrames(
  frames: HandFrame[],
  steps: number = TEMPORAL_STEPS,
): HandFrame[] {
  if (frames.length === 0) {
    throw new Error('Cannot resample an empty frame sequence');
  }
  if (frames.length === 1) {
    return new Array(steps).fill(frames[0]);
  }

  const result: HandFrame[] = [];
  const lastIndex = frames.length - 1;

  for (let step = 0; step < steps; step++) {
    // Position along the original sequence, in [0, lastIndex].
    const t = (step / (steps - 1)) * lastIndex;
    const lowerIndex = Math.floor(t);
    const upperIndex = Math.min(lowerIndex + 1, lastIndex);
    const frac = t - lowerIndex;

    result.push(interpolateFrame(frames[lowerIndex], frames[upperIndex], frac));
  }

  return result;
}

function interpolateFrame(a: HandFrame, b: HandFrame, frac: number): HandFrame {
  return {
    timestamp: a.timestamp + (b.timestamp - a.timestamp) * frac,
    left: interpolateHand(a.left, b.left, frac),
    right: interpolateHand(a.right, b.right, frac),
  };
}

function interpolateHand(
  a: HandFrame['left'],
  b: HandFrame['left'],
  frac: number,
): HandFrame['left'] {
  // If a hand is missing from either side, don't fabricate motion for it —
  // just carry forward whichever side actually has data (if any).
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;

  return a.map((lm, i) => ({
    x: lm.x + (b[i].x - lm.x) * frac,
    y: lm.y + (b[i].y - lm.y) * frac,
    z: lm.z + (b[i].z - lm.z) * frac,
  }));
}

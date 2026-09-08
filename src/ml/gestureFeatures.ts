import {HandFrame, Landmark, NUM_LANDMARKS_PER_HAND, TEMPORAL_STEPS} from './types';
import {normalizeHandLandmarks, emptyHandLandmarks} from './normalizeLandmarks';
import {resampleFrames} from './temporalResampler';

// Deterministic per-frame layout: left hand's 21×3 values, then right
// hand's 21×3 values. A hand absent in a frame becomes an explicit zero
// block (see emptyHandLandmarks) instead of shrinking the vector.
const VALUES_PER_HAND = NUM_LANDMARKS_PER_HAND * 3;
const VALUES_PER_FRAME = VALUES_PER_HAND * 2;
export const FEATURE_VECTOR_LENGTH = VALUES_PER_FRAME * TEMPORAL_STEPS;

function flattenHand(landmarks: Landmark[]): number[] {
  const out: number[] = [];
  for (const lm of landmarks) {
    out.push(lm.x, lm.y, lm.z);
  }
  return out;
}

/**
 * Turns a raw recorded gesture (variable-length frames, raw pixel/camera
 * space landmarks) into a fixed-length feature vector:
 *   TEMPORAL_STEPS × 2 hands × 21 landmarks × 3 coords, flattened.
 * This is the representation stored per sample and compared at
 * recognition time.
 */
export function extractGestureFeatures(rawFrames: HandFrame[]): number[] {
  const resampled = resampleFrames(rawFrames, TEMPORAL_STEPS);
  const features: number[] = [];

  for (const frame of resampled) {
    const left = frame.left
      ? normalizeHandLandmarks(frame.left)
      : emptyHandLandmarks();
    const right = frame.right
      ? normalizeHandLandmarks(frame.right)
      : emptyHandLandmarks();

    features.push(...flattenHand(left), ...flattenHand(right));
  }

  return features;
}

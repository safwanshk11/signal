import {RecognitionResult, UserSign} from './types';
import {cosineSimilarity} from './similarity';

// Below this cosine similarity to the nearest centroid, SIGNAL reports
// "not sure" rather than guessing. Tuned empirically for Phase 0 — not
// derived from a validation set (there isn't one yet with 3-5 signs).
export const CONFIDENCE_THRESHOLD = 0.75;

/**
 * Nearest-centroid classifier: each registered sign is represented by the
 * centroid of its stored sample feature vectors. Recognition compares the
 * incoming feature vector against every sign's centroid via cosine
 * similarity and returns the best match, or null if nothing clears the
 * confidence threshold.
 */
export function classifyGesture(
  featureVector: number[],
  signs: UserSign[],
): RecognitionResult {
  if (signs.length === 0) {
    return {label: null, confidence: 0};
  }

  let bestLabel: string | null = null;
  let bestSimilarity = -Infinity;

  for (const sign of signs) {
    const similarity = cosineSimilarity(featureVector, sign.centroid);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestLabel = sign.label;
    }
  }

  // Cosine similarity is in [-1, 1]; clamp to [0, 1] to read as a confidence.
  const confidence = Math.max(0, bestSimilarity);

  if (confidence < CONFIDENCE_THRESHOLD) {
    return {label: null, confidence};
  }

  return {label: bestLabel, confidence};
}

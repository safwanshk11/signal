import {Landmark, NUM_LANDMARKS_PER_HAND} from './types';

// MediaPipe hand landmark indices used as normalization anchors.
const WRIST = 0;
const MIDDLE_FINGER_MCP = 9;

/**
 * Normalizes one hand's 21 landmarks so they are invariant to the hand's
 * position in frame and its distance from the camera:
 *   1. Translate so the wrist sits at the origin.
 *   2. Scale by the wrist -> middle-finger-MCP distance (a stable proxy for
 *      palm size that barely changes as fingers move), so near/far hands
 *      produce comparable vectors.
 * z is scaled by the same factor as x/y to keep depth proportionate.
 */
export function normalizeHandLandmarks(landmarks: Landmark[]): Landmark[] {
  if (landmarks.length !== NUM_LANDMARKS_PER_HAND) {
    throw new Error(
      `Expected ${NUM_LANDMARKS_PER_HAND} landmarks, got ${landmarks.length}`,
    );
  }

  const wrist = landmarks[WRIST];
  const anchor = landmarks[MIDDLE_FINGER_MCP];

  const dx = anchor.x - wrist.x;
  const dy = anchor.y - wrist.y;
  const dz = anchor.z - wrist.z;
  const scale = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;

  return landmarks.map(lm => ({
    x: (lm.x - wrist.x) / scale,
    y: (lm.y - wrist.y) / scale,
    z: (lm.z - wrist.z) / scale,
  }));
}

// Explicit "hand absent" representation: a zero vector rather than omitting
// the hand, so every frame's feature length stays fixed regardless of
// whether one or two hands were detected.
export function emptyHandLandmarks(): Landmark[] {
  return new Array(NUM_LANDMARKS_PER_HAND).fill(0).map(() => ({x: 0, y: 0, z: 0}));
}

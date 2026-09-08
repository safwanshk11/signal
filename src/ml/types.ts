// Core data model for SIGNAL's on-device gesture pipeline.

export type Landmark = {
  x: number;
  y: number;
  z: number;
};

// MediaPipe HandLandmarker always emits exactly 21 landmarks per detected hand.
export const NUM_LANDMARKS_PER_HAND = 21;

export type Handedness = 'left' | 'right';

export type HandFrame = {
  timestamp: number;
  left?: Landmark[];
  right?: Landmark[];
};

// Fixed number of temporal steps every gesture is resampled to before
// feature extraction, so sequences of different lengths become comparable.
export const TEMPORAL_STEPS = 20;

export type GestureSample = {
  frames: HandFrame[];
  featureVector: number[];
};

export type UserSign = {
  id: string;
  label: string;
  createdAt: number;
  samples: GestureSample[];
  centroid: number[];
};

export type RecognitionResult = {
  label: string | null;
  confidence: number;
};

export type LatencyBreakdown = {
  landmarkExtractionMs: number;
  featureProcessingMs: number;
  classificationMs: number;
  totalMs: number;
};

import {LatencyBreakdown} from '../ml/types';

/** Tiny stopwatch for instrumenting the recognize pipeline's stages. */
export class Stopwatch {
  private marks: Record<string, number> = {};
  private start = Date.now();

  mark(label: string): void {
    this.marks[label] = Date.now();
  }

  elapsedSince(label: string): number {
    return Date.now() - (this.marks[label] ?? this.start);
  }

  totalElapsed(): number {
    return Date.now() - this.start;
  }
}

export function logLatency(context: string, breakdown: LatencyBreakdown): void {
  console.log(
    `[latency] ${context} — landmarks: ${breakdown.landmarkExtractionMs}ms, ` +
      `features: ${breakdown.featureProcessingMs}ms, ` +
      `classify: ${breakdown.classificationMs}ms, total: ${breakdown.totalMs}ms`,
  );
}

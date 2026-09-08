/** Cosine similarity in [-1, 1]; 1 means identical direction. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function centroid(vectors: number[][]): number[] {
  if (vectors.length === 0) {
    throw new Error('Cannot compute centroid of zero vectors');
  }
  const length = vectors[0].length;
  const sum = new Array(length).fill(0);

  for (const v of vectors) {
    for (let i = 0; i < length; i++) {
      sum[i] += v[i];
    }
  }

  return sum.map(s => s / vectors.length);
}

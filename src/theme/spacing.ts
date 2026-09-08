// 4px base spacing scale, matching the design system's "Space & Form" tokens.
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  20: 80,
  32: 128,
} as const;

// Square corners are the house style; radiusPill is reserved for status
// pieces (tags/badges), never for buttons or cards.
export const radius = {
  0: 0,
  2: 2,
  pill: 999,
} as const;

export const border = {
  hairline: 1, // 1px line — dividers within a group
  rule: 2, // 2px ink — separators between sections
} as const;

export const duration = {
  fast: 140,
  base: 240,
  slow: 520,
} as const;

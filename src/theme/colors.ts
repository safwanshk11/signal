// Ported from the "TinyWins — Feelings System" design canvas (v1.0, Sep 2026).
// Warm ink/paper neutrals carry ~90% of every surface; accents punctuate.

export const colors = {
  // Ink & paper — the neutral base
  ink: '#12110F',
  ink700: '#3A3733',
  ink500: '#6B665F',
  ink300: '#A8A29A',
  line: '#E2DDD3',
  paper: '#F7F5F0',
  paperRaised: '#FFFFFF',

  // Accents — use on ≤10% of a surface
  spark: '#E0E111', // highlights, primary button on ink, marquee marks
  signal: '#E24947', // links/hover, live states, one number per screen
  sparkWash: '#F0F2CC', // tag fills, quiet section grounds

  // Semantic
  success: '#399E43',
  caution: '#DE9300',
  critical: '#BE222A',
  info: '#3275B4',
} as const;

export type Rng = {
  next(): number
  float(min: number, max: number): number
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  fork(label: string): Rng
}

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a |= 0
    b |= 0
    c |= 0
    d |= 0
    const t = (((a + b) | 0) + d) | 0
    d = (d + 1) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
}

/** 7-char base36 hash, used to scope SVG IDs. */
export function hash(input: string): string {
  return xmur3(input)().toString(36).padStart(7, '0')
}

export function createRng(seed: string): Rng {
  const h = xmur3(seed)
  const next = sfc32(h(), h(), h(), h())
  // Early sfc32 outputs are weakly mixed; skip them.
  for (let i = 0; i < 12; i++) next()
  const float = (min: number, max: number) => min + next() * (max - min)
  return {
    next,
    float,
    int: (min, max) => Math.floor(float(min, max + 1)),
    pick: (items) => items[Math.floor(next() * items.length)]!,
    // A fork depends only on the seed and label, never on earlier draws.
    fork: (label) => createRng(seed + '\u0000' + label),
  }
}

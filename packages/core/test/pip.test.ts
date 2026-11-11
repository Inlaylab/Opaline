import { describe, expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { MIN_EYE, pip, type PipForm } from '../src/styles/pip.ts'

const seeds = (n: number) => Array.from({ length: n }, (_, i) => `pip-${i}`)
const FORMS: PipForm[] = [
  'circle',
  'squircle',
  'triangle',
  'hexagon',
  'diamond',
  'heart',
  'drop',
  'pill',
  'dome',
]
const strip = (svg: string) => svg.replace(/a[0-9a-z]{7}-/g, 'ID-')

describe('pick order', () => {
  test('setting the drawn form changes no pick and no pixel', () => {
    for (const seed of seeds(60)) {
      const a = createAvatar(pip, { seed })
      const forced = createAvatar(pip, { seed, form: a.toJSON().form as PipForm })
      expect(forced.toJSON()).toEqual(a.toJSON())
      expect(strip(forced.svg)).toBe(strip(a.svg))
    }
  })

  test('the seed draws every form', () => {
    const seen = new Set(seeds(300).map((seed) => createAvatar(pip, { seed }).toJSON().form))
    expect([...seen].sort()).toEqual([...FORMS].sort())
  })

  test('switching form keeps the hue', () => {
    for (const seed of seeds(20)) {
      const hues = FORMS.map((form) => createAvatar(pip, { seed, form }).toJSON().hue)
      expect(new Set(hues).size).toBe(1)
    }
  })
})

describe('geometry', () => {
  test('every form and its eyes stay inside the frame', { timeout: 30_000 }, () => {
    const outside: string[] = []
    for (const seed of seeds(40))
      for (const form of FORMS) {
        const svg = createAvatar(pip, { seed, form }).svg
        const body = /<path d="([^"]+)" fill="var\(--avatar-c1/.exec(svg)![1]!
        for (const n of body.match(/-?\d+(?:\.\d+)?/g)!)
          // Control points included: a curve never leaves the hull of its points.
          if (Number(n) < 0 || Number(n) > 100) outside.push(`${seed}/${form} body: ${n}`)
        const [, ex, ey] = /<g transform="translate\(([\d.]+) ([\d.]+)\)/.exec(svg)!
        for (const n of [ex, ey])
          if (Number(n) < 20 || Number(n) > 80) outside.push(`${seed}/${form} eyes: ${n}`)
      }
    expect(outside).toEqual([])
  })

  test('eyes are never thinner than the 24px floor', () => {
    for (const seed of seeds(40))
      for (const form of FORMS) {
        const svg = createAvatar(pip, { seed, form }).svg
        const widths = [...svg.matchAll(/<rect[^>]*width="([\d.]+)"/g)].map((m) => Number(m[1]))
        expect(widths).toHaveLength(2)
        for (const w of widths) expect(w).toBeGreaterThanOrEqual(MIN_EYE)
      }
  })
})

describe('options', () => {
  test('face: false drops the eyes', () => {
    const svg = createAvatar(pip, { seed: 'a', face: false }).svg
    expect(svg).not.toContain('<rect')
    expect(svg).not.toContain('<g transform')
  })

  test('body is --avatar-c1; the eyes are not themed', () => {
    const svg = createAvatar(pip, { seed: 'a' }).svg
    expect(svg).toMatch(/<path d="M[^"]+" fill="var\(--avatar-c1, #[0-9a-f]{6}\)"\/>/)
    expect(svg).not.toContain('--avatar-c2')
  })

  test('unknown values fall back to the drawn ones and never throw', () => {
    for (const seed of seeds(20)) {
      const plain = createAvatar(pip, { seed })
      for (const bad of ['nope', '__proto__', 'constructor', 'toString']) {
        const odd = { seed, form: bad, finish: bad, palette: bad, shape: bad } as never
        expect(strip(createAvatar(pip, odd).svg)).toBe(strip(plain.svg))
      }
    }
  })

  test('finishes paint gradients, never filters', () => {
    for (const finish of ['soft', 'gloss'] as const) {
      const a = createAvatar(pip, { seed: 'a', finish })
      expect(a.svg).toContain('radialGradient')
      expect(a.svg).not.toContain('<filter')
      expect(a.toJSON().finish).toBe(finish)
    }
  })
})

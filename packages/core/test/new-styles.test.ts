import { describe, expect, test } from 'vitest'
import { createAvatar, type Style } from '../src/index.ts'
import { EXPRESSIONS, JOLLY } from '../src/parts/face.ts'
import { bbox, outline } from '../src/parts/finish.ts'
import { PERSONA } from '../src/parts/persona.ts'
import { clay } from '../src/styles/clay.ts'
import { cosmos, COSMOS, recolor, type CosmosObject } from '../src/styles/cosmos.ts'
import { critters, CRITTERS, type Critter } from '../src/styles/critters.ts'
import { doodle } from '../src/styles/doodle.ts'
import { BEARDABLE, folk } from '../src/styles/folk.ts'
import { gradient } from '../src/styles/gradient.ts'
import { GRADIENT_FORMS, type GradientForm } from '../src/styles/gradient-forms.ts'
import { morph } from '../src/styles/morph.ts'
import { pip } from '../src/styles/pip.ts'
import { plush } from '../src/styles/plush.ts'

const seeds = (n: number, p = 's') => Array.from({ length: n }, (_, i) => `${p}-${i}`)
const strip = (svg: string) => svg.replace(/a[0-9a-z]{7}-/g, 'ID-')
const clean = (svg: string) => expect(svg).not.toMatch(/NaN|undefined|Infinity/)
const json = (s: Style<any>, o: Record<string, unknown>) =>
  createAvatar(s, o as never).toJSON() as Record<string, unknown>
const idsOf = (svg: string) => [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1])

describe('critters', () => {
  test('every animal, coat and finish renders', () => {
    for (const animal of Object.keys(CRITTERS) as Critter[])
      for (const extra of [
        {},
        { coat: 'palette' },
        { finish: 'flat' },
        { finish: 'gloss' },
        { finish: 'gummy' },
        { shape: 'squircle' },
      ])
        clean(createAvatar(critters, { seed: animal, animal, ...extra } as never).svg)
  })
  test('free faces are jolly; mood still wins', () => {
    for (const seed of seeds(80)) {
      expect(JOLLY).toContain(json(critters, { seed }).expression)
      expect(
        EXPRESSIONS[json(critters, { seed, mood: 'calm' }).expression as keyof typeof EXPRESSIONS]
          .mood,
      ).toBe('calm')
    }
  })
  test('setting the drawn animal or a coat never shifts the other picks', () => {
    for (const seed of seeds(40)) {
      const free = json(critters, { seed })
      expect(json(critters, { seed, animal: free.animal })).toEqual(free)
      const pal = json(critters, { seed, coat: 'palette' })
      expect(free.coat).toBe('natural')
      expect(pal.variant).toBeUndefined()
      expect({ ...pal, coat: free.coat, hue: free.hue, variant: free.variant }).toEqual(free)
    }
  })
  test('gummy bubbles sit inside the head', () => {
    const inside = (x: number, y: number, poly: [number, number][]) => {
      let hit = false
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i]!
        const [xj, yj] = poly[j]!
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
      }
      return hit
    }
    for (const animal of Object.keys(CRITTERS) as Critter[])
      for (const seed of seeds(20)) {
        const svg = createAvatar(critters, { seed, animal, finish: 'gummy' }).svg
        // The head is the largest jelly-lit path (ears get jelly light too).
        const head = [...svg.matchAll(/<path d="([^"]+)" fill="url\(#[^"]*-jg\)"/g)]
          .map((m) => outline(m[1]!))
          .sort((a, b) => bbox(b).w * bbox(b).h - bbox(a).w * bbox(a).h)[0]!
        for (const m of svg.matchAll(
          /<circle cx="([-\d.]+)" cy="([-\d.]+)"[^>]*fill-opacity="0.3"/g,
        ))
          expect(inside(Number(m[1]), Number(m[2]), head), `${animal} ${seed}`).toBe(true)
      }
  })
  test('unknown animal falls back silently', () => {
    expect(strip(createAvatar(critters, { seed: 'x', animal: 'dragon' as never }).svg)).toBe(
      strip(createAvatar(critters, { seed: 'x' }).svg),
    )
  })
  test('natural coats ignore palette; palette coats follow it', () => {
    expect(strip(createAvatar(critters, { seed: 'p', palette: 'pastel' }).svg)).toBe(
      strip(createAvatar(critters, { seed: 'p' }).svg),
    )
    expect(json(critters, { seed: 'p', coat: 'palette', palette: 'pastel' }).hue).toBe(
      json(morph, { seed: 'p', palette: 'pastel' }).hue,
    )
  })
})

describe('cosmos', () => {
  test('15 objects, no earth or ringed planet; every theme renders and differs', () => {
    expect(Object.keys(COSMOS)).toHaveLength(15)
    expect(COSMOS).not.toHaveProperty('earth')
    expect(COSMOS).not.toHaveProperty('ringed planet')
    const all = new Set<string>()
    for (const object of Object.keys(COSMOS) as CosmosObject[])
      for (let tone = 0; tone < 5; tone++) {
        const a = createAvatar(cosmos, { seed: 'c', object, tone })
        clean(a.svg)
        if (a.toJSON().tone === tone) all.add(strip(a.svg))
      }
    expect(all.size).toBeGreaterThan(40)
  })
  test('bad object and tone fall back; object keeps tone and expression', () => {
    const base = strip(createAvatar(cosmos, { seed: 'k' }).svg)
    for (const o of [
      { object: 'ufo-x' },
      { tone: 99 },
      { tone: -1 },
      { tone: 1.5 },
      { tone: '' },
      { tone: ' ' },
      { tone: 'x' },
    ])
      expect(strip(createAvatar(cosmos, { seed: 'k', ...o } as never).svg)).toBe(base)
    for (const seed of seeds(30)) {
      const free = json(cosmos, { seed })
      expect(json(cosmos, { seed, object: free.object })).toEqual(free)
    }
    // HTML attributes and static framework props arrive as strings.
    expect(strip(createAvatar(cosmos, { seed: 'k', tone: '2' } as never).svg)).toBe(
      strip(createAvatar(cosmos, { seed: 'k', tone: 2 }).svg),
    )
  })
  test('the face never recolours across tones', () => {
    const face = (tone: number) =>
      createAvatar(cosmos, { seed: 'f', object: 'moon', tone, expression: 'beam' })
        .svg.split('<g transform="translate(')
        .pop()
    expect(face(1)).toBe(face(0))
  })
  test('a tile is a night sky clipped to the core shape', () => {
    const svg = createAvatar(cosmos, { seed: 't', shape: 'squircle' }).svg
    expect(svg).toContain('#1c1838')
    expect(svg).toContain('clip-path')
    expect(createAvatar(cosmos, { seed: 't' }).svg).not.toContain('#1c1838')
  })
  test('recolor leaves greys alone', () => {
    expect(recolor('#ffffff #808080', 120)).toBe('#ffffff #808080')
    expect(recolor('#ff0000', 120)).not.toBe('#ff0000')
  })
})

describe('folk and doodle', () => {
  const schemes = [
    'natural',
    'bare',
    'sepia',
    'greyscale',
    'duotone',
    'muted',
    'electric',
    'inverted',
    'pastel',
    'bold',
    'sunrise',
  ]
  test('every scheme, shape and expression renders', () => {
    for (const s of [folk, doodle] as Style<any>[])
      for (const scheme of schemes)
        for (const shape of ['none', 'circle', 'squircle', 'square'])
          for (const expression of Object.keys(PERSONA))
            clean(
              createAvatar(s, {
                seed: scheme + shape + expression,
                scheme,
                shape,
                expression,
              } as never).svg,
            )
  })
  test('folk: beards only with short hair, never with earrings or a headscarf; no tongue under a headscarf', () => {
    for (const seed of seeds(600, 'folk')) {
      const p = json(folk, { seed })
      if (p.facial !== 'none') {
        expect(BEARDABLE).toContain(p.hair)
        expect(p.earrings).toBe(false)
      }
      if (p.hair === 'scarf') expect(p.expression).not.toBe('cheeky')
      // The rule holds when the face is asked for too.
      const asked = json(folk, { seed, expression: 'cheeky' })
      expect(asked.expression).toBe(asked.hair === 'scarf' ? p.expression : 'cheeky')
    }
  })
  test('a set scheme, expression or shape never shifts the person', () => {
    for (const seed of seeds(40)) {
      const free = json(folk, { seed })
      const { scheme, ...set } = json(folk, { seed, scheme: 'sepia', expression: free.expression })
      expect(scheme).toBe('sepia')
      expect(set).toEqual(free)
      const { shape, ...round } = json(folk, { seed, shape: 'circle' })
      expect(shape).toBe('circle')
      expect(round).toEqual(free)
    }
  })
  test('shape none has no wall; unknown values fall back', () => {
    expect(createAvatar(folk, { seed: 'n', shape: 'none' }).svg).not.toContain('clip-path')
    expect(strip(createAvatar(doodle, { seed: 'n', scheme: 'neon' as never }).svg)).toBe(
      strip(createAvatar(doodle, { seed: 'n' }).svg),
    )
  })
  test('folk defaults to duotone in the palette hue', () => {
    expect(json(folk, { seed: 'h' }).scheme).toBeUndefined()
    expect(json(folk, { seed: 'h', scheme: 'natural' }).scheme).toBe('natural')
    expect(json(folk, { seed: 'h', palette: 'cool' }).hue).toBe(
      json(morph, { seed: 'h', palette: 'cool' }).hue,
    )
    expect(createAvatar(folk, { seed: 'h', palette: 'cool' }).svg).not.toBe(
      createAvatar(folk, { seed: 'h', palette: 'warm' }).svg,
    )
  })
  test('gradient keeps the 1.2 outline unless a form is set', () => {
    for (const seed of seeds(20)) expect(json(gradient, { seed }).form).toBeUndefined()
  })
})

describe('1.3 opt-in options on the 1.2 styles', () => {
  test('gummy on every style that takes it: jelly defs, face drawn last, picks only add finish', () => {
    for (const s of [morph, gradient, pip, clay, critters] as Style<any>[])
      for (const seed of seeds(12)) {
        const a = createAvatar(s, { seed, finish: 'gummy' } as never)
        clean(a.svg)
        expect(a.svg).toMatch(/-jg"/)
        const { finish, ...rest } = a.toJSON() as Record<string, unknown>
        expect(finish).toBe('gummy')
        const { finish: _f, ...flat } = json(s, { seed, finish: 'flat' })
        expect(rest).toEqual(flat)
      }
  })
  test('clay ghost body, fox and mouse ears; plush flat, soft and 1.3 hats; pip 1.3 forms', () => {
    for (const o of [
      { body: 'ghost' },
      { body: 'hood', ears: 'fox' },
      { body: 'hood', ears: 'mouse' },
      { body: 'ghost', finish: 'gummy' },
    ])
      clean(createAvatar(clay, { seed: 'c', ...o } as never).svg)
    for (const o of [
      { material: 'flat' },
      { material: 'soft' },
      { accessory: 'crown' },
      { accessory: 'party' },
      { accessory: 'pumpkin' },
      { accessory: 'headphones' },
    ])
      clean(createAvatar(plush, { seed: 'p', ...o } as never).svg)
    expect(createAvatar(plush, { seed: 'p', material: 'flat' }).svg).not.toMatch(/-jg"/)
    // 1.2 wrappers passed a shared `finish` to every look; Plush must keep ignoring it.
    for (const finish of ['flat', 'soft', 'gloss'] as const)
      for (const seed of seeds(20))
        expect(strip(createAvatar(plush, { seed, finish } as never).svg)).toBe(
          strip(createAvatar(plush, { seed }).svg),
        )
    for (const form of ['star', 'clover', 'shield', 'octagon', 'ghost']) {
      const a = createAvatar(pip, { seed: 'q', form } as never)
      clean(a.svg)
      expect(a.toJSON().form).toBe(form)
    }
  })
  test('gradient form: opt-in outline, same hue and face', () => {
    for (const form of Object.keys(GRADIENT_FORMS) as GradientForm[])
      for (const seed of seeds(20)) {
        const a = json(gradient, { seed, form })
        const b = json(gradient, { seed })
        expect(a.form).toBe(form)
        expect([a.hue, a.expression]).toEqual([b.hue, b.expression])
        const svg = createAvatar(gradient, { seed, form }).svg
        clean(svg)
        for (const v of svg.match(/M[-\d. CLZ]+Z/)![0].match(/-?\d+(\.\d+)?/g)!)
          expect(Math.abs(Number(v))).toBeLessThan(101)
      }
    expect(strip(createAvatar(gradient, { seed: 'g', form: 'peanut' as never }).svg)).toBe(
      strip(createAvatar(gradient, { seed: 'g' }).svg),
    )
  })
  test('the same avatar twice with other instances shares no ids', () => {
    for (const [s, o] of [
      [critters, { finish: 'gummy' }],
      [cosmos, { shape: 'circle' }],
      [folk, { scheme: 'sunrise', shape: 'circle' }],
      [doodle, { scheme: 'inverted' }],
      [morph, { finish: 'gummy' }],
    ] as const) {
      const a = idsOf(
        createAvatar(s as Style<any>, { seed: 'i', instance: 'one', ...o } as never).svg,
      )
      const b = idsOf(
        createAvatar(s as Style<any>, { seed: 'i', instance: 'two', ...o } as never).svg,
      )
      expect(a.length).toBe(new Set(a).size)
      expect(a.filter((x) => b.includes(x))).toEqual([])
    }
  })
})

describe('status', () => {
  test('badge, label, size floor and unknown states', () => {
    for (const status of ['online', 'away', 'busy', 'offline'] as const) {
      const a = createAvatar(morph, { seed: 'a', status, title: 'Ada' })
      expect(a.svg).toContain(`<title>Ada (${status})</title>`)
      expect(a.svg).toContain(`aria-label="Ada (${status})"`)
      expect(a.svg.indexOf('var(--avatar-status-ring')).toBeGreaterThan(
        a.svg.lastIndexOf('<g transform="translate('),
      )
      const bare = createAvatar(morph, { seed: 'a', title: 'Ada' }).svg
      expect(
        a.svg
          .replace(/<circle cx="83".*(?=<\/svg>)/, '')
          .replace(`Ada (${status})`, 'Ada')
          .replace(`Ada (${status})`, 'Ada'),
      ).toBe(bare)
    }
    expect(createAvatar(morph, { seed: 'a', status: 'online', size: 19 }).svg).not.toContain(
      '#2fb36b',
    )
    expect(createAvatar(morph, { seed: 'a', status: 'idle' as never }).svg).toBe(
      createAvatar(morph, { seed: 'a' }).svg,
    )
    expect(createAvatar(morph, { seed: 'a', status: 'busy' }).svg).toContain('aria-hidden="true"')
  })
})

import { createIds } from './ids.ts'
import { createRng, hash, type Rng } from './prng.ts'
import { normalizeSeed } from './seed.ts'
import { el, escapeXml } from './svg.ts'

export type BaseOptions = { seed: string | number; size?: number; title?: string }
export type RenderContext = { rng: Rng; id: (name: string) => string; seed: string }
export type Rendered = { defs?: string; body: string; picks: Record<string, unknown> }
export type Style<O extends object = {}> = {
  name: string
  render(ctx: RenderContext, options: O): Rendered
}
export type Avatar = {
  svg: string
  toJSON(): { style: string; seed: string } & Record<string, unknown>
  toString(): string
}

const stableStringify = (v: unknown): string =>
  v && typeof v === 'object'
    ? Array.isArray(v)
      ? `[${v.map(stableStringify).join(',')}]`
      : `{${Object.keys(v)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`)
          .join(',')}}`
    : String(JSON.stringify(v))

export function createAvatar<O extends object>(style: Style<O>, options: BaseOptions & O): Avatar {
  const { seed: rawSeed, size = 64, title, ...rest } = options
  const seed = normalizeSeed(rawSeed)
  // Options are part of the ID scope, so the same seed with other options never shares defs.
  const id = createIds(hash(seed + '\u0000' + style.name + '\u0000' + stableStringify(rest)))
  const { defs, body, picks } = style.render({ rng: createRng(seed), id, seed }, options)
  const label = title === undefined ? undefined : escapeXml(title)
  const svg = el(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 100 100',
      width: size,
      height: size,
      role: label === undefined ? undefined : 'img',
      'aria-label': title,
      'aria-hidden': label === undefined ? 'true' : undefined,
    },
    (label === undefined ? '' : `<title>${label}</title>`) +
      (defs ? `<defs>${defs}</defs>` : '') +
      body,
  )
  return {
    svg,
    toJSON: () => ({ style: style.name, seed, ...picks }),
    toString: () => svg,
  }
}

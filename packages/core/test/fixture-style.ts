import { cssVar, el, oklchToHex, type Style } from '../src/index.ts'

/** Minimal style that exercises the pipeline: one seeded hue, one gradient. */
export const fixture: Style<{ variant?: number }> = {
  name: 'fixture',
  render({ rng, id }) {
    const hue = rng.fork('fill').int(0, 359)
    const hex = oklchToHex({ l: 0.72, c: 0.14, h: hue })
    const stops =
      el('stop', { offset: 0, 'stop-color': cssVar(1, hex) }) +
      el('stop', { offset: 1, 'stop-color': cssVar(2, oklchToHex({ l: 0.5, c: 0.14, h: hue })) })
    return {
      defs: el('radialGradient', { id: id('g') }, stops),
      body: el('circle', { cx: 50, cy: 50, r: 50, fill: `url(#${id('g')})` }),
      picks: { hue },
    }
  },
}

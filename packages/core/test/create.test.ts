import { expect, test, vi } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { fixture } from './fixture-style.ts'

const gradientId = (svg: string) => /id="(a[0-9a-z]+-g)"/.exec(svg)?.[1]

test('same seed gives the same svg', () => {
  expect(createAvatar(fixture, { seed: 'a' }).svg).toBe(createAvatar(fixture, { seed: 'a' }).svg)
})

test('number seed equals string seed', () => {
  expect(createAvatar(fixture, { seed: 42 }).svg).toBe(createAvatar(fixture, { seed: '42' }).svg)
})

test('empty seed renders', () => {
  expect(createAvatar(fixture, { seed: '' }).svg.startsWith('<svg')).toBe(true)
})

test('hostile seed and title are escaped', () => {
  const evil = '"><script>alert(1)</script>'
  const svg = createAvatar(fixture, { seed: evil, title: evil }).svg
  expect(svg).not.toContain('<script')
  expect(svg).toContain('role="img"')
  expect(svg).toMatch(/<title>[^<]*&lt;script&gt;/)
})

test('without title the svg is hidden from assistive tech', () => {
  const svg = createAvatar(fixture, { seed: 'a' }).svg
  expect(svg).toContain('aria-hidden="true"')
  expect(svg).not.toContain('role=')
})

test('same seed with different options gets different ids', () => {
  const a = gradientId(createAvatar(fixture, { seed: 'a', variant: 1 }).svg)
  const b = gradientId(createAvatar(fixture, { seed: 'a', variant: 2 }).svg)
  expect(a).toBeDefined()
  expect(a).not.toBe(b)
})

test('size sets width and height, viewBox stays fixed', () => {
  const svg = createAvatar(fixture, { seed: 'a', size: 96 }).svg
  expect(svg).toContain('width="96"')
  expect(svg).toContain('height="96"')
  expect(svg).toContain('viewBox="0 0 100 100"')
})

test('size defaults to 64', () => {
  expect(createAvatar(fixture, { seed: 'a' }).svg).toContain('width="64"')
})

test('toJSON returns style, seed and picks', () => {
  const json = createAvatar(fixture, { seed: 'a' }).toJSON()
  expect(json).toEqual({ style: 'fixture', seed: 'a', hue: expect.any(Number) })
})

test('toString returns the svg', () => {
  const avatar = createAvatar(fixture, { seed: 'a' })
  expect(String(avatar)).toBe(avatar.svg)
})

test('never uses Math.random', () => {
  const spy = vi.spyOn(Math, 'random')
  createAvatar(fixture, { seed: 'a' })
  expect(spy).not.toHaveBeenCalled()
  spy.mockRestore()
})

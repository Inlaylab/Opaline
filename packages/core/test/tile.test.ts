import { expect, test } from 'vitest'
import { backdrop, rim, SHAPES, tile } from '../src/parts/tile.ts'

test('circle and squircle keep the exact 1.0 Aura outlines', () => {
  expect(tile('circle')).toBe('M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0Z')
  expect(tile('squircle')).toBe('M50 0C88 0 100 12 100 50S88 100 50 100 0 88 0 50 12 0 50 0Z')
})

test('square is full bleed', () => {
  expect(tile('square')).toBe('M0 0H100V100H0Z')
})

test('rims: circle gets one, squircle and square none', () => {
  expect(rim('circle')).toBe(
    '<circle cx="50" cy="50" r="48.6" fill="none" stroke="#fff" stroke-opacity="0.28" stroke-width="1.6"/>',
  )
  expect(rim('squircle')).toBe('')
  expect(rim('square')).toBe('')
})

test('backdrop: unset and circle keep the 1.0 tint circle, other shapes use their outline', () => {
  const circle = '<circle cx="50" cy="50" r="50" fill="var(--avatar-bg, #eee)"/>'
  expect(backdrop(undefined, 'var(--avatar-bg, #eee)')).toBe(circle)
  expect(backdrop('circle', 'var(--avatar-bg, #eee)')).toBe(circle)
  expect(backdrop('square', 'x')).toBe('<path d="M0 0H100V100H0Z" fill="x"/>')
})

test('the three shapes, no more: ellipse was removed in 1.1.1', () => {
  expect(Object.keys(SHAPES).sort()).toEqual(['circle', 'square', 'squircle'])
})

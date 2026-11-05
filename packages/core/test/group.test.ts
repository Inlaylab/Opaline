import { expect, test } from 'vitest'
import { avatarGroup } from '../src/index.ts'

const people = ['ada', 'grace', { seed: 'linus', src: '/l.png', alt: 'Linus' }, 4, 'alan']

test('shows everyone without max', () => {
  const g = avatarGroup(people)
  expect(g.shown).toHaveLength(5)
  expect(g.rest).toBe(0)
})

test('shows at most max avatars, then counts the rest', () => {
  const g = avatarGroup(people, { max: 3 })
  expect(g.shown.map((m) => m.seed)).toEqual(['ada', 'grace', 'linus'])
  expect(g.shown[2]).toEqual({ seed: 'linus', src: '/l.png', alt: 'Linus' })
  expect(g.rest).toBe(2)
})

test('bare seeds become members, numbers included', () => {
  expect(avatarGroup([7, 'x']).shown).toEqual([{ seed: 7 }, { seed: 'x' }])
})

test.each([0, -2, NaN, Infinity, undefined])('max %s shows everyone', (max) => {
  expect(avatarGroup(people, { max }).rest).toBe(0)
})

test('fractional max rounds down', () => {
  expect(avatarGroup(people, { max: 2.9 }).shown).toHaveLength(2)
})

test('max larger than the group leaves no chip', () => {
  expect(avatarGroup(people, { max: 50 }).rest).toBe(0)
})

test('overlap, chip font and ring radius follow size and shape', () => {
  expect(avatarGroup([], { size: 40 })).toMatchObject({ overlap: 10, font: 14, radius: '50%' })
  expect(avatarGroup([], { size: 64, shape: 'squircle' })).toMatchObject({
    overlap: 16,
    radius: '38%',
  })
  expect(avatarGroup([], { shape: 'square' }).radius).toBe('0')
  expect(avatarGroup([], { shape: 'nope' as never }).radius).toBe('50%')
})

test('css: avatars after the first tuck under, the chip matches their size', () => {
  const { css } = avatarGroup([], { size: 40, shape: 'squircle' })
  expect(css.root).toBe('display:inline-flex;align-items:center')
  expect(css.first).not.toContain('margin-left')
  expect(css.member).toContain('margin-left:-10px')
  expect(css.member).toContain('border-radius:38%')
  expect(css.member).toContain('var(--avatar-ring, #fff)')
  expect(css.more).toContain('width:40px;height:40px')
  expect(css.more).toContain('var(--avatar-more-bg, #ece9f5)')
})

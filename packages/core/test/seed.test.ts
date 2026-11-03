import { expect, test } from 'vitest'
import { normalizeSeed } from '../src/seed.ts'

test('numbers become strings', () => {
  expect(normalizeSeed(42)).toBe('42')
})

test('emails are trimmed and lower-cased', () => {
  expect(normalizeSeed(' Ada@Inlay.dev ')).toBe('ada@inlay.dev')
})

test('names keep their case', () => {
  expect(normalizeSeed('Ada')).toBe('Ada')
})

test('unicode is NFC', () => {
  expect(normalizeSeed('é')).toBe('é')
})

test('empty stays empty', () => {
  expect(normalizeSeed('')).toBe('')
})

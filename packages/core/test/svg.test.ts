import { expect, test } from 'vitest'
import { el, escapeXml, num } from '../src/svg.ts'
import { createIds } from '../src/ids.ts'

test('num never prints -0', () => {
  expect(num(-0)).toBe('0')
  expect(num(-0.004)).toBe('0')
})

test('num never prints exponent form', () => {
  expect(num(1e-7)).toBe('0')
  expect(num(1e21)).not.toMatch(/e/i)
})

test('num rounds to 2 decimals without trailing zeros', () => {
  expect(num(12.3456)).toBe('12.35')
  expect(num(10)).toBe('10')
  expect(num(0.5)).toBe('0.5')
  expect(num(-3.1)).toBe('-3.1')
})

test('escapeXml escapes markup and quotes', () => {
  expect(escapeXml(`<a href="x">'&'</a>`)).toBe(
    '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
  )
})

test('el self-closes and drops undefined attributes', () => {
  expect(el('circle', { cx: 50, r: 10.004, fill: undefined })).toBe('<circle cx="50" r="10"/>')
})

test('el wraps children', () => {
  expect(el('g', {}, '<x/>')).toBe('<g><x/></g>')
})

test('el escapes attribute values', () => {
  expect(el('a', { title: '"><script>' })).toBe('<a title="&quot;&gt;&lt;script&gt;"/>')
})

test('ids start with a letter and carry the prefix', () => {
  expect(createIds('1z0ni6c')('fill')).toBe('a1z0ni6c-fill')
})

test('escapeXml strips XML-invalid control characters', () => {
  expect(escapeXml('x\u0001y\u001fz')).toBe('xyz')
  expect(escapeXml('a\tb\nc')).toBe('a\tb\nc')
})

test('instance suffixes are reduced to XML-safe characters', () => {
  expect(createIds('abc', '«r1»')('g')).toBe('aabc-g-r1')
  expect(createIds('abc', ':r2:')('g')).toBe('aabc-g-r2')
})

import { expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { toPng } from '../src/png.ts'
import { clay } from '../src/styles/clay.ts'
import { initials } from '../src/styles/initials.ts'

// Runs in real browsers only (see vitest.config.ts): toPng needs Image and a canvas.

test('toPng gives a PNG at the requested size', async () => {
  const blob = await toPng(createAvatar(clay, { seed: 'ada@inlay.dev' }), { size: 128 })
  expect(blob.type).toBe('image/png')
  const head = new Uint8Array(await blob.slice(0, 8).arrayBuffer())
  expect([...head]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  const bitmap = await createImageBitmap(blob)
  expect([bitmap.width, bitmap.height]).toEqual([128, 128])
})

test('toPng defaults to the avatar size and paints the tile', async () => {
  const svg = createAvatar(initials, { seed: 'grace hopper', size: 48 }).svg
  const bitmap = await createImageBitmap(await toPng(svg))
  expect(bitmap.width).toBe(48)
  // A DOM canvas, not OffscreenCanvas: older WebKit builds lack the latter.
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 48
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  // The center of a circle tile is opaque; the corner outside it is transparent.
  expect(ctx.getImageData(24, 24, 1, 1).data[3]).toBe(255)
  expect(ctx.getImageData(0, 0, 1, 1).data[3]).toBe(0)
})

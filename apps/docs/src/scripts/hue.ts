/**
 * The site's own accent follows the typed seed's hue, but never lands in violet: that range maps to
 * the nearest blue or pink. Avatars keep their true hue; only the page chrome uses this.
 */
export function siteHue(h: number): number {
  if (h < 275 || h > 335) return h
  return h < 305 ? 265 : 345
}

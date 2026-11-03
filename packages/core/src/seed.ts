const EMAIL = /^[^\s@]+@[^\s@]+$/

/** Trim, NFC, and lower-case emails, so the same person always gets the same seed. */
export function normalizeSeed(seed: string | number): string {
  const s = String(seed).trim().normalize('NFC')
  return EMAIL.test(s) ? s.toLowerCase() : s
}

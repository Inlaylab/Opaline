import { known } from './known.ts'

/** A presence state drawn as a badge in the bottom-right corner. */
export type Status = 'online' | 'away' | 'busy' | 'offline'
export const STATUSES: Record<Status, true> = {
  online: true,
  away: true,
  busy: true,
  offline: true,
}

const RING = 'var(--avatar-status-ring, #fff)'
const X = 83
const Y = 83
/** Each state has its own shape as well as its colour: a dot, a crescent, a bar, a ring. */
const BADGES: Record<Status, string> = {
  online: `<circle cx="${X}" cy="${Y}" r="7.5" fill="#2fb36b"/>`,
  away: `<circle cx="${X}" cy="${Y}" r="7.5" fill="#f0a020"/><circle cx="${X - 3.4}" cy="${Y - 3.4}" r="5.6" fill="${RING}"/>`,
  busy: `<circle cx="${X}" cy="${Y}" r="7.5" fill="#e0453a"/><rect x="${X - 4.5}" y="${Y - 1.4}" width="9" height="2.8" rx="1.4" fill="#fff"/>`,
  offline: `<circle cx="${X}" cy="${Y}" r="6" fill="none" stroke="#8b8898" stroke-width="2.6"/>`,
}

/** The badge with its cutout, or '' for an unknown status. Has no ids, so it never clashes. */
export function badge(status: unknown): string {
  const s = known(STATUSES, status)
  return s ? `<circle cx="${X}" cy="${Y}" r="11" fill="${RING}"/>` + BADGES[s] : ''
}

/** `Ada` with `away` reads `Ada (away)`; an unknown status leaves the label as it is. */
export function statusLabel(label: string, status: unknown): string {
  const s = known(STATUSES, status)
  return s ? `${label} (${s})` : label
}

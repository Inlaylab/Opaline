/** Scoped IDs. The leading letter keeps them valid XML IDs. */
export function createIds(prefix: string): (name: string) => string {
  return (name) => `a${prefix}-${name}`
}

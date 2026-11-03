/** Scoped IDs. The leading letter keeps them valid XML IDs. */
export function createIds(prefix: string, instance?: string): (name: string) => string {
  // Wrapper IDs (React useId gives «r1») must become valid XML name characters.
  const suffix = instance?.replace(/[^\w-]/g, '')
  return (name) => `a${prefix}-${name}${suffix ? `-${suffix}` : ''}`
}

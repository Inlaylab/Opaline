/** `key` if it names an own entry of `table`, else undefined. Runtime strings (HTML attributes, CMS data) can be anything. */
export const known = <T extends object>(table: T, key: unknown): keyof T | undefined =>
  typeof key === 'string' && Object.hasOwn(table, key) ? (key as keyof T) : undefined

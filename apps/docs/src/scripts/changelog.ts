/**
 * Turns a Changesets CHANGELOG.md into releases. Changesets writes a small, fixed subset of markdown
 * (## version, ### kind, "- " lists nested by two spaces, **bold**, `code`, paragraphs), so this
 * handles that subset only.
 * shortcut: no links, tables or fenced code; switch to a markdown renderer if the changelog grows them.
 */
export type Release = { version: string; kind: string; html: string }

const esc = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
export const inline = (s: string) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

function body(lines: string[]): string {
  let html = ''
  let depth = 0 // open <ul> levels
  for (const raw of lines) {
    if (!raw.trim()) continue
    const item = /^(\s*)- (.*)$/.exec(raw)
    if (item) {
      const level = Math.floor(item[1]!.length / 2) + 1
      while (depth < level) ((html += '<ul>'), depth++)
      while (depth > level) ((html += '</li></ul>'), depth--)
      // Close the previous item at this level; a fresh <ul> has none.
      if (!/(<ul>|<\/li>)$/.test(html)) html += '</li>'
      html += `<li>${inline(item[2]!)}`
      continue
    }
    const text = inline(raw.trim())
    // An indented line under a list item continues that item (a nested paragraph).
    if (depth && /^\s/.test(raw)) html += ` ${text}`
    else {
      while (depth) ((html += '</li></ul>'), depth--)
      html += `<p>${text}</p>`
    }
  }
  while (depth) ((html += '</li></ul>'), depth--)
  return html
}

export function parseChangelog(md: string): Release[] {
  const releases: Release[] = []
  for (const chunk of md.split(/^## /m).slice(1)) {
    const [head, ...rest] = chunk.split('\n')
    const kinds = rest
      .filter((l) => l.startsWith('### '))
      .map((l) => l.slice(4).replace(/ Changes$/, ''))
    releases.push({
      version: head!.trim(),
      kind: kinds.length ? kinds.join(' and ') : 'Maintenance',
      html: body(rest.filter((l) => !l.startsWith('### '))),
    })
  }
  return releases
}

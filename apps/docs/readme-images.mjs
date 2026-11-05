// Redraws the four README images in docs/assets from real avatars: `pnpm --filter docs readme-images`.
// Needs network for the two Google fonts, same as the site.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createAvatar } from '@inlaylab/opaline'
import { aura } from '@inlaylab/opaline/aura'
import { clay } from '@inlaylab/opaline/clay'
import { gradient } from '@inlaylab/opaline/gradient'
import { initials } from '@inlaylab/opaline/initials'
import { morph } from '@inlaylab/opaline/morph'

const out = fileURLToPath(new URL('../../docs/assets/', import.meta.url))
const { version } = JSON.parse(
  readFileSync(new URL('../../packages/core/package.json', import.meta.url), 'utf8'),
)

let n = 0
const face = (style, seed, size, opts = {}) =>
  createAvatar(style, { seed, size, instance: `r${n++}`, ...opts }).svg

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500..700&family=Figtree:wght@400..700&family=Geist+Mono:wght@400;500&display=swap');
*{box-sizing:border-box}
body{margin:0;width:1600px;position:relative;overflow:hidden;background:#f3f5f9;color:#1a1f33;font:500 26px/1.4 Figtree}
.glow{position:absolute;border-radius:50%;filter:blur(90px);opacity:.75}
.g1{width:760px;height:560px;left:-160px;top:-200px;background:#c4d6ff}
.g2{width:700px;height:520px;right:-120px;top:-160px;background:#bdeedd}
.g3{width:760px;height:520px;right:-100px;bottom:-240px;background:#ffc6d6}
.g4{width:700px;height:420px;left:140px;bottom:-260px;background:#ffe5ad}
.page{position:relative;padding:72px 80px}
h1,h2{font-family:Fredoka;font-weight:600;margin:0;letter-spacing:-.015em;line-height:1.05}
h2{font-size:64px}
.grad{background:linear-gradient(90deg,#8b5cf6,#ec4899 55%,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:.08em}
.sub{margin:14px 0 0;color:#586078;font-size:28px}
.glass{background:rgb(255 255 255/.6);border:1px solid rgb(255 255 255/.9);box-shadow:0 1px 2px rgb(26 31 51/.05),0 24px 48px -24px rgb(26 31 51/.25);backdrop-filter:blur(16px)}
.card{border-radius:36px;display:grid;justify-items:center;align-content:start;gap:20px;padding:28px 20px 24px}
.tile{display:grid;place-items:center;border-radius:34%;background:rgb(255 255 255/.75);border:1px solid #fff;box-shadow:0 18px 36px -22px rgb(26 31 51/.4)}
.tile svg{display:block}
.name{font:600 34px Fredoka}
.row{display:flex;gap:10px}
.mini{display:grid;place-items:center;width:62px;height:62px;border-radius:22px;background:rgb(255 255 255/.8);border:1px solid #fff}
.pill{display:inline-flex;align-items:center;gap:10px;padding:8px 20px;border-radius:999px;background:#fff;border:1px solid #dbe1ea;font-size:24px;font-weight:600}
.dot{width:12px;height:12px;border-radius:50%;background:linear-gradient(120deg,#8b5cf6,#ec4899 55%,#f59e0b)}
`

const shell = (h, body) => `<html><head><style>${CSS}body{height:${h}px}</style></head><body>
<div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div><div class="glow g4"></div>
<div class="page">${body}</div></body></html>`

const mini = (style, seeds, size, opts = {}) =>
  `<div class="row">${seeds.map((s) => `<div class="mini">${face(style, s, size, opts)}</div>`).join('')}</div>`

// cover: wordmark left, a ring of real avatars right
const ring = [
  [clay, 'Wonder Woman', 120, 20, 130],
  [morph, 'Peter Parker', 130, 270, 0],
  [gradient, 'Storm', 130, 560, 110],
  [initials, 'Miles Morales', 110, 40, 460],
  [aura, 'Zatanna', 120, 330, 540],
  [clay, 'Black Panther', 130, 580, 440],
]
  .map(
    ([style, seed, size, x, y]) =>
      `<div class="tile glass" style="position:absolute;left:${x}px;top:${y}px;width:${size + 36}px;height:${size + 36}px">${face(style, seed, size, style === clay ? { finish: 'gloss' } : {})}</div>`,
  )
  .join('')
const cover = shell(
  840,
  `
<div style="position:relative;height:696px">
  <div style="position:absolute;left:0;top:70px;width:760px;display:grid;gap:26px;justify-items:start">
    <span class="pill"><span class="dot"></span>Open source by Inlaylab · v${version}</span>
    <h1 class="grad" style="font-size:150px">Opaline</h1>
    <div style="font:600 46px/1.2 Fredoka">Give every user a face.<br><span style="color:#586078;font-weight:500">Same seed, same avatar. Everywhere.</span></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">${['React', 'Vue', 'Angular', 'Svelte', 'Web Components'].map((t) => `<span class="pill">${t}</span>`).join('')}</div>
  </div>
  <div style="position:absolute;left:760px;top:0;width:760px;height:696px">
    <div class="tile glass" style="position:absolute;left:190px;top:200px;width:300px;height:300px">${face(clay, 'ada@inlay.dev', 230, { body: 'hood', ears: 'bunny', finish: 'gloss' })}</div>
    ${ring}
  </div>
</div>`,
)

// styles: five cards
const STYLES = [
  ['Aura', aura, 'ada@inlay.dev', ['Ada', 'Zoë', 'Kofi', 'Hana']],
  ['Morph', morph, 'ada@inlay.dev', ['Ada', 'Zoë', 'Kofi', 'Hana']],
  ['Gradient', gradient, 'ada@inlay.dev', ['Ada', 'Zoë', 'Kofi', 'Hana']],
  ['Clay', clay, 'ada@inlay.dev', ['Ada', 'Zoë', 'Kofi', 'Hana']],
  [
    'Initials',
    initials,
    'ada@inlay.dev',
    ['Ada Lovelace', 'Zoë Nguyễn', 'Kofi Mensah', 'Hana Sato'],
  ],
]
const styles = shell(
  680,
  `
<h2>Five styles. <span class="grad">Infinite faces.</span></h2>
<p class="sub">Any string, a user ID, email or username, becomes a unique, deterministic SVG.</p>
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:20px;margin-top:40px">
${STYLES.map(([name, style, seed, minis]) => `<div class="card glass"><div class="tile" style="width:200px;height:200px">${face(style, seed, 150)}</div><div class="name">${name}</div><div class="row" style="gap:6px;transform:scale(.8);margin:-6px -20px 0">${minis.map((s) => `<div class="mini">${face(style, s, 44)}</div>`).join('')}</div></div>`).join('')}
</div>`,
)

// code: the exact snippet from the README, and the avatar it makes
const code = shell(
  800,
  `
<h2>Three lines. <span class="grad">One face.</span></h2>
<div style="display:grid;grid-template-columns:1fr 360px;gap:60px;align-items:center;margin-top:36px">
  <div style="border-radius:32px;background:#1a1f33;box-shadow:0 40px 80px -40px rgb(26 31 51/.7);overflow:hidden">
    <div style="display:flex;gap:10px;padding:20px 26px;border-bottom:1px solid #2b3150"><i style="width:14px;height:14px;border-radius:50%;background:#ff6b6b"></i><i style="width:14px;height:14px;border-radius:50%;background:#ffd166"></i><i style="width:14px;height:14px;border-radius:50%;background:#5fc9a8"></i></div>
    <pre style="margin:0;padding:30px 34px;font:400 27px/1.6 'Geist Mono';color:#e9ecf5"><span style="color:#c4a6ff">import</span> { createAvatar } <span style="color:#c4a6ff">from</span> <span style="color:#9be3c4">'@inlaylab/opaline'</span>
<span style="color:#c4a6ff">import</span> { clay } <span style="color:#c4a6ff">from</span> <span style="color:#9be3c4">'@inlaylab/opaline/clay'</span>

<span style="color:#c4a6ff">const</span> { svg } = <span style="color:#8fb4ff">createAvatar</span>(clay, {
  seed: <span style="color:#9be3c4">'ada@inlay.dev'</span>,
  body: <span style="color:#9be3c4">'hood'</span>, ears: <span style="color:#9be3c4">'bunny'</span>,
  finish: <span style="color:#9be3c4">'gloss'</span>,
})</pre>
  </div>
  <div class="tile glass" style="width:360px;height:360px">${face(clay, 'ada@inlay.dev', 280, { body: 'hood', ears: 'bunny', finish: 'gloss' })}</div>
</div>
<div style="display:flex;gap:14px;margin-top:40px"><span class="pill">Byte-identical SSR</span><span class="pill">Zero dependencies</span><span class="pill">Theme with CSS variables</span></div>`,
)

// finishes: one hood body per finish
const FINISHES = [
  ['flat', 'cat'],
  ['soft', 'bear'],
  ['gloss', 'bunny'],
]
const finishes = shell(
  800,
  `
<h2>Meet <span class="grad">Clay</span></h2>
<p class="sub">Jelly or hood bodies, cat, bear and bunny ears, three finishes.</p>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:40px">
${FINISHES.map(([finish, ears]) => `<div class="card glass" style="gap:22px"><span class="pill" style="font-family:'Geist Mono';font-size:22px">finish: '${finish}'</span><div class="tile" style="width:250px;height:250px">${face(clay, 'ada@inlay.dev', 210, { body: 'hood', ears, finish })}</div>${mini(clay, ['Ada', 'Zoë', 'Kofi', 'Hana'], 44, { finish })}</div>`).join('')}
</div>`,
)

const b = await chromium.launch()
for (const [name, html, height] of [
  ['cover', cover, 840],
  ['styles', styles, 680],
  ['code', code, 800],
  ['finishes', finishes, 800],
]) {
  const p = await b.newPage({ viewport: { width: 1600, height } })
  await p.setContent(html, { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.screenshot({ path: `${out}${name}.png` })
  await p.close()
}
await b.close()

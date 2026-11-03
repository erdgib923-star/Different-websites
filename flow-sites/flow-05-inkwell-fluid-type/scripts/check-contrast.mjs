// Samples the palette at every 0.01 of progress and checks WCAG contrast of the real text pairs:
//   body text  (text)   on the scrim
//   accent text (accent) on the scrim  (eyebrows, links, CTA button)
// The scrim is translucent (SCRIM_ALPHA in src/styles.css), so each pair is checked with the scrim
// composited over BOTH pure black and pure white: whatever the 3D scene shows behind the panel,
// the ratio cannot be lower than the worst of the two. Fails below 4.5:1.
// Writes the table to stdout as Markdown (copied into the README).
// Run: npm run check:contrast   (tsx lets this .mjs import the TypeScript chapter table)

import { contrastRatio, luminance8, over8 } from '../src/engine/color.ts'
import { flow } from '../src/site/chapters.ts'

export const SCRIM_ALPHA = 0.88
const MIN = 4.5
const BLACK = [0, 0, 0]
const WHITE = [255, 255, 255]

const s = flow.create()
const tmp = [0, 0, 0]
const rows = []
let worst = { ratio: Infinity }
let fails = 0
for (let i = 0; i <= 100; i++) {
  const p = i / 100
  flow.sample(p, s)
  const scrim = s.colors.scrim.srgb8
  const row = { p, chapter: flow.chapters[s.dominant].id }
  for (const role of ['text', 'accent']) {
    const fg = s.colors[role].srgb8
    const yFg = luminance8(fg[0], fg[1], fg[2])
    let min = Infinity
    for (const under of [BLACK, WHITE]) {
      over8(scrim, SCRIM_ALPHA, under, tmp)
      min = Math.min(min, contrastRatio(yFg, luminance8(tmp[0], tmp[1], tmp[2])))
    }
    row[role] = min
    if (min < worst.ratio) worst = { ratio: min, p, role }
    if (min < MIN) fails++
  }
  rows.push(row)
}

console.log('| progress | chapter | text on scrim | accent on scrim |')
console.log('|---:|---|---:|---:|')
for (const r of rows) {
  if (Math.round(r.p * 100) % 5 !== 0 && r.text >= MIN + 1 && r.accent >= MIN + 1) continue
  console.log(`| ${r.p.toFixed(2)} | ${r.chapter} | ${r.text.toFixed(2)} | ${r.accent.toFixed(2)} |`)
}
console.log(`\nsampled 101 positions; worst ${worst.ratio.toFixed(2)}:1 (${worst.role} at p=${worst.p?.toFixed(2)}); scrim alpha ${SCRIM_ALPHA}, worst case over black and white`)
if (fails) {
  console.error(`FAIL: ${fails} samples below ${MIN}:1`)
  process.exit(1)
}
console.log(`PASS: every sample >= ${MIN}:1`)

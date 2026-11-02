// Headless smoke test against the production build (vite preview).
//   - scrolls to progress 0, 0.1 ... 1.0 and screenshots desktop (1440x900) and phone (390x844)
//   - checks the WebGL canvas is not blank (pixel statistics with the DOM overlay hidden)
//   - collects console errors / page errors
//   - verifies keyboard scrolling (PageDown, Space, ArrowDown, End, Home) and a rail anchor link
//   - verifies poster mode (prefers-reduced-motion) and the Calm mode toggle
//   - runs axe-core (WCAG 2.1 A/AA + best practices) in scene and poster mode
// Headless Chromium renders WebGL with SwiftShader (CPU). FPS numbers from this run say NOTHING
// about real-GPU performance and are not reported as such.
// Run: npm run build && npm run check:smoke

import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const { PNG } = require('pngjs')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'screenshots')
mkdirSync(outDir, { recursive: true })
const PORT = 4300 + Math.floor(Math.random() * 500)
const BASE = `http://127.0.0.1:${PORT}/`
const failures = []
const report = { viewports: {}, keyboard: {}, anchor: {}, poster: {}, calm: {}, axe: {}, debug: {} }

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('preview server did not start')), 30000)
  server.stdout.on('data', (d) => {
    if (String(d).includes(String(PORT))) {
      clearTimeout(t)
      res()
    }
  })
})

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

function watch(page, tag) {
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${tag}] console: ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`[${tag}] pageerror: ${e.message}`))
  return errors
}

async function scrollToProgress(page, p) {
  await page.evaluate((p) => {
    const main = document.getElementById('main')
    const top = main.getBoundingClientRect().top + window.scrollY
    const range = main.offsetHeight - window.innerHeight
    window.scrollTo(0, top + p * range)
  }, p)
  // wait for the spring-smoothed progress to settle (software rendering can be slow)
  const t0 = Date.now()
  while (Date.now() - t0 < 15000) {
    const s = await page.evaluate(() => window.__flowProbe())
    if (Math.abs(s.progress - p) < 0.004) break
    await sleep(150)
  }
  await sleep(400)
}

async function canvasStats(page) {
  await page.addStyleTag({ content: '.hide-dom .masthead,.hide-dom .rail,.hide-dom .flow,.hide-dom .site-footer,.hide-dom .mode-note,.hide-dom .preloader,.hide-dom .debug{visibility:hidden!important}' })
  await page.evaluate(() => document.documentElement.classList.add('hide-dom'))
  const buf = await page.screenshot()
  await page.evaluate(() => document.documentElement.classList.remove('hide-dom'))
  const png = PNG.sync.read(buf)
  let sum = 0
  let sum2 = 0
  const buckets = new Set()
  const n = png.width * png.height
  for (let i = 0; i < n; i += 7) {
    const r = png.data[i * 4]
    const g = png.data[i * 4 + 1]
    const b = png.data[i * 4 + 2]
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sum += y
    sum2 += y * y
    buckets.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4))
  }
  const m = sum / (n / 7)
  const sd = Math.sqrt(Math.max(sum2 / (n / 7) - m * m, 0))
  return { mean: +m.toFixed(1), sd: +sd.toFixed(1), colors: buckets.size }
}

async function runViewport(name, viewport, query, extra = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, ...extra })
  const page = await ctx.newPage()
  const errors = watch(page, name)
  await page.goto(BASE + query, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__flowProbe && window.__flowProbe().ready, null, { timeout: 90000 })
  const probe = await page.evaluate(() => window.__flowProbe())
  const shots = []
  for (let i = 0; i <= 10; i++) {
    const p = i / 10
    await scrollToProgress(page, p)
    const file = `${name}-p${String(i * 10).padStart(3, '0')}.png`
    await page.screenshot({ path: join(outDir, file) })
    const stats = await canvasStats(page)
    const s = await page.evaluate(() => window.__flowProbe())
    const blank = stats.sd < 2 || stats.colors < 6
    if (blank) failures.push(`${name}: canvas looks blank at p=${p} (${JSON.stringify(stats)})`)
    shots.push({ p, file, chapter: s.chapter, progress: +s.progress.toFixed(3), ...stats, blank })
  }
  report.viewports[name] = { tier: probe.tier, renderer: await page.evaluate(() => document.documentElement.dataset.renderer), shots, errors }
  failures.push(...errors)
  await ctx.close()
}

await runViewport('desktop', { width: 1440, height: 900 }, '?tier=high')
await runViewport('phone', { width: 390, height: 844 }, '', { isMobile: true, hasTouch: true })

// ---- keyboard + anchor ---------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  const errors = watch(page, 'keyboard')
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__flowProbe && window.__flowProbe().ready, null, { timeout: 90000 })
  await page.evaluate(() => document.activeElement && document.activeElement.blur())
  const y = () => page.evaluate(() => Math.round(window.scrollY))
  const steps = {}
  for (const key of ['PageDown', 'Space', 'ArrowDown']) {
    const before = await y()
    await page.keyboard.press(key)
    await sleep(900)
    const after = await y()
    steps[key] = { before, after, ok: after > before }
    if (!(after > before)) failures.push(`keyboard: ${key} did not scroll (${before} -> ${after})`)
  }
  await page.keyboard.press('End')
  await sleep(1500)
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  const endY = await y()
  steps.End = { after: endY, max: maxY, ok: endY > maxY - 50 }
  if (!steps.End.ok) failures.push(`keyboard: End did not reach the bottom (${endY}/${maxY})`)
  await page.keyboard.press('Home')
  await sleep(1500)
  steps.Home = { after: await y(), ok: (await y()) < 5 }
  if (!steps.Home.ok) failures.push('keyboard: Home did not return to top')
  report.keyboard = steps

  await page.click('.rail a[href="#storm"]')
  await sleep(3000)
  const anchor = await page.evaluate(() => {
    const el = document.getElementById('storm')
    return { top: Math.round(el.getBoundingClientRect().top), probe: window.__flowProbe() }
  })
  report.anchor = { target: '#storm', sectionTop: anchor.top, chapter: anchor.probe.chapter }
  if (anchor.probe.chapter !== 3) failures.push(`anchor: rail link to #storm landed on chapter ${anchor.probe.chapter}`)

  // Calm mode toggle at runtime
  await page.click('.calm-toggle')
  await sleep(800)
  const calmOn = await page.evaluate(() => ({ poster: document.documentElement.classList.contains('is-poster'), canvas: !!document.querySelector('canvas'), chapter: window.__flowProbe().chapter }))
  await page.screenshot({ path: join(outDir, 'calm-on.png') })
  await page.click('.calm-toggle')
  await page.waitForFunction(() => window.__flowProbe().ready, null, { timeout: 90000 })
  const calmOff = await page.evaluate(() => ({ poster: document.documentElement.classList.contains('is-poster'), canvas: !!document.querySelector('canvas') }))
  report.calm = { on: calmOn, off: calmOff }
  if (!calmOn.poster || calmOn.canvas) failures.push('calm: toggle did not switch to poster mode')
  if (calmOff.poster || !calmOff.canvas) failures.push('calm: toggle did not restore the scene')

  // axe in scene mode
  await page.evaluate(() => window.scrollTo(0, 0))
  await sleep(1200)
  await page.addScriptTag({ content: axeSource })
  report.axe.scene = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] })
    return { violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target })), incomplete: r.incomplete.map((v) => v.id) }
  })
  failures.push(...errors)
  await ctx.close()
}

// ---- poster mode via prefers-reduced-motion ------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const errors = watch(page, 'poster')
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await sleep(800)
  const st = await page.evaluate(() => ({
    poster: document.documentElement.classList.contains('is-poster'),
    canvas: !!document.querySelector('canvas'),
    sections: [...document.querySelectorAll('.chapter')].map((s) => Math.round(s.getBoundingClientRect().height)),
    note: document.querySelector('.mode-note')?.textContent,
  }))
  await page.screenshot({ path: join(outDir, 'poster-top.png') })
  await page.evaluate(() => window.scrollTo(0, document.getElementById('bloom').offsetTop))
  await sleep(300)
  await page.screenshot({ path: join(outDir, 'poster-bloom.png') })
  report.poster = st
  if (!st.poster || st.canvas) failures.push('poster: reduced motion did not produce poster mode')
  await page.addScriptTag({ content: axeSource })
  report.axe.poster = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] })
    return { violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target })), incomplete: r.incomplete.map((v) => v.id) }
  })
  failures.push(...errors)
  await ctx.close()
}

// ---- ?debug shows the panel, default hides it ----------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const hidden = (await page.$('.debug')) === null
  await page.goto(BASE + '?debug', { waitUntil: 'networkidle' })
  await page.waitForSelector('.debug', { timeout: 10000 })
  await page.waitForFunction(() => window.__flowProbe().ready, null, { timeout: 90000 })
  await sleep(1200)
  const text = await page.textContent('.debug')
  report.debug = { hiddenByDefault: hidden, panel: text.replace(/\s+/g, ' ').slice(0, 300) }
  if (!hidden) failures.push('debug panel visible without ?debug')
  await ctx.close()
}

for (const mode of ['scene', 'poster']) {
  for (const v of report.axe[mode]?.violations ?? []) {
    if (v.impact === 'serious' || v.impact === 'critical') failures.push(`axe(${mode}): ${v.id} [${v.impact}] x${v.nodes}`)
  }
}

await browser.close()
process.kill(-server.pid, 'SIGTERM')
report.failures = failures
writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2))
for (const [name, v] of Object.entries(report.viewports)) {
  console.log(`${name}: tier=${v.tier} renderer=${v.renderer}`)
  for (const s of v.shots) console.log(`  p=${s.p.toFixed(1)} chapter=${s.chapter} canvas mean=${s.mean} sd=${s.sd} colours=${s.colors}${s.blank ? '  BLANK' : ''}`)
}
console.log('keyboard:', JSON.stringify(report.keyboard))
console.log('anchor:', JSON.stringify(report.anchor))
console.log('calm:', JSON.stringify(report.calm))
console.log('poster:', JSON.stringify(report.poster))
console.log('axe scene violations:', JSON.stringify(report.axe.scene?.violations))
console.log('axe poster violations:', JSON.stringify(report.axe.poster?.violations))
console.log('debug:', JSON.stringify(report.debug))
if (failures.length) {
  console.error(`\nFAIL (${failures.length}):\n - ` + failures.join('\n - '))
  process.exit(1)
}
console.log('\nPASS: smoke test (headless SwiftShader; real-GPU frame rate NOT measured)')
process.exit(0)

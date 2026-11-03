// Headless audio check: no AudioContext before a click; "Play sound" starts generative audio that
// reaches the analyser; mute and stop work; the page logs no errors. (Nothing is heard: headless.)
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5100 + Math.floor(Math.random() * 300)
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes(String(PORT)) && r()))
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=user-gesture-required'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const res = {}
res.contextBeforeClick = await page.evaluate(() => window.__sound.ctx !== null)
await page.evaluate(() => {
  const main = document.getElementById('main')
  window.scrollTo(0, main.offsetTop + 0.8 * (main.offsetHeight - innerHeight))
})
await sleep(1500)
await page.click('.audio__play')
await sleep(2500)
res.afterPlay = await page.evaluate(() => {
  const s = window.__sound
  s.readSpectrum()
  let sum = 0
  for (const v of s.bins) sum += v
  return { playing: s.playing, state: s.ctx && s.ctx.state, spectrumSum: sum, label: document.querySelector('.audio__play').textContent }
})
await page.screenshot({ path: join(root, 'screenshots', 'audio-playing.png') })
await page.click('.audio__mute')
await sleep(300)
res.muted = await page.evaluate(() => ({ muted: window.__sound.muted, pressed: document.querySelector('.audio__mute').getAttribute('aria-pressed') }))
await page.click('.audio__play')
await sleep(900)
res.afterStop = await page.evaluate(() => ({ playing: window.__sound.playing, state: window.__sound.ctx.state }))
res.errors = errors
console.log(JSON.stringify(res, null, 2))
const fail = []
if (res.contextBeforeClick) fail.push('AudioContext existed before any click')
if (!res.afterPlay.playing || res.afterPlay.state !== 'running') fail.push('audio did not start on click')
if (!(res.afterPlay.spectrumSum > 0)) fail.push('analyser received no signal')
if (!res.muted.muted || res.muted.pressed !== 'true') fail.push('mute did not toggle')
if (res.afterStop.playing) fail.push('stop did not stop')
if (errors.length) fail.push('page errors')
await browser.close()
process.kill(-server.pid, 'SIGTERM')
if (fail.length) {
  console.error('FAIL: ' + fail.join('; '))
  process.exit(1)
}
console.log('PASS: audio check (headless: signal verified at the analyser, nothing was listened to)')
process.exit(0)

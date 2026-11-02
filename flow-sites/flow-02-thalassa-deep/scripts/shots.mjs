// Dev helper: canvas-only screenshots (DOM hidden) at given progress values, from the built site.
//   npm run build && node scripts/shots.mjs 0.05 0.4 0.72        (add --tier=low|mid|high)

import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'screenshots')
mkdirSync(out, { recursive: true })
const args = process.argv.slice(2)
const tier = (args.find((a) => a.startsWith('--tier=')) ?? '--tier=high').slice(7)
const ps = args.filter((a) => !a.startsWith('--')).map(Number)
const PORT = 4900 + Math.floor(Math.random() * 90)
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes(String(PORT)) && r()))
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } })
page.on('pageerror', (e) => console.error('pageerror', e.message))
page.on('console', (m) => m.type() === 'error' && console.error('console', m.text()))
await page.goto(`http://127.0.0.1:${PORT}/?tier=${tier}`)
await page.waitForFunction(() => window.__flowProbe && window.__flowProbe().ready, null, { timeout: 90000 })
await page.addStyleTag({ content: '.masthead,.rail,.flow,.site-footer,.mode-note,.preloader{visibility:hidden!important}' })
for (const p of ps) {
  await page.evaluate((p) => {
    const main = document.getElementById('main')
    window.scrollTo(0, main.offsetTop + p * (main.offsetHeight - innerHeight))
  }, p)
  const t0 = Date.now()
  while (Date.now() - t0 < 15000) {
    const s = await page.evaluate(() => window.__flowProbe())
    if (Math.abs(s.progress - p) < 0.003) break
    await new Promise((r) => setTimeout(r, 120))
  }
  await new Promise((r) => setTimeout(r, 500))
  const file = join(out, `shot-${tier}-${p.toFixed(3)}.png`)
  await page.screenshot({ path: file })
  console.log(file)
}
await browser.close()
process.kill(-server.pid, 'SIGTERM')
process.exit(0)

import { chromium } from 'playwright'
const OUT = 'design-review/'
const b = await chromium.launch()
const errors = []
for (const [name, w, h, theme] of [
  ['desktop-light', 1440, 1000, 'light'],
  ['desktop-dark', 1440, 1000, 'dark'],
  ['mobile-light', 390, 844, 'light'],
  ['narrow', 360, 800, 'light'],
]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  p.on('console', m => { if (m.type() === 'error') errors.push(`[${name}] ${m.text()}`) })
  p.on('pageerror', e => errors.push(`[${name}] PAGEERROR ${e.message}`))
  await p.addInitScript(t => localStorage.setItem('theme', t), theme)
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(3600) // deja actuar la red de seguridad de revelado
  await p.screenshot({ path: `${OUT}${name}-hero.png` })
  // Desbordamiento horizontal
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (over > 0) errors.push(`[${name}] DESBORDE HORIZONTAL: ${over}px`)
  // Página completa
  await p.screenshot({ path: `${OUT}${name}-full.png`, fullPage: true })
  await ctx.close()
}
await b.close()
console.log(errors.length ? errors.join('\n') : 'SIN ERRORES NI DESBORDES')

import { chromium } from 'playwright'
const b = await chromium.launch()
const fails = []
const ok = m => console.log('  OK  ' + m)
const bad = m => { fails.push(m); console.log('FALLA ' + m) }

// ── 1. Overlay de proyecto: foco, Escape, devolución ──
{
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(3600)
  const row = p.locator('.projects__row').first()
  await row.scrollIntoViewIfNeeded()
  await row.click()
  await p.waitForTimeout(500)
  const focused = await p.evaluate(() => document.activeElement?.className || '')
  focused.includes('overlay__close') ? ok('overlay proyecto: foco al abrir va a Cerrar') : bad('overlay proyecto: foco inicial = ' + focused)
  // Tab confinado
  for (let i = 0; i < 25; i++) await p.keyboard.press('Tab')
  const inside = await p.evaluate(() => !!document.activeElement?.closest('.overlay'))
  inside ? ok('overlay proyecto: tabulador confinado tras 25 Tab') : bad('overlay proyecto: el foco se escapo del dialogo')
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
  const closed = await p.locator('.overlay').count()
  closed === 0 ? ok('overlay proyecto: cierra con Escape') : bad('overlay proyecto: no cerro con Escape')
  const back = await p.evaluate(() => document.activeElement?.className || '')
  back.includes('projects__row') ? ok('overlay proyecto: foco devuelto a la fila') : bad('overlay proyecto: foco tras cerrar = ' + back)
  await p.close()
}

// ── 2. Overlay de cliente: inert del fondo ──
{
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(3600)
  const row = p.locator('.clients__row').first()
  await row.scrollIntoViewIfNeeded(); await row.click(); await p.waitForTimeout(500)
  const inert = await p.evaluate(() => document.getElementById('contenido')?.inert)
  inert ? ok('overlay cliente: contenido de fondo con inert') : bad('overlay cliente: el fondo NO esta inerte')
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)
  const restored = await p.evaluate(() => document.getElementById('contenido')?.inert === false)
  restored ? ok('overlay cliente: inert restaurado al cerrar') : bad('overlay cliente: inert quedo puesto')
  await p.close()
}

// ── 3. reduce-motion: todo visible sin animar ──
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  const anim = await p.evaluate(() => document.documentElement.hasAttribute('data-animate'))
  !anim ? ok('reduce-motion: no se activa la capa de animacion') : bad('reduce-motion: data-animate presente')
  const hidden = await p.evaluate(() =>
    [...document.querySelectorAll('[data-line],[data-rise]')]
      .filter(e => getComputedStyle(e).opacity === '0').length)
  hidden === 0 ? ok('reduce-motion: ningun elemento oculto') : bad(`reduce-motion: ${hidden} elementos con opacity 0`)
  await ctx.close()
}

// ── 4. Enlace de salto ──
{
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await p.keyboard.press('Tab')
  const first = await p.evaluate(() => document.activeElement?.className || '')
  first.includes('skip-link') ? ok('primer Tab enfoca el enlace de salto') : bad('primer Tab = ' + first)
  await p.close()
}

// ── 5. Jerarquía de encabezados y lang ──
{
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(3600)
  const h = await p.evaluate(() => {
    const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map(e => +e.tagName[1])
    let jumps = 0
    for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i-1] > 1) jumps++
    return { h1: document.querySelectorAll('h1').length, jumps, lang: document.documentElement.lang }
  })
  h.h1 === 1 ? ok('un solo <h1>') : bad(`hay ${h.h1} elementos <h1>`)
  h.jumps === 0 ? ok('sin saltos de nivel en encabezados') : bad(`${h.jumps} saltos de nivel`)
  h.lang === 'es' ? ok('lang="es"') : bad('lang = ' + h.lang)
  // Imágenes sin alt
  const noalt = await p.evaluate(() => [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length)
  noalt === 0 ? ok('todas las imagenes con alt') : bad(`${noalt} imagenes sin alt`)
  await p.close()
}

await b.close()
console.log(fails.length ? `\n${fails.length} FALLOS` : '\nTODO CORRECTO')
process.exit(fails.length ? 1 : 0)

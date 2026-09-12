import { chromium } from 'playwright'
const dir = process.argv[2]
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
const errs = []
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message))
p.on('console', m => { if (m.type()==='error') errs.push(m.text()) })

await p.goto('http://localhost:5182/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(900)
await p.screenshot({ path: dir + '/1-carga.png' })

await p.waitForSelector('text=Entrar al perfil', { timeout: 10000 })
await p.waitForTimeout(700)
await p.screenshot({ path: dir + '/2-portal.png' })

await p.getByRole('button', { name: /Entrar al perfil/ }).click()
await p.waitForTimeout(2500)
await p.screenshot({ path: dir + '/3-sitio.png' })

// Botón de volver al portal
await p.getByRole('button', { name: /Volver al portal de entrada/ }).click()
await p.waitForTimeout(1200)
await p.screenshot({ path: dir + '/4-vuelta-portal.png' })
const v = await p.evaluate(() => !!document.body.innerText.match(/Entrar al perfil/))
console.log('el boton devuelve al portal:', v)

// Recarga: debe volver a pasar por carga + portal
await p.reload({ waitUntil: 'domcontentloaded' })
await p.waitForTimeout(3200)
const r = await p.evaluate(() => !!document.body.innerText.match(/Entrar al perfil/))
console.log('tras recargar hay portal:  ', r)
await p.screenshot({ path: dir + '/5-recarga.png' })

console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors')
await b.close()

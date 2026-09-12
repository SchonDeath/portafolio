import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } })
const p = await ctx.newPage()

const state = async (label) => {
  const s = await p.evaluate(() => ({
    seen: sessionStorage.getItem('portal-seen'),
    hayPortal: !!document.querySelector('canvas') && !!document.body.innerText.match(/Entrar al perfil/),
    haySitio: !!document.getElementById('site'),
  }))
  console.log(label, JSON.stringify(s))
}

// Primera visita
await p.goto('http://localhost:5182/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(3500)
await state('1a visita tras carga: ')

// Entrar al perfil
await p.getByRole('button', { name: /Entrar al perfil/ }).click()
await p.waitForTimeout(2500)
await state('tras entrar:          ')

// Recargar en la MISMA pestaña (misma sesión)
await p.reload({ waitUntil: 'domcontentloaded' })
await p.waitForTimeout(3500)
await state('tras recargar:        ')

await b.close()

import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
await p.goto('http://localhost:5182/', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('text=Entrar al perfil', { timeout: 10000 })
await p.waitForTimeout(1600)   // dejar que las cortinas terminen de abrir
await p.screenshot({ path: process.argv[2] + '/6-portal-final.png' })
await b.close()

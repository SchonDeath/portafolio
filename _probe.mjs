import { chromium } from 'playwright'
import fs from 'node:fs'

const OUT = process.argv[2] ?? '.'
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })

const errors = []
for (const [w, h] of [
  [1440, 810],
  [1920, 1080],
  [390, 780],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: 'dark' })
  page.on('pageerror', (e) => errors.push(`${w}: ${e.message}`))

  await page.goto('http://localhost:5233/', { waitUntil: 'commit' })
  await page.waitForSelector('[data-letter]', { timeout: 180000 })
  await page.waitForTimeout(4500)

  // ¿Queda alguna barra negra sólida en el DOM?
  const bars = await page.evaluate(() => {
    const gate = document.querySelector('.z-50')
    return [...gate.querySelectorAll('div')].filter((el) => {
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return (
        cs.backgroundColor === 'rgb(4, 7, 15)' && r.width >= innerWidth * 0.9 && r.height < innerHeight * 0.3
      )
    }).length
  })

  // ¿Dónde cae la esquina inferior derecha del vídeo respecto al viewport?
  const geo = await page.evaluate(() => {
    const v = document.querySelector('video')
    const r = v.getBoundingClientRect()
    // La marca ocupa aprox. el 22% derecho x 9% inferior del clip.
    const markLeft = r.left + r.width * 0.78
    const markTop = r.top + r.height * 0.91
    return {
      videoBox: { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
      markStartsAt: { x: Math.round(markLeft), y: Math.round(markTop) },
      viewport: { w: innerWidth, h: innerHeight },
      markVisible: markLeft < innerWidth && markTop < innerHeight,
      coversViewport: r.left <= 0 && r.top <= 0 && r.right >= innerWidth && r.bottom >= innerHeight,
    }
  })

  console.log(`\n=== ${w}x${h} ===`)
  console.log('barras negras restantes:', bars)
  console.log(JSON.stringify(geo))

  await page.screenshot({ path: `${OUT}/nobar-${w}.png` })
  // Franja superior e inferior para inspección.
  await page.screenshot({ path: `${OUT}/nobar-${w}-top.png`, clip: { x: 0, y: 0, width: w, height: 100 } })
  await page.screenshot({
    path: `${OUT}/nobar-${w}-bot.png`,
    clip: { x: 0, y: h - 100, width: w, height: 100 },
  })
  await page.close()
}

console.log('\nERRORS:', errors.length ? errors : 'none')
await browser.close()

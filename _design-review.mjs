import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
await mkdir('design-review', { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
for (const [name, viewport, reducedMotion, colorScheme] of [
  ['desktop', { width: 1440, height: 1000 }, 'no-preference', 'dark'],
  ['mobile', { width: 390, height: 844 }, 'reduce', 'light'],
]) {
  const page = await browser.newPage({ viewport, reducedMotion, colorScheme })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:5182/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Entrar al perfil/ }).click({ timeout: 20000 })
  await page.locator('#site').waitFor()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `design-review/${name}-hero.png` })
  await page.locator('#proyectos').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `design-review/${name}-projects.png` })
  const cards = page.locator('.client-card')
  if (await cards.count() !== 4) throw new Error('Missing client cards')
  const imageStates = await page.locator('.client-logo-stage img').evaluateAll(images => images.map(image => ({ src: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0 })))
  for (let i = 0; i < 4; i++) {
    await cards.nth(i).scrollIntoViewIfNeeded()
    await cards.nth(i).getByRole('button').click()
    await page.getByRole('dialog').waitFor()
    if (await page.locator('.client-project').count() !== [2, 3, 1, 1][i]) throw new Error('Incorrect project grouping')
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  if (overflow) throw new Error(`${name}: horizontal overflow`)
  console.log(JSON.stringify({ name, cards: 4, overflow, initialImageStates: imageStates }))
  await page.close()
}
await browser.close()
if (errors.length) throw new Error(errors.join('\n'))
console.log('PASS: desktop, mobile, four clients with seven projects, Escape, no page errors')

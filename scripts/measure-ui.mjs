import { chromium, devices } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  ...devices['iPhone 13'],
  viewport: { width: 844, height: 390 },
  isMobile: true,
  hasTouch: true,
})
const page = await context.newPage()
await page.goto('http://127.0.0.1:4173/crevo/', { waitUntil: 'networkidle' })

const metrics = await page.evaluate(() => {
  const topBar = document.querySelector('.top-bar')
  const groups = [...document.querySelectorAll('.control-group')]
  const buttons = [...document.querySelectorAll('.button-control')]
  const pills = [...document.querySelectorAll('.stat-pill')]
  const sliders = [...document.querySelectorAll('.slider-control input')]

  const rect = (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  }

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio },
    rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    topBar: topBar ? rect(topBar) : null,
    groups: groups.map((el, index) => ({ index, ...rect(el) })),
    buttons: buttons.slice(0, 6).map((el, index) => ({ index, text: el.textContent.trim(), ...rect(el), fontSize: getComputedStyle(el).fontSize, padding: getComputedStyle(el).padding })),
    pills: pills.slice(0, 5).map((el, index) => ({ index, ...rect(el), fontSize: getComputedStyle(el.querySelector('strong')).fontSize })),
    sliders: sliders.map((el, index) => ({ index, ...rect(el) })),
  }
})

console.log(JSON.stringify(metrics, null, 2))
await page.screenshot({ path: 'ui-check-mobile-landscape.png' })
await browser.close()

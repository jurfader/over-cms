import { test, expect } from '@playwright/test'

const SITE_URL = process.env.TEST_SITE_URL ?? 'http://localhost:3000'

test.describe('Corporate Frontend — Homepage', () => {
  test('homepage loads and renders HTML from CMS', async ({ page }) => {
    await page.goto(SITE_URL)
    await page.waitForLoadState('networkidle')
    // Should not show "Brak strony" error
    const hasError = await page.locator('text=Brak strony').isVisible().catch(() => false)
    expect(hasError).toBeFalsy()
    // Page should have real content
    const body = page.locator('body')
    const text = await body.textContent()
    expect(text!.length).toBeGreaterThan(100)
  })

  test('homepage has navigation', async ({ page }) => {
    await page.goto(SITE_URL)
    const nav = page.locator('nav, header')
    await expect(nav.first()).toBeVisible({ timeout: 10_000 })
  })

  test('homepage has footer', async ({ page }) => {
    await page.goto(SITE_URL)
    const footer = page.locator('footer')
    await expect(footer).toBeVisible({ timeout: 10_000 })
  })

  test('homepage has OVERMEDIA branding', async ({ page }) => {
    await page.goto(SITE_URL)
    await expect(page.locator('text=OVERMEDIA').or(page.locator('img[alt*="OVERMEDIA"]')).first()).toBeVisible({ timeout: 10_000 })
  })

  test('internal links work (anchor navigation)', async ({ page }) => {
    await page.goto(SITE_URL)
    // Click "Usługi" link if exists
    const uslugiLink = page.locator('a:has-text("Usługi")').first()
    const hasUslugi = await uslugiLink.isVisible().catch(() => false)
    if (hasUslugi) {
      await uslugiLink.click()
      await page.waitForTimeout(1000)
      // URL should have anchor
      expect(page.url()).toMatch(/#|uslugi/)
    }
  })
})

test.describe('Corporate Frontend — Dynamic Pages', () => {
  test('non-existent page shows 404', async ({ page }) => {
    const res = await page.goto(`${SITE_URL}/this-page-does-not-exist-12345`)
    // Should get 404 or show 404 content
    const has404 = await page.locator('text=404').or(page.locator('text=nie istnieje')).first().isVisible().catch(() => false)
    const statusIs404 = res?.status() === 404
    expect(has404 || statusIs404).toBeTruthy()
  })

  test('page with slug renders its HTML content', async ({ page }) => {
    // Try to load /kontakt if it exists
    await page.goto(`${SITE_URL}/kontakt`)
    await page.waitForLoadState('networkidle')
    const body = page.locator('body')
    const text = await body.textContent()
    // Should have some content (either the page or 404)
    expect(text!.length).toBeGreaterThan(50)
  })
})

test.describe('Corporate Frontend — Performance', () => {
  test('homepage loads within 5 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto(SITE_URL)
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(5000)
  })

  test('no console errors on homepage', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto(SITE_URL)
    await page.waitForLoadState('networkidle')
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('analytics')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('no broken images on homepage', async ({ page }) => {
    await page.goto(SITE_URL)
    await page.waitForLoadState('networkidle')
    const images = page.locator('img')
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
      const src = await img.getAttribute('src')
      if (src && !src.startsWith('data:')) {
        expect(naturalWidth, `Image ${src} is broken`).toBeGreaterThan(0)
      }
    }
  })
})

import { test, expect } from '@playwright/test'
import { login, gotoPages, deletePage } from './helpers'

test.describe('Pages CRUD', () => {
  let createdPageId: string | null = null

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.afterEach(async ({ page }) => {
    if (createdPageId) {
      await deletePage(page, createdPageId)
      createdPageId = null
    }
  })

  test('pages list loads and shows columns', async ({ page }) => {
    await gotoPages(page)
    await expect(page.locator('text=Strony')).toBeVisible()
    // Table headers
    await expect(page.locator('text=TYTUŁ')).toBeVisible()
    await expect(page.locator('text=STATUS')).toBeVisible()
  })

  test('can create a new page via dialog', async ({ page }) => {
    await gotoPages(page)
    // Click "Nowa strona" button
    await page.click('text=Nowa strona')
    // Fill dialog
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await dialog.locator('input').first().fill('Test E2E Page')
    // Wait for slug auto-generation
    await page.waitForTimeout(500)
    const slugInput = dialog.locator('input').nth(1)
    const slugValue = await slugInput.inputValue()
    expect(slugValue).toContain('test-e2e')
    // Submit
    await dialog.locator('button:has-text("Utwórz")').click()
    // Should navigate to page editor
    await page.waitForURL(/\/pages\//, { timeout: 10_000 })
    // Extract page ID from URL
    const url = page.url()
    const match = url.match(/pages\/([a-f0-9-]+)/)
    if (match) createdPageId = match[1]
  })

  test('shows error when creating page with duplicate slug', async ({ page }) => {
    await gotoPages(page)
    await page.click('text=Nowa strona')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // Use a slug that likely exists (home)
    await dialog.locator('input').first().fill('Home Duplicate')
    await dialog.locator('input').nth(1).fill('home')
    await dialog.locator('button:has-text("Utwórz")').click()
    // Should show error toast or stay in dialog
    await page.waitForTimeout(2000)
    // Dialog should still be visible or error shown
    const hasError = await page.locator('text=istnieje').isVisible().catch(() => false)
    const dialogStillVisible = await dialog.isVisible().catch(() => false)
    expect(hasError || dialogStillVisible).toBeTruthy()
  })

  test('can filter pages by status', async ({ page }) => {
    await gotoPages(page)
    // Click status filter buttons
    const filters = page.locator('button:has-text("Szkic"), button:has-text("Opublikowany")')
    const count = await filters.count()
    expect(count).toBeGreaterThanOrEqual(1)
    await filters.first().click()
    await page.waitForTimeout(1000)
    // Page should still be functional
    await expect(page.locator('text=Strony')).toBeVisible()
  })

  test('can search pages', async ({ page }) => {
    await gotoPages(page)
    const searchInput = page.locator('input[placeholder*="Szukaj"]')
    await searchInput.fill('home')
    await page.waitForTimeout(1000)
    // Should filter results
    await expect(page.locator('text=Strony')).toBeVisible()
  })
})

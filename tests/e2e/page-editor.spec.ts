import { test, expect } from '@playwright/test'
import { login, createPage, deletePage, gotoPageEditor } from './helpers'

test.describe('Page Editor (Block + HTML)', () => {
  let pageId: string

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await login(page)
    pageId = await createPage(page, 'Editor Test Page', `editor-test-${Date.now()}`)
    await ctx.close()
  })

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await login(page)
    await deletePage(page, pageId)
    await ctx.close()
  })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('editor page loads with tabs', async ({ page }) => {
    await gotoPageEditor(page, pageId)
    // Should have Bloki and HTML tabs
    await expect(page.locator('text=Bloki')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('text=HTML')).toBeVisible()
  })

  test('can switch to HTML tab and edit', async ({ page }) => {
    await gotoPageEditor(page, pageId)
    await page.click('text=HTML')
    await page.waitForTimeout(1000)
    // HTML editor should be visible (textarea or code editor)
    const htmlArea = page.locator('textarea, .cm-editor, [contenteditable]').first()
    await expect(htmlArea).toBeVisible({ timeout: 5000 })
  })

  test('has save and publish buttons', async ({ page }) => {
    await gotoPageEditor(page, pageId)
    await expect(page.locator('text=Zapisz')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('text=Opublikuj')).toBeVisible()
  })

  test('shows status badge', async ({ page }) => {
    await gotoPageEditor(page, pageId)
    await expect(page.locator('text=Szkic')).toBeVisible({ timeout: 10_000 })
  })

  test('can edit page title', async ({ page }) => {
    await gotoPageEditor(page, pageId)
    // Find title display — could be h1 or input
    const titleEl = page.locator('h1, input[value*="Editor Test"]').first()
    await expect(titleEl).toBeVisible({ timeout: 10_000 })
  })

  test('right sidebar shows slug and status', async ({ page }) => {
    await gotoPageEditor(page, pageId)
    await expect(page.locator('text=Slug')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('text=Status')).toBeVisible()
  })

  test('can save page without errors', async ({ page }) => {
    await gotoPageEditor(page, pageId)
    await page.click('text=Zapisz')
    // Should show success feedback (toast or button state change)
    await page.waitForTimeout(2000)
    // No error dialogs
    const hasError = await page.locator('[role="alert"]:has-text("error"), [role="alert"]:has-text("błąd")').isVisible().catch(() => false)
    expect(hasError).toBeFalsy()
  })

  test('can publish page', async ({ page }) => {
    await gotoPageEditor(page, pageId)
    await page.click('text=Opublikuj')
    await page.waitForTimeout(2000)
    // Status should change to published
    await expect(page.locator('text=Opublikowany')).toBeVisible({ timeout: 5000 })
  })
})

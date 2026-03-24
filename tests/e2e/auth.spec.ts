import { test, expect } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASS } from './helpers'

const BASE = process.env.TEST_URL ?? 'http://localhost:3001'
const API = process.env.TEST_API_URL ?? 'http://localhost:3333'

test.describe('Authentication', () => {
  test('shows login page for unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE}/admin/dashboard`)
    // Should redirect to login
    await expect(page).toHaveURL(/auth\/login/)
  })

  test('can log in with valid credentials', async ({ page }) => {
    await page.goto(`${BASE}/admin/auth/login`)
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASS)
    await page.click('button[type="submit"]')
    await page.waitForURL(/dashboard/, { timeout: 15_000 })
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto(`${BASE}/admin/auth/login`)
    await page.fill('input[type="email"]', 'wrong@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Should stay on login or show error
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/auth\/login/)
  })
})

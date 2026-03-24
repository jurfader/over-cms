import { type Page, expect } from '@playwright/test'

const BASE = process.env.TEST_URL ?? 'http://localhost:3001'
const API = process.env.TEST_API_URL ?? 'http://localhost:3333'

export const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'admin@overcms.local'
export const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? 'admin123'

/** Log in via API and inject session cookie */
export async function login(page: Page) {
  const res = await page.request.post(`${API}/api/auth/sign-in/email`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASS },
  })
  expect(res.ok()).toBeTruthy()
  // cookies are set automatically by the browser context
  await page.goto(`${BASE}/admin/dashboard`)
  await page.waitForURL(/dashboard/, { timeout: 10_000 })
}

/** Create a page via API, return its id */
export async function createPage(page: Page, title: string, slug: string) {
  const res = await page.request.post(`${API}/api/content/page`, {
    data: { title, slug, data: {}, status: 'draft' },
  })
  expect(res.ok()).toBeTruthy()
  const json = await res.json()
  return json.data?.id ?? json.id
}

/** Delete a page via API */
export async function deletePage(page: Page, id: string) {
  await page.request.delete(`${API}/api/content/page/${id}`)
}

/** Navigate to pages list */
export async function gotoPages(page: Page) {
  await page.goto(`${BASE}/admin/pages`)
  await page.waitForLoadState('networkidle')
}

/** Navigate to page editor */
export async function gotoPageEditor(page: Page, id: string) {
  await page.goto(`${BASE}/admin/pages/${id}`)
  await page.waitForLoadState('networkidle')
}

/** Navigate to visual builder */
export async function gotoVisualBuilder(page: Page, id: string) {
  await page.goto(`${BASE}/admin/pages/${id}/visual-builder`)
  await page.waitForLoadState('networkidle')
}

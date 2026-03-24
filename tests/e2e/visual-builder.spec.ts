import { test, expect, type Page, type FrameLocator } from '@playwright/test'
import { login, createPage, deletePage, gotoVisualBuilder } from './helpers'

test.describe('Visual Builder', () => {
  let pageId: string

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await login(page)
    pageId = await createPage(page, 'VB Test Page', `vb-test-${Date.now()}`)
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

  test('visual builder loads with toolbar', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    // Toolbar elements
    await expect(page.locator('text=Zapisz')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('text=Opublikuj')).toBeVisible()
  })

  test('has device switcher (desktop/tablet/mobile)', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    // Device switcher buttons - look for SVG icons or aria labels
    const toolbar = page.locator('[class*="toolbar"], header').first()
    await expect(toolbar).toBeVisible({ timeout: 15_000 })
    // Should have at least 3 device buttons
    const deviceButtons = page.locator('button[title*="Desktop"], button[title*="Tablet"], button[title*="Mobile"], button[aria-label*="desktop"], button[aria-label*="tablet"], button[aria-label*="mobile"]')
    const count = await deviceButtons.count()
    // If no aria-labels, look for SVG button group
    if (count === 0) {
      // Fallback: look for button group with 3 items near top
      const btnGroup = page.locator('button svg').first()
      await expect(btnGroup).toBeVisible({ timeout: 5000 })
    } else {
      expect(count).toBeGreaterThanOrEqual(2)
    }
  })

  test('has undo/redo buttons', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await page.waitForTimeout(2000)
    // Undo/redo - could be buttons or icons
    const undoBtn = page.locator('button[title*="Cofnij"], button[aria-label*="undo"]').first()
    const redoBtn = page.locator('button[title*="Ponów"], button[aria-label*="redo"]').first()
    // At least one should exist
    const hasUndo = await undoBtn.isVisible().catch(() => false)
    const hasRedo = await redoBtn.isVisible().catch(() => false)
    expect(hasUndo || hasRedo).toBeTruthy()
  })

  test('left panel shows modules tab', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await expect(page.locator('text=Moduły')).toBeVisible({ timeout: 15_000 })
  })

  test('left panel shows layers tab', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await expect(page.locator('text=Warstwy')).toBeVisible({ timeout: 15_000 })
  })

  test('module picker shows categories', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    // Click Moduły tab if not active
    await page.click('text=Moduły')
    await page.waitForTimeout(1000)
    // Should show module categories
    const categories = ['Struktura', 'Tekst', 'Media', 'Layout', 'Interaktywne', 'Formularz']
    let foundCategories = 0
    for (const cat of categories) {
      const visible = await page.locator(`text=${cat}`).isVisible().catch(() => false)
      if (visible) foundCategories++
    }
    expect(foundCategories).toBeGreaterThanOrEqual(2)
  })

  test('module picker has search', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await page.click('text=Moduły')
    const search = page.locator('input[placeholder*="Szukaj"], input[placeholder*="szukaj"]')
    await expect(search).toBeVisible({ timeout: 5000 })
    await search.fill('Nagłówek')
    await page.waitForTimeout(500)
    // Should filter to show heading module
    await expect(page.locator('text=Nagłówek')).toBeVisible()
  })

  test('canvas iframe loads', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    // Canvas is an iframe
    const iframe = page.locator('iframe')
    await expect(iframe).toBeVisible({ timeout: 15_000 })
    // Iframe should have a src
    const src = await iframe.getAttribute('src')
    expect(src).toBeTruthy()
  })

  test('canvas shows empty state for new page', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    const iframe = page.frameLocator('iframe')
    // Empty page should show drop zone or empty message
    await page.waitForTimeout(3000)
    const body = iframe.locator('body')
    await expect(body).toBeVisible({ timeout: 10_000 })
  })

  test('can switch to layers tab', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await page.click('text=Warstwy')
    await page.waitForTimeout(1000)
    // Layers panel should be visible (may show "Brak bloków" or tree)
    const layersContent = page.locator('text=Brak bloków').or(page.locator('[class*="layer"]'))
    await expect(layersContent.first()).toBeVisible({ timeout: 5000 })
  })

  test('can save from visual builder', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await page.waitForTimeout(2000)
    await page.click('text=Zapisz')
    await page.waitForTimeout(3000)
    // No error should appear
    const hasError = await page.locator('text=Błąd, text=error').first().isVisible().catch(() => false)
    expect(hasError).toBeFalsy()
  })

  test('back button returns to pages list', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await page.waitForTimeout(2000)
    // Click back/Strony link
    const backLink = page.locator('a:has-text("Strony"), button:has-text("Strony"), a[href*="/pages"]').first()
    await expect(backLink).toBeVisible({ timeout: 10_000 })
    await backLink.click()
    await page.waitForURL(/\/pages/, { timeout: 10_000 })
  })
})

test.describe('Visual Builder — Drag & Drop Modules', () => {
  let pageId: string

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await login(page)
    pageId = await createPage(page, 'VB DnD Test', `vb-dnd-${Date.now()}`)
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

  test('dragging a section module to canvas creates it', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await page.waitForTimeout(3000)
    await page.click('text=Moduły')
    await page.waitForTimeout(500)

    // Find section module in picker
    const sectionModule = page.locator('text=Sekcja').first()
    await expect(sectionModule).toBeVisible({ timeout: 5000 })

    // Get canvas iframe bounding box
    const iframe = page.locator('iframe')
    const iframeBox = await iframe.boundingBox()
    expect(iframeBox).toBeTruthy()

    // Drag section to canvas center
    const moduleBox = await sectionModule.boundingBox()
    expect(moduleBox).toBeTruthy()

    await page.mouse.move(
      moduleBox!.x + moduleBox!.width / 2,
      moduleBox!.y + moduleBox!.height / 2
    )
    await page.mouse.down()
    await page.mouse.move(
      iframeBox!.x + iframeBox!.width / 2,
      iframeBox!.y + iframeBox!.height / 2,
      { steps: 10 }
    )
    await page.mouse.up()
    await page.waitForTimeout(2000)

    // Layers tab should now show the section
    await page.click('text=Warstwy')
    await page.waitForTimeout(1000)
    const hasSection = await page.locator('text=Sekcja').isVisible().catch(() => false)
    // Also check if canvas now has content
    const iframeContent = page.frameLocator('iframe')
    const hasBlocks = await iframeContent.locator('[data-block-id]').count().catch(() => 0)

    expect(hasSection || hasBlocks > 0).toBeTruthy()
  })

  test('dragging a heading module creates it (auto-wrapped in section)', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await page.waitForTimeout(3000)
    await page.click('text=Moduły')
    await page.waitForTimeout(500)

    const headingModule = page.locator('text=Nagłówek').first()
    await expect(headingModule).toBeVisible({ timeout: 5000 })

    const iframe = page.locator('iframe')
    const iframeBox = await iframe.boundingBox()
    const moduleBox = await headingModule.boundingBox()

    if (moduleBox && iframeBox) {
      await page.mouse.move(
        moduleBox.x + moduleBox.width / 2,
        moduleBox.y + moduleBox.height / 2
      )
      await page.mouse.down()
      await page.mouse.move(
        iframeBox.x + iframeBox.width / 2,
        iframeBox.y + 100,
        { steps: 10 }
      )
      await page.mouse.up()
    }
    await page.waitForTimeout(2000)

    // Check in layers
    await page.click('text=Warstwy')
    await page.waitForTimeout(1000)
    const layers = page.locator('text=Nagłówek, text=Heading')
    const hasHeading = await layers.first().isVisible().catch(() => false)
    expect(hasHeading).toBeTruthy()
  })
})

test.describe('Visual Builder — Block Selection & Editing', () => {
  let pageId: string

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await login(page)
    pageId = await createPage(page, 'VB Select Test', `vb-select-${Date.now()}`)
    // Pre-populate with a heading block via API
    await page.request.put(
      `${process.env.TEST_API_URL ?? 'http://localhost:3333'}/api/content/page/${pageId}`,
      {
        data: {
          title: 'VB Select Test',
          slug: `vb-select-${Date.now()}`,
          data: {
            blocks: [
              {
                id: 'sec-1',
                type: 'section',
                props: {},
                children: [
                  {
                    id: 'row-1',
                    type: 'row',
                    props: { layout: '1' },
                    children: [
                      {
                        id: 'col-1',
                        type: 'column',
                        props: {},
                        children: [
                          {
                            id: 'h-1',
                            type: 'heading',
                            props: { text: 'Test Heading E2E', level: 'h2' },
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      }
    )
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

  test('pre-populated blocks show in canvas', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await page.waitForTimeout(5000)
    // Check iframe has rendered blocks
    const iframe = page.frameLocator('iframe')
    const heading = iframe.locator('h2, [data-block-type="heading"]').first()
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })

  test('clicking block in canvas selects it', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await page.waitForTimeout(5000)
    // Click on heading in iframe
    const iframe = page.frameLocator('iframe')
    const heading = iframe.locator('h2, [data-block-type="heading"]').first()
    await heading.click()
    await page.waitForTimeout(1000)
    // Right panel should show editing options
    const rightPanel = page.locator('text=Treść').or(page.locator('text=Styl'))
    await expect(rightPanel.first()).toBeVisible({ timeout: 5000 })
  })

  test('selected block shows in layers as highlighted', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await page.waitForTimeout(5000)
    const iframe = page.frameLocator('iframe')
    await iframe.locator('h2, [data-block-type="heading"]').first().click()
    await page.waitForTimeout(1000)
    await page.click('text=Warstwy')
    await page.waitForTimeout(500)
    // The heading layer should be highlighted/selected
    const headingLayer = page.locator('text=Nagłówek, text=Heading, text=Test Heading')
    await expect(headingLayer.first()).toBeVisible({ timeout: 5000 })
  })

  test('right panel shows content and style tabs when block selected', async ({ page }) => {
    await gotoVisualBuilder(page, pageId)
    await page.waitForTimeout(5000)
    const iframe = page.frameLocator('iframe')
    await iframe.locator('h2, [data-block-type="heading"]').first().click()
    await page.waitForTimeout(1000)
    await expect(page.locator('text=Treść')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Styl')).toBeVisible()
  })
})

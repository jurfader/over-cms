import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 1,
  fullyParallel: false,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.TEST_URL ?? 'http://localhost:3001',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'auth',
      testMatch: 'auth.spec.ts',
    },
    {
      name: 'pages',
      testMatch: 'pages-crud.spec.ts',
      dependencies: ['auth'],
    },
    {
      name: 'editor',
      testMatch: 'page-editor.spec.ts',
      dependencies: ['auth'],
    },
    {
      name: 'visual-builder',
      testMatch: 'visual-builder.spec.ts',
      dependencies: ['auth'],
    },
    {
      name: 'frontend',
      testMatch: 'corporate-frontend.spec.ts',
    },
  ],
  webServer: undefined, // admin + api must be started manually before tests
})

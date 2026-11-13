import { defineConfig, devices } from '@playwright/test';
const aislado = process.env['E2E_AISLADO'] === '1';
const baseURL =
  process.env['E2E_BASE_URL'] ?? (aislado ? 'http://localhost:14200' : 'http://localhost:4200');
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium' } }],
  webServer: {
    command: aislado ? 'npm run start:e2e' : 'npm start',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

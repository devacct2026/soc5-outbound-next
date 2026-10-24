import { defineConfig, devices } from '@playwright/test';

const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd ../backend && npm run start:dev',
      url: 'http://127.0.0.1:3001/api/health',
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer,
      timeout: 120_000,
    },
  ],
});

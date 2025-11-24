import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright-tests',
  fullyParallel: true,
  use: {
    storageState: 'auth.json',
    headless: true,
  },
});


/**
 * Playwright configuration specifically for routing and locale tests
 * Optimized for CI/CD pipeline execution
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'routing-and-locale.spec.ts',

  /* Timeout settings optimized for routing tests */
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  /* Run tests in parallel for faster execution */
  fullyParallel: true,

  /* Fail fast in CI */
  forbidOnly: !!process.env.CI,

  /* Retry strategy */
  retries: process.env.CI ? 2 : 1,

  /* Worker configuration */
  workers: process.env.CI ? 2 : undefined,

  /* Reporter configuration for CI/CD */
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/routing-test-results.json' }],
    ['junit', { outputFile: 'test-results/routing-test-results.xml' }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  /* Global test settings */
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000/nephio-oran-claude-agents',

    /* Collect trace only on failure to save space */
    trace: 'retain-on-failure',

    /* Screenshots on failure */
    screenshot: 'only-on-failure',

    /* No video recording for routing tests to save space */
    video: 'retain-on-failure',

    /* Navigation timeout */
    navigationTimeout: 15000,

    /* Action timeout */
    actionTimeout: 10000,

    /* Ignore HTTPS errors in test environment */
    ignoreHTTPSErrors: true,

    /* User agent for testing */
    userAgent: 'Nephio-E2E-Tests/1.0',

    /* Locale for testing */
    locale: 'en-US',

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'X-Test-Environment': 'e2e',
    },
  },

  /* Test projects for different scenarios */
  projects: [
    {
      name: 'routing-chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },

    {
      name: 'routing-firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'routing-safari',
      use: { ...devices['Desktop Safari'] },
      // Only run Safari tests in macOS environments
      testIgnore: process.platform !== 'darwin' ? '**/*' : undefined,
    },

    {
      name: 'routing-mobile',
      use: {
        ...devices['Pixel 5'],
        // Test mobile-specific routing behavior
      },
    },

    {
      name: 'routing-edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
      // Only run Edge tests on Windows
      testIgnore: process.platform !== 'win32' ? '**/*' : undefined,
    },
  ],

  /* Web server configuration */
  webServer: {
    command: process.env.CI ? 'npm run serve' : 'npm run start:fast',
    url: process.env.BASE_URL || 'http://localhost:3000/nephio-oran-claude-agents',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'development', // Use development to ensure unsafe-inline is allowed
      DISABLE_CSP_FOR_TESTS: 'true',
    },
  },

  /* Global setup and teardown */
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  /* Output directory */
  outputDir: 'test-results/routing-tests',

  /* Test metadata */
  metadata: {
    testSuite: 'Routing and Locale Tests',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'test',
  },
});

/**
 * Global setup for Playwright E2E tests
 * Ensures the application is ready for testing
 */

import { chromium, FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');
  
  try {
    // Install Playwright browsers if not available in CI
    if (process.env.CI) {
      console.log('📦 Installing Playwright browsers for CI...');
      try {
        execSync('npx playwright install chromium', { stdio: 'inherit' });
        console.log('✅ Playwright browsers installed successfully');
      } catch (error) {
        console.error('❌ Failed to install Playwright browsers:', error);
        throw error;
      }
    }
    
    // Skip browser launch if Playwright browsers are not installed (CI environment)
    let browser;
    let page;
    
    try {
      browser = await chromium.launch({ headless: true });
      page = await browser.newPage();
    } catch (error: any) {
      if (error.message?.includes("Executable doesn't exist") || error.message?.includes("playwright install")) {
        console.log('⚠️  Playwright browsers not installed. Attempting to install...');
        try {
          execSync('npx playwright install chromium', { stdio: 'inherit' });
          browser = await chromium.launch({ headless: true });
          page = await browser.newPage();
          console.log('✅ Browsers installed and launched successfully');
        } catch (installError) {
          console.log('❌ Failed to install browsers. Skipping browser-based setup.');
          console.log('   Run "npx playwright install" manually to install browsers.');
          return; // Skip the rest of setup gracefully
        }
      } else {
        throw error; // Re-throw other errors
      }
    }
    
    // Get the base URL from config or environment
    const baseURL = config.webServer?.url || process.env.BASE_URL || 'http://localhost:3000/nephio-oran-claude-agents';
    
    console.log(`📡 Checking if application is available at ${baseURL}`);
    
    // Wait for the application to be ready
    let retries = 0;
    const maxRetries = 60; // 60 seconds timeout for CI
    const retryInterval = process.env.CI ? 2000 : 1000; // Longer intervals in CI
    
    while (retries < maxRetries) {
      try {
        const response = await page.goto(baseURL, { 
          timeout: 10000,
          waitUntil: 'networkidle'
        });
        
        if (response && response.status() < 400) {
          console.log(`✅ Application is ready at ${baseURL}`);
          break;
        }
      } catch (error) {
        retries++;
        console.log(`⏳ Waiting for application... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
    
    if (retries >= maxRetries) {
      throw new Error(`❌ Application not available at ${baseURL} after ${maxRetries} seconds`);
    }
    
    // Verify critical pages are accessible
    const criticalPages = [
      '/',
      '/docs/intro',
      '/zh-TW/docs/intro',
    ];
    
    for (const pagePath of criticalPages) {
      try {
        const response = await page.goto(`${baseURL}${pagePath}`, { timeout: 10000 });
        if (!response || response.status() >= 400) {
          console.warn(`⚠️  Critical page ${pagePath} returned status ${response?.status()}`);
        } else {
          console.log(`✅ Critical page ${pagePath} is accessible`);
        }
      } catch (error) {
        console.warn(`⚠️  Critical page ${pagePath} failed to load:`, error);
      }
    }
    
    await browser.close();
    console.log('✅ E2E test environment setup complete');
    
  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error);
    throw error;
  }
}

export default globalSetup;
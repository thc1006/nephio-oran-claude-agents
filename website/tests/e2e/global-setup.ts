/**
 * Global setup for Playwright E2E tests
 * Ensures the application is ready for testing
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');
  
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Get the base URL from config or environment
    const baseURL = config.webServer?.url || process.env.BASE_URL || 'http://localhost:3000';
    
    console.log(`📡 Checking if application is available at ${baseURL}`);
    
    // Wait for the application to be ready
    let retries = 0;
    const maxRetries = 30; // 30 seconds timeout
    
    while (retries < maxRetries) {
      try {
        const response = await page.goto(baseURL, { timeout: 5000 });
        
        if (response && response.status() < 400) {
          console.log(`✅ Application is ready at ${baseURL}`);
          break;
        }
      } catch (error) {
        retries++;
        console.log(`⏳ Waiting for application... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
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
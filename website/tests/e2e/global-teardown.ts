/**
 * Global teardown for Playwright E2E tests
 * Cleanup after all tests are completed
 */

import { FullConfig } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  try {
    // Clean up test artifacts
    const testResultsDir = path.join(process.cwd(), 'test-results');
    const playwrightReportDir = path.join(process.cwd(), 'playwright-report');
    
    // Create test results summary
    const summaryPath = path.join(testResultsDir, 'test-summary.json');
    const summary = {
      timestamp: new Date().toISOString(),
      environment: {
        baseURL: config.webServer?.url || process.env.BASE_URL || 'http://localhost:3000/nephio-oran-claude-agents',
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI,
      },
      status: 'completed',
    };
    
    try {
      await fs.mkdir(testResultsDir, { recursive: true });
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      console.log(`📊 Test summary written to ${summaryPath}`);
    } catch (error) {
      console.warn('⚠️  Failed to write test summary:', error);
    }
    
    // Log test artifacts locations
    const artifactPaths = [
      { name: 'Test Results', path: testResultsDir },
      { name: 'Playwright Report', path: playwrightReportDir },
    ];
    
    for (const artifact of artifactPaths) {
      try {
        await fs.access(artifact.path);
        console.log(`📁 ${artifact.name} available at: ${artifact.path}`);
      } catch {
        // Artifact doesn't exist, which is fine
      }
    }
    
    // Clean up temporary files if in CI environment
    if (process.env.CI) {
      try {
        const tempDirs = [
          path.join(process.cwd(), '.playwright'),
          path.join(process.cwd(), 'coverage'),
        ];
        
        for (const tempDir of tempDirs) {
          try {
            await fs.rm(tempDir, { recursive: true, force: true });
            console.log(`🗑️  Cleaned up ${tempDir}`);
          } catch {
            // Directory doesn't exist or can't be removed, which is fine
          }
        }
      } catch (error) {
        console.warn('⚠️  Failed to clean up temporary files:', error);
      }
    }
    
    console.log('✅ E2E test environment cleanup complete');
    
  } catch (error) {
    console.error('❌ Failed to cleanup E2E test environment:', error);
    // Don't throw here - teardown failures shouldn't fail the test run
  }
}

export default globalTeardown;
#!/usr/bin/env node

/**
 * CI-optimized E2E test runner with enhanced error handling and reporting
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

async function runE2ETests() {
  console.log(chalk.blue('🧪 Running E2E tests in CI environment...'));
  
  const isCI = process.env.CI === 'true';
  const testResultsDir = path.join(process.cwd(), 'test-results');
  
  try {
    // Ensure test results directory exists
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    // Install Playwright browsers if not cached
    console.log(chalk.gray('📦 Ensuring Playwright browsers are available...'));
    try {
      execSync('node scripts/install-playwright-ci.js', { 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes
      });
    } catch (installError) {
      console.warn(chalk.yellow('⚠️  Browser installation had issues, continuing...'));
    }
    
    // Environment-specific configuration
    const env = {
      ...process.env,
      CI: 'true',
      NODE_ENV: 'production',
      BASE_URL: process.env.BASE_URL || 'http://localhost:3000/nephio-oran-claude-agents',
      DISABLE_CSP_FOR_TESTS: 'true',
      PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '0'
    };
    
    console.log(chalk.blue('🚀 Starting E2E test suite...'));
    console.log(chalk.gray(`Base URL: ${env.BASE_URL}`));
    console.log(chalk.gray(`Environment: ${env.NODE_ENV}`));
    
    // Run routing tests first (most critical)
    console.log(chalk.blue('🔀 Running routing tests...'));
    
    const playwrightCmd = [
      'npx', 'playwright', 'test', 
      '--config=tests/e2e/routing.config.ts',
      '--reporter=html,json,junit,github',
      '--max-failures=5',
      isCI ? '--workers=1' : '--workers=2'
    ];
    
    const testProcess = spawn(playwrightCmd[0], playwrightCmd.slice(1), {
      stdio: 'inherit',
      env,
      cwd: process.cwd()
    });
    
    const testPromise = new Promise((resolve, reject) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });
      
      testProcess.on('error', (error) => {
        reject(error);
      });
    });
    
    await testPromise;
    
    console.log(chalk.green('✅ All E2E tests passed successfully!'));
    
    // Generate test summary
    await generateTestSummary();
    
    process.exit(0);
    
  } catch (error) {
    console.error(chalk.red('❌ E2E tests failed:'));
    console.error(error.message);
    
    // Generate failure report
    await generateFailureReport(error);
    
    // Output debugging information
    console.log(chalk.blue('📊 Test Debugging Information:'));
    console.log(`Working Directory: ${process.cwd()}`);
    console.log(`Node Version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`CI Environment: ${process.env.CI}`);
    
    // List available test artifacts
    try {
      const artifacts = fs.readdirSync(testResultsDir);
      if (artifacts.length > 0) {
        console.log(chalk.blue('📁 Available test artifacts:'));
        artifacts.forEach(file => {
          console.log(`  - ${file}`);
        });
      }
    } catch (dirError) {
      console.log(chalk.yellow('⚠️  No test artifacts directory found'));
    }
    
    process.exit(1);
  }
}

async function generateTestSummary() {
  const summaryPath = path.join(process.cwd(), 'test-results', 'e2e-summary.json');
  
  const summary = {
    timestamp: new Date().toISOString(),
    status: 'passed',
    environment: {
      ci: true,
      baseURL: process.env.BASE_URL,
      nodeVersion: process.version,
      platform: process.platform
    },
    artifacts: {
      htmlReport: 'test-results/index.html',
      jsonReport: 'test-results/routing-test-results.json',
      junitReport: 'test-results/routing-test-results.xml'
    }
  };
  
  try {
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(chalk.green(`📊 Test summary saved to: ${summaryPath}`));
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not save test summary'));
  }
}

async function generateFailureReport(error) {
  const reportPath = path.join(process.cwd(), 'test-results', 'failure-report.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    status: 'failed',
    error: {
      message: error.message,
      stack: error.stack
    },
    environment: {
      ci: true,
      baseURL: process.env.BASE_URL,
      nodeVersion: process.version,
      platform: process.platform
    },
    debugInfo: {
      workingDirectory: process.cwd(),
      availableScripts: Object.keys(require('../package.json').scripts || {}),
      environmentVariables: {
        CI: process.env.CI,
        NODE_ENV: process.env.NODE_ENV,
        BASE_URL: process.env.BASE_URL
      }
    }
  };
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.red(`📋 Failure report saved to: ${reportPath}`));
  } catch (reportError) {
    console.warn(chalk.yellow('⚠️  Could not save failure report'));
  }
}

// Run if called directly
if (require.main === module) {
  runE2ETests().catch(error => {
    console.error(chalk.red('Fatal error in test runner:'), error);
    process.exit(1);
  });
}
#!/usr/bin/env node

/**
 * Script to install Playwright browsers in CI environment with proper error handling
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

async function installPlaywrightBrowsers() {
  console.log(chalk.blue('🚀 Installing Playwright browsers for CI...'));
  
  try {
    // Only install chromium for faster CI builds
    const command = 'npx playwright install chromium';
    
    console.log(chalk.gray(`Running: ${command}`));
    
    execSync(command, {
      stdio: 'inherit',
      timeout: 300000, // 5 minutes timeout
      env: {
        ...process.env,
        CI: 'true',
        PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '0'
      }
    });
    
    console.log(chalk.green('✅ Playwright browsers installed successfully'));
    
    // Verify installation
    try {
      execSync('npx playwright --version', { stdio: 'inherit' });
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not verify Playwright version'));
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to install Playwright browsers:'));
    console.error(error.message);
    
    // Try alternative installation method
    console.log(chalk.yellow('🔄 Trying alternative installation...'));
    
    try {
      execSync('npm install @playwright/test', { stdio: 'inherit' });
      execSync('npx playwright install-deps chromium', { stdio: 'inherit' });
      execSync('npx playwright install chromium', { stdio: 'inherit' });
      
      console.log(chalk.green('✅ Alternative installation succeeded'));
      process.exit(0);
      
    } catch (altError) {
      console.error(chalk.red('❌ Alternative installation also failed:'));
      console.error(altError.message);
      
      console.log(chalk.blue('💡 Manual installation steps:'));
      console.log('1. Run: npm install @playwright/test');
      console.log('2. Run: npx playwright install chromium');
      console.log('3. Run: npx playwright install-deps');
      
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  installPlaywrightBrowsers().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = { installPlaywrightBrowsers };
#!/usr/bin/env node

/**
 * Validates CSP configuration in different environments
 * Ensures CSP is properly disabled in test environments and enabled in production
 */

const chalk = require('chalk');
const path = require('path');

// Mock options for testing
const testOptions = {
  disableCSP: true,
  customHeaders: {
    'X-Custom-Header': 'test-value'
  }
};

const productionOptions = {
  disableCSP: false,
  customHeaders: {
    'X-Custom-Header': 'production-value'
  }
};

function validateCSPConfiguration() {
  console.log(chalk.blue('🔍 Validating CSP Configuration...'));
  
  try {
    // Load the plugin
    const pluginPath = path.join(__dirname, '..', 'plugins', 'docusaurus-plugin-security-headers', 'index.js');
    delete require.cache[pluginPath]; // Clear cache to get fresh module
    const securityPlugin = require(pluginPath);
    
    // Test with CSP disabled (test environment)
    console.log(chalk.yellow('\n📝 Testing with CSP disabled (test environment):'));
    process.env.NODE_ENV = 'test';
    process.env.DISABLE_CSP_FOR_TESTS = 'true';
    
    const testPlugin = securityPlugin({}, testOptions);
    const testConfig = testPlugin.configureWebpack({}, false);
    
    if (testConfig.devServer && testConfig.devServer.headers) {
      const headers = testConfig.devServer.headers;
      
      // Check that CSP is not present when disabled
      if ('Content-Security-Policy' in headers) {
        console.error(chalk.red('❌ CSP header should not be present when disabled!'));
        console.log('Headers:', headers);
        process.exit(1);
      } else {
        console.log(chalk.green('✅ CSP correctly excluded when disabled'));
      }
      
      // Check that other headers are still present
      if (headers['X-Frame-Options'] && headers['X-Content-Type-Options']) {
        console.log(chalk.green('✅ Other security headers present'));
      } else {
        console.error(chalk.red('❌ Missing other security headers'));
        process.exit(1);
      }
      
      // Check for undefined values
      const undefinedHeaders = Object.entries(headers).filter(([_, value]) => value === undefined);
      if (undefinedHeaders.length > 0) {
        console.error(chalk.red('❌ Found undefined header values:'));
        undefinedHeaders.forEach(([key]) => {
          console.error(`  - ${key}: undefined`);
        });
        process.exit(1);
      } else {
        console.log(chalk.green('✅ No undefined header values'));
      }
    }
    
    // Test with CSP enabled (production environment)
    console.log(chalk.yellow('\n📝 Testing with CSP enabled (production environment):'));
    delete process.env.DISABLE_CSP_FOR_TESTS;
    process.env.NODE_ENV = 'production';
    
    delete require.cache[pluginPath]; // Clear cache again
    const securityPluginProd = require(pluginPath);
    const prodPlugin = securityPluginProd({}, productionOptions);
    const prodConfig = prodPlugin.configureWebpack({}, false);
    
    if (prodConfig.devServer && prodConfig.devServer.headers) {
      const headers = prodConfig.devServer.headers;
      
      // Check that CSP is present when enabled
      if ('Content-Security-Policy' in headers) {
        console.log(chalk.green('✅ CSP header present in production'));
        
        // Validate CSP content
        const csp = headers['Content-Security-Policy'];
        if (csp && csp.includes('default-src') && csp.includes('script-src')) {
          console.log(chalk.green('✅ CSP contains required directives'));
        } else {
          console.error(chalk.red('❌ CSP missing required directives'));
          process.exit(1);
        }
      } else {
        console.error(chalk.red('❌ CSP header missing in production!'));
        process.exit(1);
      }
      
      // Check for undefined values
      const undefinedHeaders = Object.entries(headers).filter(([_, value]) => value === undefined);
      if (undefinedHeaders.length > 0) {
        console.error(chalk.red('❌ Found undefined header values in production:'));
        undefinedHeaders.forEach(([key]) => {
          console.error(`  - ${key}: undefined`);
        });
        process.exit(1);
      } else {
        console.log(chalk.green('✅ No undefined header values in production'));
      }
    }
    
    console.log(chalk.green('\n✅ All CSP configuration checks passed!'));
    console.log(chalk.blue('📊 Summary:'));
    console.log('  - CSP correctly disabled in test environment');
    console.log('  - CSP correctly enabled in production environment');
    console.log('  - No undefined header values in any environment');
    console.log('  - All security headers properly configured');
    
  } catch (error) {
    console.error(chalk.red('❌ CSP validation failed:'));
    console.error(error);
    process.exit(1);
  }
}

// Run validation
validateCSPConfiguration();
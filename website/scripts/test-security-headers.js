#!/usr/bin/env node

/**
 * Security Headers Test Script
 * 
 * Tests that all required security headers are present and properly configured
 * in the production build
 * 
 * Usage: node scripts/test-security-headers.js
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// Required security headers and their expected values/patterns
const REQUIRED_HEADERS = {
  'X-Frame-Options': {
    expected: 'DENY',
    severity: 'HIGH',
    description: 'Prevents clickjacking attacks'
  },
  'X-Content-Type-Options': {
    expected: 'nosniff',
    severity: 'HIGH',
    description: 'Prevents MIME type sniffing'
  },
  'X-XSS-Protection': {
    expected: '1; mode=block',
    severity: 'MEDIUM',
    description: 'XSS protection for legacy browsers'
  },
  'Referrer-Policy': {
    expected: /strict-origin-when-cross-origin|no-referrer/,
    severity: 'MEDIUM',
    description: 'Controls referrer information'
  },
  'Permissions-Policy': {
    expected: /camera=\(\)/,
    severity: 'MEDIUM',
    description: 'Restricts browser features'
  },
  'Strict-Transport-Security': {
    expected: /max-age=\d+/,
    severity: 'HIGH',
    description: 'Forces HTTPS connections'
  },
  'Content-Security-Policy': {
    expected: /default-src/,
    severity: 'CRITICAL',
    description: 'Prevents XSS and injection attacks'
  }
};

// CSP directives that should be present
const CSP_DIRECTIVES = [
  'default-src',
  'script-src',
  'style-src',
  'img-src',
  'font-src',
  'connect-src',
  'frame-ancestors',
  'base-uri',
  'form-action'
];

// Dangerous CSP values to avoid
const DANGEROUS_CSP_VALUES = [
  "'unsafe-eval'",
  "'unsafe-inline'",
  '*',
  'data:',
  'http:'
];

/**
 * Parse headers from file content
 */
function parseHeaders(content, format) {
  const headers = {};
  
  if (format === 'netlify') {
    // Parse Netlify _headers format
    const lines = content.split('\n');
    let currentPath = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('/')) {
        currentPath = trimmed;
      } else if (trimmed && currentPath === '/*') {
        const match = trimmed.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          headers[match[1]] = match[2];
        }
      }
    }
  } else if (format === 'json') {
    // Parse JSON format (vercel.json)
    try {
      const config = JSON.parse(content);
      if (config.headers && config.headers[0]) {
        const mainHeaders = config.headers.find(h => h.source === '/(.*)')?.headers || [];
        mainHeaders.forEach(h => {
          headers[h.key] = h.value;
        });
      }
    } catch (error) {
      console.error('Error parsing JSON headers:', error);
    }
  }
  
  return headers;
}

/**
 * Validate CSP header
 */
function validateCSP(cspValue) {
  const issues = [];
  const warnings = [];
  
  // Check for required directives
  for (const directive of CSP_DIRECTIVES) {
    if (!cspValue.includes(directive)) {
      warnings.push(`Missing CSP directive: ${directive}`);
    }
  }
  
  // Check for dangerous values
  for (const dangerous of DANGEROUS_CSP_VALUES) {
    if (cspValue.includes(dangerous)) {
      // Allow some exceptions
      if (dangerous === 'data:' && cspValue.includes('img-src')) {
        // data: URIs are acceptable for images
        continue;
      }
      if (dangerous === "'unsafe-inline'" && process.env.NODE_ENV === 'development') {
        // unsafe-inline might be needed in development
        warnings.push(`CSP contains '${dangerous}' (acceptable in development)`);
        continue;
      }
      issues.push(`CSP contains dangerous value: ${dangerous}`);
    }
  }
  
  return { issues, warnings };
}

/**
 * Test security headers
 */
async function testSecurityHeaders() {
  console.log(chalk.blue.bold('\nSecurity Headers Test\n'));
  
  let allPassed = true;
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  // Test Netlify headers
  console.log(chalk.yellow('Testing static/_headers...'));
  try {
    const netlifyHeaders = await fs.readFile(
      path.join(__dirname, '..', 'static', '_headers'),
      'utf-8'
    );
    const headers = parseHeaders(netlifyHeaders, 'netlify');
    
    for (const [header, config] of Object.entries(REQUIRED_HEADERS)) {
      const value = headers[header];
      
      if (!value) {
        results.failed.push({
          header,
          message: 'Header not found',
          severity: config.severity
        });
        allPassed = false;
      } else {
        const expected = config.expected;
        const matches = typeof expected === 'string' 
          ? value === expected 
          : expected.test(value);
        
        if (matches) {
          results.passed.push({
            header,
            value: value.substring(0, 50) + (value.length > 50 ? '...' : '')
          });
        } else {
          results.failed.push({
            header,
            message: `Unexpected value: ${value}`,
            severity: config.severity,
            expected: expected.toString()
          });
          allPassed = false;
        }
      }
    }
    
    // Validate CSP specifically
    if (headers['Content-Security-Policy']) {
      const cspValidation = validateCSP(headers['Content-Security-Policy']);
      cspValidation.issues.forEach(issue => {
        results.failed.push({
          header: 'Content-Security-Policy',
          message: issue,
          severity: 'HIGH'
        });
        allPassed = false;
      });
      cspValidation.warnings.forEach(warning => {
        results.warnings.push({
          header: 'Content-Security-Policy',
          message: warning
        });
      });
    }
    
  } catch (error) {
    console.error(chalk.red('Error reading static/_headers:'), error.message);
  }
  
  // Test Vercel headers
  console.log(chalk.yellow('\nTesting vercel.json...'));
  try {
    const vercelConfig = await fs.readFile(
      path.join(__dirname, '..', 'vercel.json'),
      'utf-8'
    );
    const headers = parseHeaders(vercelConfig, 'json');
    
    // Quick check that headers match
    let vercelMatches = true;
    for (const header of Object.keys(REQUIRED_HEADERS)) {
      if (!headers[header]) {
        console.warn(chalk.yellow(`  Warning: ${header} not found in vercel.json`));
        vercelMatches = false;
      }
    }
    
    if (vercelMatches) {
      console.log(chalk.green('  All required headers present in vercel.json'));
    }
    
  } catch (error) {
    console.error(chalk.red('Error reading vercel.json:'), error.message);
  }
  
  // Display results
  console.log(chalk.blue.bold('\n=== Test Results ===\n'));
  
  if (results.passed.length > 0) {
    console.log(chalk.green.bold('Passed:'));
    results.passed.forEach(({ header, value }) => {
      console.log(chalk.green(`  ✓ ${header}: ${value}`));
    });
  }
  
  if (results.warnings.length > 0) {
    console.log(chalk.yellow.bold('\nWarnings:'));
    results.warnings.forEach(({ header, message }) => {
      console.log(chalk.yellow(`  ⚠ ${header}: ${message}`));
    });
  }
  
  if (results.failed.length > 0) {
    console.log(chalk.red.bold('\nFailed:'));
    results.failed.forEach(({ header, message, severity, expected }) => {
      console.log(chalk.red(`  ✗ ${header} [${severity}]: ${message}`));
      if (expected) {
        console.log(chalk.gray(`    Expected: ${expected}`));
      }
    });
  }
  
  // Summary
  console.log(chalk.blue.bold('\n=== Summary ==='));
  console.log(`Passed: ${chalk.green(results.passed.length)}`);
  console.log(`Warnings: ${chalk.yellow(results.warnings.length)}`);
  console.log(`Failed: ${chalk.red(results.failed.length)}`);
  
  // Security score
  const totalHeaders = Object.keys(REQUIRED_HEADERS).length;
  const score = Math.round((results.passed.length / totalHeaders) * 100);
  const scoreColor = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;
  
  console.log(chalk.blue.bold('\nSecurity Score: ') + scoreColor.bold(`${score}%`));
  
  // Recommendations
  if (results.failed.length > 0 || results.warnings.length > 0) {
    console.log(chalk.blue.bold('\n=== Recommendations ==='));
    
    const criticalFails = results.failed.filter(f => f.severity === 'CRITICAL');
    if (criticalFails.length > 0) {
      console.log(chalk.red.bold('\nCRITICAL Issues (Fix immediately):'));
      criticalFails.forEach(f => {
        console.log(chalk.red(`  - ${f.header}: ${f.message}`));
      });
    }
    
    const highFails = results.failed.filter(f => f.severity === 'HIGH');
    if (highFails.length > 0) {
      console.log(chalk.yellow.bold('\nHIGH Priority Issues:'));
      highFails.forEach(f => {
        console.log(chalk.yellow(`  - ${f.header}: ${f.message}`));
      });
    }
    
    console.log(chalk.cyan('\nNext Steps:'));
    console.log('  1. Review and update security headers in vercel.json and static/_headers');
    console.log('  2. Run "npm run build" to regenerate CSP hashes');
    console.log('  3. Test headers at https://securityheaders.com after deployment');
    console.log('  4. Review OWASP guidelines for each failed header');
  }
  
  return allPassed;
}

// Run tests
testSecurityHeaders().then(passed => {
  process.exit(passed ? 0 : 1);
}).catch(error => {
  console.error(chalk.red('Test failed:'), error);
  process.exit(1);
});
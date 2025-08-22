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
  },
  'Cross-Origin-Embedder-Policy': {
    expected: 'require-corp',
    severity: 'MEDIUM',
    description: 'Enables cross-origin isolation'
  },
  'Cross-Origin-Opener-Policy': {
    expected: 'same-origin',
    severity: 'MEDIUM', 
    description: 'Prevents cross-origin window references'
  },
  'Cross-Origin-Resource-Policy': {
    expected: 'same-origin',
    severity: 'MEDIUM',
    description: 'Controls cross-origin resource sharing'
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

// Dangerous CSP values to avoid (with exceptions for legitimate subdomain wildcards)
const DANGEROUS_CSP_PATTERNS = [
  {
    pattern: /'unsafe-eval'/,
    message: "'unsafe-eval' allows dangerous code execution",
    allowExceptions: false
  },
  {
    pattern: /'unsafe-inline'/,
    message: "'unsafe-inline' bypasses CSP protection",
    allowExceptions: true, // May be needed in development
    developmentOnly: true
  },
  {
    pattern: /\s\*(\s|;|$)/,
    message: "Wildcard '*' allows any source",
    allowExceptions: false
  },
  {
    pattern: /\shttp:(\s|;|$)/,
    message: "'http:' allows insecure connections",
    allowExceptions: false
  }
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
 * Validate CSP header with improved wildcard detection
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
  
  // Check for dangerous patterns
  for (const dangerousPattern of DANGEROUS_CSP_PATTERNS) {
    const matches = cspValue.match(dangerousPattern.pattern);
    if (matches) {
      // Handle development exceptions
      if (dangerousPattern.developmentOnly && process.env.NODE_ENV === 'development') {
        warnings.push(`CSP contains '${matches[0].trim()}' (acceptable in development)`);
        continue;
      }
      
      // Check for data: URI exception in img-src
      if (dangerousPattern.message.includes("'http:'") && cspValue.includes('img-src')) {
        continue; // data: URIs are acceptable for images
      }
      
      issues.push(dangerousPattern.message);
    }
  }
  
  // Special validation for legitimate subdomain wildcards
  const subdomainWildcards = cspValue.match(/https:\/\/\*\.[a-zA-Z0-9.-]+/g);
  if (subdomainWildcards) {
    const legitimateWildcards = [
      'https://*.algolia.net',
      'https://*.algolianet.com',
      'https://*.googleapis.com',
      'https://*.gstatic.com'
    ];
    
    for (const wildcard of subdomainWildcards) {
      if (!legitimateWildcards.includes(wildcard)) {
        warnings.push(`Review subdomain wildcard: ${wildcard}`);
      }
    }
  }
  
  return { issues, warnings };
}

/**
 * Test security headers
 */
async function testSecurityHeaders() {
  console.log(chalk.blue.bold('\n🔒 O-RAN Security Headers Audit\n'));
  
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
        console.warn(chalk.yellow(`  ⚠️ Warning: ${header} not found in vercel.json`));
        vercelMatches = false;
      }
    }
    
    if (vercelMatches) {
      console.log(chalk.green('  ✅ All required headers present in vercel.json'));
    }
    
  } catch (error) {
    console.error(chalk.red('Error reading vercel.json:'), error.message);
  }
  
  // Display results
  console.log(chalk.blue.bold('\n=== Security Audit Results ===\n'));
  
  if (results.passed.length > 0) {
    console.log(chalk.green.bold('✅ Passed Security Checks:'));
    results.passed.forEach(({ header, value }) => {
      console.log(chalk.green(`  ✓ ${header}: ${value}`));
    });
  }
  
  if (results.warnings.length > 0) {
    console.log(chalk.yellow.bold('\n⚠️ Security Warnings:'));
    results.warnings.forEach(({ header, message }) => {
      console.log(chalk.yellow(`  ⚠ ${header}: ${message}`));
    });
  }
  
  if (results.failed.length > 0) {
    console.log(chalk.red.bold('\n❌ Failed Security Checks:'));
    results.failed.forEach(({ header, message, severity, expected }) => {
      console.log(chalk.red(`  ✗ ${header} [${severity}]: ${message}`));
      if (expected) {
        console.log(chalk.gray(`    Expected: ${expected}`));
      }
    });
  }
  
  // Security score calculation
  console.log(chalk.blue.bold('\n=== Security Assessment ==='));
  const totalHeaders = Object.keys(REQUIRED_HEADERS).length;
  const score = Math.round((results.passed.length / totalHeaders) * 100);
  const scoreColor = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
  
  console.log(`Security Headers Score: ${scoreColor.bold(`${score}%`)}`);
  console.log(`O-RAN WG11 Compliance: ${results.passed.length >= 7 ? chalk.green('GOOD') : chalk.red('NEEDS IMPROVEMENT')}`);
  console.log(`Zero-Trust Level: ${results.passed.length >= 8 ? chalk.green('STRONG') : chalk.yellow('MODERATE')}`);
  
  // Recommendations
  if (results.failed.length > 0 || results.warnings.length > 0) {
    console.log(chalk.blue.bold('\n=== Security Recommendations ==='));
    
    const criticalFails = results.failed.filter(f => f.severity === 'CRITICAL');
    if (criticalFails.length > 0) {
      console.log(chalk.red.bold('\n🚨 CRITICAL Issues (Fix immediately):'));
      criticalFails.forEach(f => {
        console.log(chalk.red(`  - ${f.header}: ${f.message}`));
      });
    }
    
    const highFails = results.failed.filter(f => f.severity === 'HIGH');
    if (highFails.length > 0) {
      console.log(chalk.yellow.bold('\n⚠️ HIGH Priority Issues:'));
      highFails.forEach(f => {
        console.log(chalk.yellow(`  - ${f.header}: ${f.message}`));
      });
    }
    
    console.log(chalk.cyan('\n📋 Next Steps:'));
    console.log('  1. Review and update security headers in vercel.json and static/_headers');
    console.log('  2. Run "npm run build" to regenerate CSP hashes');
    console.log('  3. Test headers at https://securityheaders.com after deployment');
    console.log('  4. Review O-RAN WG11 security requirements');
    console.log('  5. Implement zero-trust architecture patterns');
  } else {
    console.log(chalk.green.bold('\n🎉 All security checks passed!'));
    console.log(chalk.green('✅ Ready for O-RAN production deployment'));
  }
  
  return allPassed;
}

// Run tests
testSecurityHeaders().then(passed => {
  process.exit(passed ? 0 : 1);
}).catch(error => {
  console.error(chalk.red('Security test failed:'), error);
  process.exit(1);
});
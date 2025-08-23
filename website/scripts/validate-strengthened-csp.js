#!/usr/bin/env node

/**
 * CSP Configuration Validator for Ultra-Hardened Security Headers
 * 
 * This script validates that the strengthened CSP configuration is properly
 * applied and provides security analysis and recommendations.
 * 
 * Usage: node scripts/validate-strengthened-csp.js
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Security validation rules for CSP directives
 */
const SECURITY_RULES = {
  'default-src': {
    recommended: ["'none'"],
    dangerous: ["'unsafe-inline'", "'unsafe-eval'", "*", "data:", "http:"],
    description: "Should be 'none' for maximum security"
  },
  'script-src': {
    recommended: ["'self'", "'strict-dynamic'"],
    dangerous: ["'unsafe-inline'", "'unsafe-eval'", "*"],
    description: "Should use 'strict-dynamic' and avoid 'unsafe-inline' in production"
  },
  'style-src': {
    recommended: ["'self'"],
    dangerous: ["'unsafe-inline'", "*"],
    description: "Should avoid 'unsafe-inline' and use hashes/nonces"
  },
  'frame-ancestors': {
    recommended: ["'none'"],
    dangerous: ["*", "'unsafe-inline'"],
    description: "Should be 'none' to prevent all embedding"
  },
  'object-src': {
    recommended: ["'none'"],
    dangerous: ["*", "'unsafe-inline'"],
    description: "Should be 'none' to prevent plugin execution"
  }
};

/**
 * Parse CSP header string into directive object
 */
function parseCSP(cspHeader) {
  const directives = {};
  const parts = cspHeader.split(';').map(part => part.trim());
  
  for (const part of parts) {
    const [directive, ...values] = part.split(/\s+/);
    if (directive) {
      directives[directive] = values;
    }
  }
  
  return directives;
}

/**
 * Analyze CSP configuration for security issues
 */
function analyzeCSPSecurity(cspDirectives) {
  const issues = [];
  const recommendations = [];
  let securityScore = 100;

  for (const [directive, values] of Object.entries(cspDirectives)) {
    const rule = SECURITY_RULES[directive];
    if (!rule) continue;

    // Check for dangerous values
    for (const value of values) {
      if (rule.dangerous.includes(value)) {
        issues.push({
          severity: 'HIGH',
          directive,
          value,
          message: `Dangerous value '${value}' found in ${directive}`
        });
        securityScore -= 15;
      }
    }

    // Check for missing recommended values
    const hasRecommended = rule.recommended.some(rec => values.includes(rec));
    if (!hasRecommended) {
      recommendations.push({
        directive,
        message: `Consider adding recommended values to ${directive}: ${rule.recommended.join(', ')}`,
        description: rule.description
      });
      securityScore -= 5;
    }
  }

  // Check for missing critical directives
  const criticalDirectives = ['default-src', 'script-src', 'style-src', 'frame-ancestors', 'object-src'];
  for (const directive of criticalDirectives) {
    if (!cspDirectives[directive]) {
      issues.push({
        severity: 'MEDIUM',
        directive,
        message: `Missing critical directive: ${directive}`
      });
      securityScore -= 10;
    }
  }

  return {
    issues,
    recommendations,
    securityScore: Math.max(0, securityScore)
  };
}

/**
 * Validate security headers configuration
 */
async function validateSecurityHeaders() {
  console.log('🔒 Validating Ultra-Hardened CSP Configuration...\n');

  try {
    // Read the security headers plugin
    const pluginPath = path.join(__dirname, '..', 'plugins', 'docusaurus-plugin-security-headers', 'index.js');
    const pluginContent = await fs.readFile(pluginPath, 'utf-8');

    // Extract CSP configuration (simplified analysis)
    const cspMatch = pluginContent.match(/cspDirectives\s*=\s*{([\s\S]*?)};/);
    if (!cspMatch) {
      console.error('❌ Could not find CSP configuration in plugin');
      return;
    }

    console.log('✅ Found CSP configuration in security headers plugin');

    // Check for production-specific security measures
    const hasStrictDynamic = pluginContent.includes("'strict-dynamic'");
    const hasNonceSupport = pluginContent.includes('generateNonce');
    const hasDefaultNone = pluginContent.includes("'default-src': [\"'none'\"]");
    const hasFrameAncestorsNone = pluginContent.includes("'frame-ancestors': [\"'none'\"]");

    console.log('\n📋 Security Features Analysis:');
    console.log(`  ✅ default-src set to 'none': ${hasDefaultNone ? 'YES' : 'NO'}`);
    console.log(`  ✅ frame-ancestors set to 'none': ${hasFrameAncestorsNone ? 'YES' : 'NO'}`);
    console.log(`  ✅ strict-dynamic enabled: ${hasStrictDynamic ? 'YES' : 'NO'}`);
    console.log(`  ✅ Nonce support available: ${hasNonceSupport ? 'YES' : 'NO'}`);

    // Check for dangerous patterns
    const hasUnsafeInlineProd = pluginContent.includes("'unsafe-inline'") && !pluginContent.includes('isDevelopment');
    const hasUnsafeEvalProd = pluginContent.includes("'unsafe-eval'") && !pluginContent.includes('isDevelopment');
    const hasWildcardDomains = pluginContent.includes('https://*') && !pluginContent.includes('isDevelopment');

    console.log('\n⚠️  Potential Security Issues:');
    if (hasUnsafeInlineProd) {
      console.log('  ❌ unsafe-inline may be enabled in production');
    }
    if (hasUnsafeEvalProd) {
      console.log('  ❌ unsafe-eval may be enabled in production');
    }
    if (hasWildcardDomains) {
      console.log('  ❌ Wildcard domains may be allowed in production');
    }
    if (!hasUnsafeInlineProd && !hasUnsafeEvalProd && !hasWildcardDomains) {
      console.log('  ✅ No obvious security issues detected');
    }

    // Additional security header checks
    console.log('\n🛡️  Additional Security Headers:');
    const hasHSTS = pluginContent.includes('Strict-Transport-Security');
    const hasFrameOptions = pluginContent.includes('X-Frame-Options');
    const hasContentTypeOptions = pluginContent.includes('X-Content-Type-Options');
    const hasReferrerPolicy = pluginContent.includes('Referrer-Policy');
    const hasPermissionsPolicy = pluginContent.includes('Permissions-Policy');

    console.log(`  ✅ HSTS enabled: ${hasHSTS ? 'YES' : 'NO'}`);
    console.log(`  ✅ X-Frame-Options: ${hasFrameOptions ? 'YES' : 'NO'}`);
    console.log(`  ✅ X-Content-Type-Options: ${hasContentTypeOptions ? 'YES' : 'NO'}`);
    console.log(`  ✅ Referrer-Policy: ${hasReferrerPolicy ? 'YES' : 'NO'}`);
    console.log(`  ✅ Permissions-Policy: ${hasPermissionsPolicy ? 'YES' : 'NO'}`);

    // Calculate security score
    let securityScore = 100;
    if (hasUnsafeInlineProd) securityScore -= 20;
    if (hasUnsafeEvalProd) securityScore -= 20;
    if (hasWildcardDomains) securityScore -= 15;
    if (!hasDefaultNone) securityScore -= 15;
    if (!hasFrameAncestorsNone) securityScore -= 10;
    if (!hasStrictDynamic) securityScore -= 10;
    if (!hasNonceSupport) securityScore -= 5;

    console.log(`\n🎯 Security Score: ${Math.max(0, securityScore)}/100`);

    if (securityScore >= 90) {
      console.log('🏆 Excellent security configuration!');
    } else if (securityScore >= 75) {
      console.log('✅ Good security configuration with room for improvement');
    } else if (securityScore >= 50) {
      console.log('⚠️  Moderate security - consider strengthening CSP directives');
    } else {
      console.log('❌ Security configuration needs significant improvement');
    }

    console.log('\n💡 Recommendations:');
    console.log('  • Run CSP hash generation after each build: npm run generate-csp-hashes');
    console.log('  • Test CSP policy in report-only mode first');
    console.log('  • Monitor for CSP violations in production');
    console.log('  • Regularly audit and update security headers');

  } catch (error) {
    console.error('❌ Error validating security configuration:', error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  await validateSecurityHeaders();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateSecurityHeaders,
  parseCSP,
  analyzeCSPSecurity
};
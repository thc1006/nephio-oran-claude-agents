# Content Security Policy (CSP) Monitoring Guide

## Overview

This document provides guidance for monitoring and maintaining the Content Security Policy (CSP) implemented for the Nephio O-RAN Claude Agents documentation website.

## Current CSP Configuration

The website implements a comprehensive CSP with the following directives:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.algolia.net https://*.algolianet.com;
  style-src 'self' https://fonts.googleapis.com;
  img-src 'self' data: https://avatars.githubusercontent.com https://www.google-analytics.com https://github.com https://img.shields.io https://raw.githubusercontent.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://api.github.com https://www.google-analytics.com https://www.googletagmanager.com https://*.algolia.net https://*.algolianet.com;
  frame-src 'none';
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  manifest-src 'self';
  worker-src 'self' blob:;
  media-src 'self';
  upgrade-insecure-requests;
```

## Monitoring Tools and Techniques

### 1. Browser Developer Tools

Monitor CSP violations in real-time:

```javascript
// Add to browser console for monitoring
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', {
    violatedDirective: e.violatedDirective,
    blockedURI: e.blockedURI,
    sourceFile: e.sourceFile,
    lineNumber: e.lineNumber,
    columnNumber: e.columnNumber
  });
});
```

### 2. CSP Report-Only Mode

For testing new CSP changes without breaking functionality:

```javascript
// In docusaurus-plugin-security-headers/index.js
'Content-Security-Policy-Report-Only': cspHeader + '; report-uri /api/csp-report'
```

### 3. Automated Testing Script

```bash
#!/bin/bash
# test-csp.sh - Test CSP headers

URL="https://thc1006.github.io/nephio-oran-claude-agents"

# Check CSP header presence
echo "Checking CSP header..."
curl -sI "$URL" | grep -i "content-security-policy"

# Test with security headers tool
echo "Running security headers scan..."
curl -X GET "https://securityheaders.com/?q=$URL&followRedirects=on" \
  -H "Accept: application/json" | jq '.score'
```

### 4. CSP Violation Reporting Endpoint

Set up a CSP violation reporting endpoint:

```javascript
// api/csp-report.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    const violation = req.body;
    
    // Log violation for monitoring
    console.error('CSP Violation Report:', {
      documentURI: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedURI: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number']
    });
    
    // Send to monitoring service (e.g., Sentry, DataDog)
    // monitoringService.reportCSPViolation(violation);
    
    res.status(204).end();
  } else {
    res.status(405).end();
  }
}
```

## Adding New Third-Party Services

When adding new third-party services, follow these steps:

### 1. Identify Required CSP Directives

Determine which CSP directives the service needs:

| Service Type | Required Directives | Example |
|-------------|-------------------|---------|
| Analytics | `script-src`, `connect-src` | Google Analytics |
| CDN Assets | `img-src`, `style-src`, `script-src` | jsdelivr.net |
| API Integration | `connect-src` | GitHub API |
| Embedded Content | `frame-src` | YouTube embeds |
| Fonts | `font-src`, `style-src` | Google Fonts |

### 2. Update CSP Configuration

Edit the CSP in the appropriate configuration file:

**For Vercel deployment:** `website/vercel.json`

```json
{
  "headers": [
    {
      "key": "Content-Security-Policy",
      "value": "... script-src 'self' https://new-service.com; ..."
    }
  ]
}
```

**For Netlify deployment:** `website/static/_headers`

```
/*
  Content-Security-Policy: ... script-src 'self' https://new-service.com; ...
```

**For Docusaurus plugin:** `website/plugins/docusaurus-plugin-security-headers/index.js`

```javascript
'script-src': [
  "'self'",
  'https://new-service.com', // New service added
  // ... existing entries
]
```

### 3. Test CSP Changes

1. **Development Testing:**

   ```bash
   # Run local development server
   npm run start
   
   # Check browser console for CSP violations
   # Open Developer Tools > Console
   ```

2. **Staging Testing:**

   ```bash
   # Deploy to staging
   npm run build
   npm run serve
   
   # Test with curl
   curl -I http://localhost:3000 | grep -i "content-security"
   ```

3. **Production Validation:**

   ```bash
   # After deployment, validate CSP
   ./scripts/test-csp.sh
   ```

## Common CSP Issues and Solutions

### Issue 1: Inline Scripts Blocked

**Symptom:** `Refused to execute inline script`

**Solutions:**

1. Move inline scripts to external files
2. Use nonces (for Docusaurus dynamic content):

   ```javascript
   'script-src': ["'self'", "'nonce-{{nonce}}'"]
   ```

3. As last resort (not recommended): Add `'unsafe-inline'`

### Issue 2: Third-Party Images Blocked

**Symptom:** Images from external sources not loading

**Solution:** Add specific domains to `img-src`:

```javascript
'img-src': ['self', 'data:', 'https://specific-domain.com']
```

### Issue 3: Font Loading Issues

**Symptom:** Custom fonts not loading

**Solution:** Ensure both font source and stylesheet are allowed:

```javascript
'font-src': ["'self'", 'https://fonts.gstatic.com'],
'style-src': ["'self'", 'https://fonts.googleapis.com']
```

## Monitoring Checklist

### Daily Monitoring

- [ ] Check browser console for CSP violations during normal usage
- [ ] Review any CSP violation reports from users

### Weekly Monitoring

- [ ] Run automated CSP test suite
- [ ] Check security headers score at securityheaders.com
- [ ] Review analytics for blocked resources

### Monthly Monitoring

- [ ] Audit CSP configuration for unnecessary permissions
- [ ] Review and remove unused third-party service permissions
- [ ] Update CSP documentation with any changes

### Before Adding New Features

- [ ] Identify all external resources required
- [ ] Test in CSP Report-Only mode first
- [ ] Document CSP changes in commit message
- [ ] Update this monitoring guide if needed

## Security Best Practices

1. **Principle of Least Privilege:** Only allow what's absolutely necessary
2. **Avoid Wildcards:** Use specific domains instead of `https://*`
3. **No `unsafe-inline` or `unsafe-eval`:** These defeat the purpose of CSP
4. **Regular Audits:** Remove permissions for unused services
5. **Version Control:** Track all CSP changes in git
6. **Progressive Enhancement:** Start strict, relax only when necessary

## Troubleshooting Commands

```bash
# Check current CSP header
curl -sI https://thc1006.github.io/nephio-oran-claude-agents | grep -i content-security

# Test CSP with Mozilla Observatory
curl -X POST https://http-observatory.security.mozilla.org/api/v1/analyze?host=thc1006.github.io

# Validate CSP syntax
# Use https://csp-evaluator.withgoogle.com/

# Monitor real-time violations (add to page)
<script>
document.addEventListener('securitypolicyviolation', (e) => {
  fetch('/api/csp-report', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      'violated-directive': e.violatedDirective,
      'blocked-uri': e.blockedURI,
      'source-file': e.sourceFile,
      'line-number': e.lineNumber
    })
  });
});
</script>
```

## Resources

- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator by Google](https://csp-evaluator.withgoogle.com/)
- [Security Headers Scanner](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [CSP Quick Reference](https://content-security-policy.com/)

## Contact

For CSP-related issues or questions:

- Open an issue on [GitHub](https://github.com/thc1006/nephio-oran-claude-agents/issues)
- Tag with `security` and `csp` labels

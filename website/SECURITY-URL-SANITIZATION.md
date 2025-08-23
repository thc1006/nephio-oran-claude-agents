# URL Sanitization Security Feature

## Overview

This document describes the URL sanitization security feature implemented to prevent XSS (Cross-Site Scripting) attacks through malformed URLs in the Nephio O-RAN Claude Agents documentation website.

## Components

### 1. Root.tsx - Global URL Wrapper (`src/theme/Root.tsx`)

The `Root.tsx` component wraps the entire Docusaurus application and provides:

- **Real-time URL monitoring**: Checks all URLs for dangerous patterns on page load
- **Automatic redirection**: Redirects users to a safe 404 page when malicious patterns are detected
- **Security logging**: Logs attempted attacks for monitoring purposes
- **Defense-in-depth headers**: Adds additional security meta tags

### 2. Enhanced 404 Page (`src/pages/404.tsx`)

The 404 page has been enhanced with:

- **URL sanitization display**: Shows sanitized version of the requested URL
- **Security warnings**: Special warning messages for security-related redirects
- **Attack logging**: Additional logging for security incidents
- **User guidance**: Clear instructions for users who encounter security warnings

### 3. URLSanitizer Class

The core security logic includes:

#### Detected Patterns

- **Script injection**: `<script>`, `javascript:`, `vbscript:`
- **Event handlers**: `onload=`, `onerror=`, `onclick=`, etc.
- **HTML injection**: `<iframe>`, `<object>`, `<embed>`, `<applet>`
- **Style injection**: `<style>`, `expression()`
- **Data URIs**: Malicious data URLs containing scripts
- **Protocol handlers**: Dangerous protocol schemes

#### Methods

- `isDangerous(url)`: Detects if a URL contains malicious patterns
- `sanitize(url)`: Removes dangerous content and escapes HTML characters  
- `createSafe404Path()`: Creates a safe redirect path for malicious URLs

## Security Features

### 1. Pattern Detection

The system detects both obvious and obfuscated XSS attempts:

```typescript
// Direct script injection
<script>alert('xss')</script>

// JavaScript URLs
javascript:alert('xss')

// Event handlers
onload=alert('xss')

// Encoded attacks
%3Cscript%3Ealert%28%27xss%27%29%3C%2Fscript%3E
```

### 2. Sanitization Process

1. **Pattern removal**: Dangerous patterns are replaced with `[REMOVED]`
2. **HTML escaping**: Special characters are properly escaped
3. **Safe display**: URLs are safely displayed without executing code

### 3. Logging and Monitoring

All security events are logged with:

- Original malicious URL
- Sanitized version
- Timestamp
- User agent information
- Referrer information

## Testing

The security implementation includes comprehensive tests covering:

- Script injection patterns
- Event handler detection
- HTML injection attempts
- URL encoding variations
- Real-world attack vectors
- Edge cases and error handling

Run tests with:

```bash
npm run test:unit tests/security/url-sanitization.test.tsx
```

## Usage Examples

### Safe URLs (Allowed)

```
/docs/intro
/blog/2025-01-01-welcome  
https://example.com/safe-page
/search?q=documentation
#section-1
```

### Dangerous URLs (Blocked)

```
javascript:alert('xss')
<script>alert('xss')</script>
onload=alert('xss')
data:text/html,<script>alert('xss')</script>
<iframe src="malicious.html"></iframe>
```

## Implementation Details

### How It Works

1. **Page Load**: Root component checks current URL
2. **Pattern Matching**: URL is tested against dangerous patterns
3. **Redirection**: If malicious patterns found, user is redirected to safe 404
4. **Display**: 404 page shows sanitized URL with appropriate warnings
5. **Logging**: Security events are logged for monitoring

### Performance Considerations

- Pattern matching is optimized with compiled regex patterns
- URL decoding is done safely with error handling
- Minimal performance impact on normal page loads
- No external dependencies required

## Maintenance

### Adding New Patterns

To add new dangerous patterns, update the `DANGEROUS_PATTERNS` array in both:
- `src/theme/Root.tsx`
- `tests/security/url-sanitization.test.tsx`

### Security Updates

Regular security reviews should include:
- Monitoring security logs for new attack patterns
- Updating patterns based on latest XSS techniques
- Testing with security scanners
- Reviewing false positive reports

## Browser Compatibility

The URL sanitization system works with:
- All modern browsers
- JavaScript enabled environments
- Docusaurus supported browsers

## Related Security Measures

This URL sanitization works alongside:
- Content Security Policy (CSP) headers
- X-Frame-Options headers
- X-Content-Type-Options headers
- Input validation and output encoding

## Support

For security-related questions or to report potential bypasses, please contact the security team.

## Changelog

- **v1.0.0**: Initial implementation with comprehensive XSS protection
  - Real-time URL monitoring
  - Pattern-based detection
  - Safe sanitization and display
  - Comprehensive test coverage
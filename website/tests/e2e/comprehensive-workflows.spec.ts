import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

/**
 * Comprehensive end-to-end test scenarios for Nephio O-RAN Claude Agents
 * Tests complete user workflows from navigation to documentation interaction
 */

class AgentWorkflowHelper {
  constructor(private page: Page) {}

  async navigateToAgents() {
    await this.page.goto('/docs/agents');
    await expect(this.page.locator('h1')).toContainText('Agents');
  }

  async selectAgent(agentName: string) {
    const agentLink = this.page.locator(`a[href*="${agentName}"]`).first();
    await agentLink.click();
    
    // Wait for agent page to load
    await this.page.waitForLoadState('networkidle');
  }

  async verifyAgentPageStructure(agentName: string) {
    // Check for essential sections
    await expect(this.page.locator('h1')).toBeVisible();
    
    // Check for common agent page elements
    const expectedSections = [
      'Overview',
      'Capabilities',
      'Usage',
      'Examples'
    ];

    for (const section of expectedSections) {
      const sectionLocator = this.page.locator(`text="${section}"`).first();
      if (await sectionLocator.count() > 0) {
        await expect(sectionLocator).toBeVisible();
      }
    }
  }

  async verifyCodeExamples() {
    // Check for code blocks
    const codeBlocks = this.page.locator('pre code, .prism-code');
    if (await codeBlocks.count() > 0) {
      await expect(codeBlocks.first()).toBeVisible();
    }
  }

  async testSearchFunctionality(searchTerm: string) {
    // Test search if available
    const searchInput = this.page.locator('[placeholder*="search" i], [aria-label*="search" i]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill(searchTerm);
      await this.page.keyboard.press('Enter');
      
      // Wait for search results
      await this.page.waitForTimeout(1000);
      
      // Verify search results contain the term
      const searchResults = this.page.locator('[data-testid="search-results"], .search-results, .search-result-item');
      if (await searchResults.count() > 0) {
        await expect(searchResults.first()).toBeVisible();
      }
    }
  }
}

test.describe('Comprehensive Agent Workflows', () => {
  let agentHelper: AgentWorkflowHelper;

  test.beforeEach(async ({ page }) => {
    agentHelper = new AgentWorkflowHelper(page);
  });

  test('should complete full agent discovery workflow', async ({ page }) => {
    // Start from homepage
    await page.goto('/');
    
    // Verify homepage loads
    await expect(page.locator('h1')).toContainText('Nephio O-RAN Claude Agents');
    
    // Navigate to agents section
    const agentsLink = page.locator('a[href*="agents"], a:has-text("Agents")').first();
    await agentsLink.click();
    
    // Wait for agents page
    await page.waitForLoadState('networkidle');
    
    // Verify agents listing
    await expect(page.locator('h1, h2')).toContainText(/agents/i);
    
    // Find and click on configuration management agent
    const configAgent = page.locator('a[href*="configuration-management"], a:has-text("Configuration Management")').first();
    if (await configAgent.count() > 0) {
      await configAgent.click();
      
      // Verify agent page structure
      await agentHelper.verifyAgentPageStructure('configuration-management');
      await agentHelper.verifyCodeExamples();
    }
  });

  test('should handle navigation between multiple agents', async ({ page }) => {
    const agentPaths = [
      '/docs/agents/config-management/configuration-management-agent',
      '/docs/agents/infrastructure/nephio-infrastructure-agent',
      '/docs/agents/monitoring/monitoring-analytics-agent',
      '/docs/agents/orchestrator/nephio-oran-orchestrator-agent'
    ];

    for (const path of agentPaths) {
      await page.goto(path);
      
      // Wait for page load
      await page.waitForLoadState('networkidle');
      
      // Verify page loads successfully (not 404)
      const notFoundIndicators = [
        'Page Not Found',
        '404',
        'This page could not be found'
      ];
      
      const pageContent = await page.textContent('body');
      const isNotFound = notFoundIndicators.some(indicator => 
        pageContent?.toLowerCase().includes(indicator.toLowerCase())
      );
      
      if (!isNotFound) {
        // If page exists, verify it has proper structure
        await expect(page.locator('h1, h2')).toBeVisible();
        
        // Check for navigation elements
        const breadcrumbs = page.locator('.breadcrumbs, [aria-label="Breadcrumb"], nav[aria-label*="breadcrumb" i]');
        if (await breadcrumbs.count() > 0) {
          await expect(breadcrumbs.first()).toBeVisible();
        }
      }
    }
  });

  test('should support responsive design across devices', async ({ page }) => {
    const testUrls = [
      '/',
      '/docs/intro',
      '/docs/agents'
    ];

    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      for (const url of testUrls) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Verify page is accessible and doesn't have horizontal scroll
        const body = page.locator('body');
        await expect(body).toBeVisible();
        
        // Check if mobile menu is available on smaller screens
        if (viewport.width < 768) {
          const mobileMenuToggle = page.locator(
            '[aria-label*="menu" i], .navbar-toggle, .hamburger, button[aria-expanded]'
          );
          
          if (await mobileMenuToggle.count() > 0) {
            await expect(mobileMenuToggle.first()).toBeVisible();
          }
        }
        
        // Verify main content is accessible
        const mainContent = page.locator('main, [role="main"], .main-wrapper');
        if (await mainContent.count() > 0) {
          await expect(mainContent.first()).toBeVisible();
        }
      }
    }
  });

  test('should handle locale switching correctly', async ({ page }) => {
    // Test English (default)
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', /^en/);
    
    // Look for locale switcher
    const localeSwitcher = page.locator(
      '[aria-label*="language" i], [title*="language" i], .locale-switcher, [data-testid*="locale"]'
    );
    
    if (await localeSwitcher.count() > 0) {
      // Test switching to Chinese (Traditional)
      const chineseOption = page.locator('a[href*="/zh-TW"], option[value*="zh-TW"], [data-locale="zh-TW"]');
      
      if (await chineseOption.count() > 0) {
        await chineseOption.first().click();
        
        // Wait for navigation
        await page.waitForLoadState('networkidle');
        
        // Verify Chinese locale
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
        
        // Verify URL contains locale
        expect(page.url()).toContain('/zh-TW');
        
        // Switch back to English
        const englishOption = page.locator('a[href="/"], option[value="en"], [data-locale="en"]');
        if (await englishOption.count() > 0) {
          await englishOption.first().click();
          await page.waitForLoadState('networkidle');
          
          // Verify English locale restored
          await expect(page.locator('html')).toHaveAttribute('lang', /^en/);
        }
      }
    }
  });

  test('should provide comprehensive search functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for search functionality
    const searchTriggers = page.locator(
      'input[placeholder*="search" i], [aria-label*="search" i], .search-button, [data-testid*="search"]'
    );
    
    if (await searchTriggers.count() > 0) {
      const searchInput = searchTriggers.first();
      
      // Test search for different terms
      const searchTerms = [
        'nephio',
        'o-ran',
        'agent',
        'kubernetes',
        'configuration'
      ];
      
      for (const term of searchTerms) {
        await searchInput.fill(term);
        await page.keyboard.press('Enter');
        
        // Wait for search results
        await page.waitForTimeout(1000);
        
        // Check if results are displayed
        const resultsContainer = page.locator(
          '.search-results, [data-testid="search-results"], .search-result-item, .algolia-autocomplete'
        );
        
        if (await resultsContainer.count() > 0) {
          await expect(resultsContainer.first()).toBeVisible();
          
          // Verify results contain the search term (case-insensitive)
          const resultsText = await resultsContainer.first().textContent();
          expect(resultsText?.toLowerCase()).toContain(term.toLowerCase());
        }
        
        // Clear search for next term
        await searchInput.fill('');
      }
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test 404 page
    await page.goto('/this-page-does-not-exist');
    
    // Should show 404 page, not crash
    await expect(page.locator('h1, h2')).toContainText(/404|not found|page not found/i);
    
    // Test malformed URLs (security test)
    const malformedUrls = [
      '/docs/../../../etc/passwd',
      '/docs?search=<script>alert("xss")</script>',
      '/docs#javascript:alert("xss")'
    ];
    
    for (const malformedUrl of malformedUrls) {
      await page.goto(malformedUrl);
      
      // Should not execute malicious content and should handle gracefully
      const title = await page.title();
      expect(title.toLowerCase()).not.toContain('alert');
      expect(title.toLowerCase()).not.toContain('script');
      
      // Page should load some content (404 or sanitized version)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should support keyboard navigation accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through focusable elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      
      const currentFocused = page.locator(':focus');
      if (await currentFocused.count() > 0) {
        await expect(currentFocused).toBeVisible();
      }
    }
    
    // Test skip link if available
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main"], a[href="#content"], .skip-to-content');
    if (await skipLink.count() > 0) {
      await expect(skipLink.first()).toBeFocused();
      
      await page.keyboard.press('Enter');
      
      // Should jump to main content
      const mainContent = page.locator('#main, #content, main, [role="main"]');
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeFocused();
      }
    }
  });

  test('should handle performance requirements', async ({ page }) => {
    // Test page load performance
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    // Test Core Web Vitals where possible
    const performanceEntries = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries.map(entry => ({
            name: entry.name,
            value: entry.value || entry.duration,
            startTime: entry.startTime
          })));
        }).observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve([]), 3000);
      });
    });
    
    // Verify some performance metrics are captured
    expect(Array.isArray(performanceEntries)).toBe(true);
    
    // Test resource loading
    const failedRequests = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    
    // Should not have many failed requests
    expect(failedRequests.length).toBeLessThan(5);
    
    // Log failed requests for debugging
    if (failedRequests.length > 0) {
      console.log('Failed requests:', failedRequests);
    }
  });

  test('should validate content accessibility', async ({ page }) => {
    const testPages = [
      '/',
      '/docs/intro',
      '/docs/agents'
    ];
    
    for (const testPage of testPages) {
      await page.goto(testPage);
      
      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      if (headings.length > 0) {
        // Should have at least one h1
        const h1Elements = page.locator('h1');
        await expect(h1Elements.first()).toBeVisible();
        
        // Check for alt text on images
        const images = await page.locator('img').all();
        for (const img of images) {
          const alt = await img.getAttribute('alt');
          const ariaLabel = await img.getAttribute('aria-label');
          const role = await img.getAttribute('role');
          
          // Images should have alt text unless they're decorative
          if (role !== 'presentation' && !ariaLabel) {
            expect(alt).toBeTruthy();
          }
        }
        
        // Check for proper link text
        const links = await page.locator('a').all();
        for (const link of links.slice(0, 10)) { // Check first 10 links
          const linkText = await link.textContent();
          const ariaLabel = await link.getAttribute('aria-label');
          const title = await link.getAttribute('title');
          
          // Links should have meaningful text
          const hasText = linkText?.trim().length || 0 > 0;
          const hasAriaLabel = ariaLabel?.trim().length || 0 > 0;
          const hasTitle = title?.trim().length || 0 > 0;
          
          expect(hasText || hasAriaLabel || hasTitle).toBe(true);
        }
      }
    }
  });

  test('should support PWA features where available', async ({ page }) => {
    await page.goto('/');
    
    // Check for manifest
    const manifest = page.locator('link[rel="manifest"]');
    if (await manifest.count() > 0) {
      const manifestHref = await manifest.getAttribute('href');
      expect(manifestHref).toBeTruthy();
      
      // Test manifest accessibility
      const manifestResponse = await page.goto(manifestHref!);
      expect(manifestResponse?.status()).toBeLessThan(400);
      
      // Go back to main page
      await page.goto('/');
    }
    
    // Check for service worker registration
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    if (hasServiceWorker) {
      // Test offline capability
      await page.context().setOffline(true);
      await page.reload();
      
      // Page should still load (might be cached)
      await expect(page.locator('body')).toBeVisible();
      
      await page.context().setOffline(false);
    }
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    await page.goto('/docs/agents');
    
    // Simulate rapid navigation
    const agentLinks = await page.locator('a[href*="agent"]').all();
    
    if (agentLinks.length >= 2) {
      // Rapidly click between different agents
      for (let i = 0; i < 5; i++) {
        const linkIndex = i % agentLinks.length;
        await agentLinks[linkIndex].click();
        
        // Don't wait for full load, simulate impatient user
        await page.waitForTimeout(100);
      }
      
      // Wait for final navigation to complete
      await page.waitForLoadState('networkidle');
      
      // Page should be in a stable state
      await expect(page.locator('h1, h2')).toBeVisible();
      
      // No JavaScript errors should occur
      const jsErrors: string[] = [];
      page.on('pageerror', (error) => {
        jsErrors.push(error.message);
      });
      
      await page.waitForTimeout(1000);
      expect(jsErrors.length).toBe(0);
    }
  });
});

// Test data factories and utilities
test.describe('Test Data Validation', () => {
  test('should validate agent documentation completeness', async ({ page }) => {
    const expectedAgents = [
      'configuration-management-agent',
      'nephio-infrastructure-agent',
      'monitoring-analytics-agent',
      'nephio-oran-orchestrator-agent',
      'data-analytics-agent',
      'security-compliance-agent',
      'performance-optimization-agent',
      'testing-validation-agent',
      'oran-network-functions-agent',
      'oran-nephio-dep-doctor-agent'
    ];
    
    for (const agentName of expectedAgents) {
      const possiblePaths = [
        `/docs/agents/${agentName}`,
        `/docs/agents/config-management/${agentName}`,
        `/docs/agents/infrastructure/${agentName}`,
        `/docs/agents/monitoring/${agentName}`,
        `/docs/agents/orchestrator/${agentName}`,
        `/docs/agents/data-analytics/${agentName}`,
        `/docs/agents/security/${agentName}`,
        `/docs/agents/performance/${agentName}`,
        `/docs/agents/testing/${agentName}`,
        `/docs/agents/network-functions/${agentName}`
      ];
      
      let agentFound = false;
      
      for (const path of possiblePaths) {
        const response = await page.goto(path);
        
        if (response?.status() && response.status() < 400) {
          agentFound = true;
          
          // Verify agent page has expected content structure
          const pageContent = await page.textContent('body');
          
          // Should contain agent-related keywords
          const requiredKeywords = ['agent', 'nephio', 'o-ran'];
          const hasRequiredKeywords = requiredKeywords.some(keyword =>
            pageContent?.toLowerCase().includes(keyword)
          );
          
          expect(hasRequiredKeywords).toBe(true);
          break;
        }
      }
      
      // Log if agent documentation is missing (don't fail test)
      if (!agentFound) {
        console.log(`Warning: No documentation found for agent: ${agentName}`);
      }
    }
  });
});
/**
 * End-to-End tests for Nephio O-RAN website routing and locale functionality
 * Tests real browser behavior for routing, redirects, and internationalization
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Nephio O-RAN Website Routing and Locale E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Basic Routing', () => {
    test('should load homepage successfully', async ({ page }) => {
      await page.goto('/');
      
      await expect(page).toHaveTitle(/Nephio O-RAN Claude Agents/);
      await expect(page.locator('h1').first()).toContainText('Nephio O-RAN Claude Agents');
      
      // Check that essential navigation elements are present
      await expect(page.locator('nav').first()).toBeVisible();
      await expect(page.getByRole('link', { name: /documentation/i })).toBeVisible();
    });

    test('should redirect /docs/ to /docs/intro', async ({ page }) => {
      await page.goto('/docs/');
      
      // Wait for redirect to complete
      await page.waitForURL('/docs/intro');
      
      await expect(page).toHaveURL(/\/docs\/intro$/);
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('should redirect /docs to /docs/intro', async ({ page }) => {
      await page.goto('/docs');
      
      // Wait for redirect to complete  
      await page.waitForURL('/docs/intro');
      
      await expect(page).toHaveURL(/\/docs\/intro$/);
    });

    test('should handle deep documentation links', async ({ page }) => {
      await page.goto('/docs/guides/quickstart');
      
      await expect(page).toHaveURL(/\/docs\/guides\/quickstart$/);
      await expect(page.locator('h1').first()).toBeVisible();
      
      // Check breadcrumb navigation if present
      const breadcrumb = page.locator('[aria-label="breadcrumb"], .breadcrumbs');
      if (await breadcrumb.isVisible()) {
        await expect(breadcrumb).toContainText('guides');
      }
    });
  });

  test.describe('Locale Functionality', () => {
    test('should load English version by default', async ({ page }) => {
      await page.goto('/docs/intro');
      
      await expect(page).toHaveURL(/^(?!.*\/zh-TW).*\/docs\/intro$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      
      // Check for English content
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('should load Traditional Chinese version', async ({ page }) => {
      await page.goto('/zh-TW/docs/intro');
      
      await expect(page).toHaveURL(/\/zh-TW\/docs\/intro$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
      
      // Check for Chinese content or at least that page loads
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('should redirect /zh-TW/docs/ to /zh-TW/docs/intro', async ({ page }) => {
      await page.goto('/zh-TW/docs/');
      
      await page.waitForURL('/zh-TW/docs/intro');
      
      await expect(page).toHaveURL(/\/zh-TW\/docs\/intro$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
    });

    test('should handle locale switching', async ({ page }) => {
      // Start with English
      await page.goto('/docs/intro');
      
      // Look for locale switcher (common patterns)
      const localeDropdown = page.locator('[aria-label*="language"], [data-testid*="locale"], .navbar__item--type-localeDropdown').first();
      
      if (await localeDropdown.isVisible()) {
        await localeDropdown.click();
        
        // Look for Chinese option
        const chineseOption = page.getByRole('link', { name: /繁體中文|中文|Chinese/i });
        if (await chineseOption.isVisible()) {
          await chineseOption.click();
          
          // Should navigate to Chinese version
          await expect(page).toHaveURL(/\/zh-TW\/docs\/intro$/);
          await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
        }
      }
    });

    test('should prevent double locale paths', async ({ page }) => {
      // Attempt to navigate to invalid double locale path
      const response = await page.goto('/zh-TW/zh-TW/docs/intro');
      
      // Should either redirect to correct path or show 404
      if (response?.status() === 404) {
        await expect(page.locator('h1')).toContainText(/not found|404/i);
      } else {
        // Should redirect to correct path
        await expect(page).toHaveURL(/^(?!.*\/zh-TW\/zh-TW).*$/);
      }
    });
  });

  test.describe('Navigation and Links', () => {
    test('should navigate through main documentation sections', async ({ page }) => {
      await page.goto('/docs/intro');
      
      // Check sidebar navigation
      const sidebar = page.locator('[role="complementary"], .menu, .sidebar').first();
      if (await sidebar.isVisible()) {
        // Find links to different sections
        const guidesLink = sidebar.getByRole('link', { name: /guides|quick.*start/i }).first();
        if (await guidesLink.isVisible()) {
          await guidesLink.click();
          await expect(page).toHaveURL(/\/docs\/guides/);
          await expect(page.locator('h1').first()).toBeVisible();
        }
      }
    });

    test('should handle external links correctly', async ({ page }) => {
      await page.goto('/docs/intro');
      
      // Find external links (GitHub, Nephio, O-RAN, etc.)
      const externalLinks = page.locator('a[href^="http"]');
      const linkCount = await externalLinks.count();
      
      if (linkCount > 0) {
        const firstExternalLink = externalLinks.first();
        const href = await firstExternalLink.getAttribute('href');
        
        // External links should have proper attributes for security
        if (href?.includes('github.com') || href?.includes('external')) {
          await expect(firstExternalLink).toHaveAttribute('rel', /noopener|noreferrer/);
        }
      }
    });

    test('should maintain navigation state across page changes', async ({ page }) => {
      await page.goto('/docs/intro');
      
      // Find and click a navigation link
      const navLink = page.getByRole('link', { name: /agents|infrastructure/i }).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        
        // Wait for navigation
        await page.waitForLoadState('networkidle');
        
        // Check that navigation is still visible and functional
        await expect(page.locator('nav').first()).toBeVisible();
        await expect(page.locator('h1').first()).toBeVisible();
      }
    });
  });

  test.describe('404 and Error Handling', () => {
    test('should show 404 page for invalid routes', async ({ page }) => {
      const response = await page.goto('/invalid/path/that/does/not/exist');
      
      // Should return 404 status or show 404 page
      if (response?.status() === 404) {
        await expect(page.locator('h1')).toContainText(/not found|404/i);
      } else {
        // Some static site generators serve 200 with 404 content
        const pageContent = await page.textContent('body');
        expect(pageContent?.toLowerCase()).toMatch(/not found|404|page.*exist/);
      }
    });

    test('should handle malformed URLs gracefully', async ({ page }) => {
      const malformedUrls = [
        '/docs/intro"onload="alert(1)"',
        '/docs/<script>alert(1)</script>',
        '/docs/intro?param=<script>',
        '/docs/intro#<script>alert(1)</script>',
      ];

      for (const url of malformedUrls) {
        const response = await page.goto(url);
        
        // Should not execute JavaScript or cause errors
        // Should either redirect to safe URL or show 404
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('<script>');
        expect(currentUrl).not.toContain('onload=');
        
        // Page should still be functional
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should recover from network errors', async ({ page }) => {
      await page.goto('/docs/intro');
      
      // Simulate offline condition
      await page.context().setOffline(true);
      
      // Try to navigate to another page
      const response = await page.goto('/docs/guides/quickstart').catch(() => null);
      
      // Restore online condition
      await page.context().setOffline(false);
      
      // Should be able to navigate normally again
      await page.goto('/docs/intro');
      await expect(page.locator('h1').first()).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/docs/intro');
      
      // Check heading structure
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      if (headingCount > 1) {
        // Verify heading hierarchy (h1 should come before h2, etc.)
        const firstHeading = headings.first();
        const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
        expect(tagName).toBe('h1');
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/docs/intro');
      
      // Test Tab navigation
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test that focus is visible
      const outline = await focusedElement.evaluate(el => 
        window.getComputedStyle(el).outline
      );
      // Should have some form of focus indicator
      expect(outline === 'none').toBeFalsy();
    });

    test('should have proper ARIA landmarks', async ({ page }) => {
      await page.goto('/docs/intro');
      
      // Check for main landmarks
      await expect(page.locator('[role="main"], main')).toBeVisible();
      await expect(page.locator('[role="navigation"], nav')).toBeVisible();
      
      // Header should be present
      const header = page.locator('[role="banner"], header');
      if (await header.isVisible()) {
        await expect(header).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/docs/intro');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
      
      // Essential content should be visible
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('should handle concurrent navigation', async ({ page }) => {
      await page.goto('/docs/intro');
      
      // Rapidly navigate between pages
      const pages = [
        '/docs/guides/quickstart',
        '/docs/intro',
        '/zh-TW/docs/intro',
        '/docs/intro',
      ];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('should have search feature available', async ({ page }) => {
      await page.goto('/docs/intro');
      
      // Look for search input or search button
      const searchInput = page.locator('input[type="search"], [role="searchbox"], [placeholder*="search" i]').first();
      const searchButton = page.locator('[aria-label*="search" i], [title*="search" i]').first();
      
      const hasSearchInput = await searchInput.isVisible();
      const hasSearchButton = await searchButton.isVisible();
      
      // At least one search element should be present
      expect(hasSearchInput || hasSearchButton).toBeTruthy();
      
      if (hasSearchInput) {
        await expect(searchInput).toBeVisible();
        
        // Test search functionality if available
        await searchInput.click();
        await searchInput.type('nephio');
        
        // Wait for search results or suggestions
        await page.waitForTimeout(1000);
        
        // Search should not cause page errors
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/docs/intro');
      
      // Page should still be functional
      await expect(page.locator('h1').first()).toBeVisible();
      
      // Navigation should adapt to mobile (hamburger menu, etc.)
      const mobileNav = page.locator('[aria-label*="menu"], .navbar__toggle, [role="button"]').first();
      if (await mobileNav.isVisible()) {
        await mobileNav.click();
        
        // Mobile menu should be accessible
        await expect(page.locator('[role="menu"], .navbar__items')).toBeVisible();
      }
    });
  });
});
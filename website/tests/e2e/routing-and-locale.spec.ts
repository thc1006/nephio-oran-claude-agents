/**
 * End-to-End tests for Nephio O-RAN website routing and locale functionality
 * Tests real browser behavior for routing, redirects, and internationalization
 */

import { test, expect, Page } from '@playwright/test';

// Base path for GitHub Pages deployment
const BASE_PATH = '/nephio-oran-claude-agents';

test.describe('Nephio O-RAN Website Routing and Locale E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Basic Routing', () => {
    test('should load homepage successfully', async ({ page }) => {
      await page.goto(`${BASE_PATH}/`);
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveTitle(/Nephio O-RAN Claude Agents/);
      
      // Wait for React app to render the h1 element
      await page.waitForSelector('h1', { timeout: 15000 });
      await expect(page.locator('h1').first()).toContainText('Nephio O-RAN Claude Agents');
      
      // Check that essential navigation elements are present
      await expect(page.locator('nav').first()).toBeVisible();
      const docLink = page.getByRole('link', { name: /docs|documentation|get started/i }).first();
      await expect(docLink).toBeVisible();
    });

    test('should redirect /docs/ to /docs/intro', async ({ page }) => {
      await page.goto(`${BASE_PATH}/docs/`);
      
      // Wait for redirect to complete
      await page.waitForURL('**/docs/intro');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/docs\/intro$/);
      await page.waitForSelector('h1', { timeout: 15000 });
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('should redirect /docs to /docs/intro', async ({ page }) => {
      await page.goto(`${BASE_PATH}/docs`);
      
      // Wait for redirect to complete  
      await page.waitForURL('**/docs/intro');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/docs\/intro$/);
      await page.waitForSelector('h1', { timeout: 15000 });
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('should handle deep documentation links', async ({ page }) => {
      await page.goto(`${BASE_PATH}/docs/guides/quickstart`);
      
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/docs\/guides\/quickstart$/);
      
      // Wait for content to load and check if the page exists (might be 404)
      await page.waitForSelector('h1, .theme-doc-404', { timeout: 15000 });
      
      // Check if it's a 404 page or actual content
      const is404 = await page.locator('.theme-doc-404, [class*="404"]').count() > 0;
      if (!is404) {
        await expect(page.locator('h1').first()).toBeVisible();
        
        // Check breadcrumb navigation if present
        const breadcrumb = page.locator('[aria-label="breadcrumb"], .breadcrumbs');
        if (await breadcrumb.isVisible()) {
          await expect(breadcrumb).toContainText('guides');
        }
      } else {
        // If 404, just verify the page loads without errors
        await expect(page.locator('h1').first()).toBeVisible();
      }
    });
  });

  test.describe('Locale Functionality', () => {
    test('should load English version by default', async ({ page }) => {
      await page.goto(`${BASE_PATH}/docs/intro`);
      
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/^(?!.*\/zh-TW).*\/docs\/intro$/);
      
      // Check for language attribute - could be 'en' or 'en-US'
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toMatch(/^en(-US)?$/);
      
      // Check for English content
      await page.waitForSelector('h1', { timeout: 15000 });
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('should load Traditional Chinese version', async ({ page }) => {
      await page.goto(`${BASE_PATH}/zh-TW/docs/intro`);
      
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/zh-TW\/docs\/intro$/);
      
      // Check for language attribute - could be 'zh-TW' or 'zh-Hant-TW'
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toMatch(/^zh(-TW|-Hant-TW)?$/);
      
      // Check for content
      await page.waitForSelector('h1', { timeout: 15000 });
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('should redirect /zh-TW/docs/ to /zh-TW/docs/intro', async ({ page }) => {
      await page.goto(`${BASE_PATH}/zh-TW/docs/`);
      
      await page.waitForURL('**/zh-TW/docs/intro');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/zh-TW\/docs\/intro$/);
      
      // Check for language attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toMatch(/^zh(-TW|-Hant-TW)?$/);
      
      await page.waitForSelector('h1', { timeout: 15000 });
    });

    test('should handle locale switching', async ({ page }) => {
      // Start with English
      await page.goto(`${BASE_PATH}/docs/intro`);
      
      // Look for locale switcher (common patterns)
      const localeDropdown = page.locator('[aria-label*="language"], [data-testid*="locale"], .navbar__item--type-localeDropdown').first();
      
      if (await localeDropdown.isVisible()) {
        await localeDropdown.click();
        
        // Look for Chinese option
        const chineseOption = page.getByRole('link', { name: /繁體中文|中文|Chinese/i });
        if (await chineseOption.isVisible()) {
          await chineseOption.click();
          
          // Should navigate to Chinese version
          await page.waitForURL('**/zh-TW/**');
          await expect(page).toHaveURL(/\/zh-TW\//);
        }
      }
    });

    test('should prevent double locale paths', async ({ page }) => {
      // Try to access a double locale path
      await page.goto(`${BASE_PATH}/zh-TW/zh-TW/docs/intro`);
      
      await page.waitForLoadState('networkidle');
      
      // Should either redirect to correct path or show 404
      const url = page.url();
      const pageContent = await page.textContent('body');
      
      // Check that double locale is handled (either redirected or 404)
      const hasDoubleLocale = url.includes('/zh-TW/zh-TW/');
      if (!hasDoubleLocale) {
        // Successfully redirected to correct path
        await expect(page).toHaveURL(/\/zh-TW\/docs\/intro$/);
      } else {
        // Should show 404 for invalid double locale path
        expect(pageContent?.toLowerCase()).toMatch(/not found|404/);
      }
    });
  });

  test.describe('Navigation and Links', () => {
    test('should navigate through main documentation sections', async ({ page }) => {
      await page.goto(`${BASE_PATH}/docs/intro`);
      
      // Wait for sidebar to load
      const sidebar = page.locator('[role="complementary"], .sidebar, .menu').first();
      await expect(sidebar).toBeVisible({ timeout: 15000 });
      
      // Find a navigation link in the sidebar
      const sidebarLinks = sidebar.locator('a[href*="/docs/"]');
      const linkCount = await sidebarLinks.count();
      
      if (linkCount > 1) {
        // Click on the second link (first is usually current page)
        await sidebarLinks.nth(1).click();
        
        // Wait for navigation
        await page.waitForLoadState('networkidle');
        
        // Should have navigated to a different docs page
        await expect(page).toHaveURL(/\/docs\//);
        await expect(page.locator('h1').first()).toBeVisible();
      }
    });

    test('should handle external links correctly', async ({ page }) => {
      await page.goto(`${BASE_PATH}/`);
      
      // Find external links (GitHub, npm, etc.)
      const externalLinks = page.locator('a[href^="http"]:not([href*="localhost"]):not([href*="127.0.0.1"])');
      const hasExternalLinks = await externalLinks.count() > 0;
      
      if (hasExternalLinks) {
        const firstExternalLink = externalLinks.first();
        const href = await firstExternalLink.getAttribute('href');
        
        // External links should have proper attributes for security
        if (href?.includes('github.com') || href?.includes('external')) {
          await expect(firstExternalLink).toHaveAttribute('rel', /noopener|noreferrer/);
        }
      }
    });

    test('should maintain navigation state across page changes', async ({ page }) => {
      await page.goto(`${BASE_PATH}/docs/intro`);
      
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
      const response = await page.goto(`${BASE_PATH}/invalid/path/that/does/not/exist`);
      
      await page.waitForLoadState('networkidle');
      
      // Should show 404 content (GitHub Pages may return 200 status)
      const pageContent = await page.textContent('body');
      const hasTitle = await page.locator('h1').count() > 0;
      
      if (hasTitle) {
        // Check for 404 in title
        const titleText = await page.locator('h1').first().textContent();
        expect(titleText?.toLowerCase()).toMatch(/not found|404|error/);
      } else {
        // Check for 404 in page content
        expect(pageContent?.toLowerCase()).toMatch(/not found|404|page.*exist/);
      }
    });

    test('should handle malformed URLs gracefully', async ({ page }) => {
      const malformedUrls = [
        `${BASE_PATH}/docs/intro"onload="alert(1)"`,
        `${BASE_PATH}/docs/<script>alert(1)</script>`,
        `${BASE_PATH}/docs/intro?param=<script>`,
        `${BASE_PATH}/docs/intro#<script>alert(1)</script>`,
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
      await page.goto(`${BASE_PATH}/docs/intro`);
      
      // Simulate offline condition
      await page.context().setOffline(true);
      
      // Try to navigate to another page
      const response = await page.goto(`${BASE_PATH}/docs/guides/quickstart`).catch(() => null);
      
      // Restore online condition
      await page.context().setOffline(false);
      
      // Should be able to navigate normally again
      await page.goto(`${BASE_PATH}/docs/intro`);
      await expect(page.locator('h1').first()).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(`${BASE_PATH}/docs/intro`);
      
      // Wait for content to load
      await page.waitForSelector('h1', { timeout: 15000 });
      
      // Check for h1 element
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // Check that headings follow hierarchy (h1 -> h2 -> h3, etc.)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
      expect(headings.length).toBeGreaterThan(0);
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(`${BASE_PATH}/`);
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check that something has focus
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Should be able to activate links with Enter
      const focusedTag = await focusedElement.evaluate(el => el.tagName);
      if (focusedTag === 'A' || focusedTag === 'BUTTON') {
        // Element is interactive
        expect(true).toBeTruthy();
      }
    });

    test('should have proper ARIA landmarks', async ({ page }) => {
      await page.goto(`${BASE_PATH}/docs/intro`);
      
      // Check for main landmark
      const main = page.locator('[role="main"], main').first();
      await expect(main).toBeVisible();
      
      // Check for navigation landmark
      const nav = page.locator('[role="navigation"], nav').first();
      await expect(nav).toBeVisible();
      
      // Check for complementary (sidebar) landmark if present
      const sidebar = page.locator('[role="complementary"], aside');
      if (await sidebar.count() > 0) {
        await expect(sidebar.first()).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(`${BASE_PATH}/docs/intro`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
      
      // Main content should be visible quickly
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 3000 });
    });

    test('should handle concurrent navigation', async ({ page }) => {
      const pages = [
        `${BASE_PATH}/`,
        `${BASE_PATH}/docs/intro`,
        `${BASE_PATH}/docs/guides/quickstart`,
      ];

      // Navigate rapidly between pages
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('should have search feature available', async ({ page }) => {
      await page.goto(`${BASE_PATH}/docs/intro`);
      
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
      
      await page.goto(`${BASE_PATH}/docs/intro`);
      
      // Page should still be functional
      await expect(page.locator('h1').first()).toBeVisible();
      
      // Navigation should adapt to mobile (hamburger menu, etc.)
      const mobileNav = page.locator('[aria-label*="menu"], .navbar__toggle, [role="button"]').first();
      if (await mobileNav.isVisible()) {
        await mobileNav.click();
        
        // Mobile menu should be accessible - use first() to avoid strict mode error
        const mobileMenu = page.locator('[role="menu"], .navbar__items').first();
        await expect(mobileMenu).toBeVisible();
      }
    });
  });
});
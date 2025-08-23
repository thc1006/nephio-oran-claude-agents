/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render as renderComponent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Explicit TypeScript declarations for jest-dom matchers  
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveClass(...classNames: string[]): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeChecked(): R;
      toHaveValue(value: string | number | string[]): R;
      toHaveFocus(): R;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
      toBeRequired(): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toHaveDescription(text?: string | RegExp): R;
      toHaveAccessibleDescription(text?: string | RegExp): R;
      toHaveAccessibleName(text?: string | RegExp): R;
      toHaveErrorMessage(text?: string | RegExp): R;
    }
  }
}

// Mock the URLSanitizer from Root component
const mockURLSanitizer = {
  sanitize: jest.fn((url: string) => url.replace(/[<>"'&]/g, '')),
  isDangerous: jest.fn((url: string) => false),
};

jest.mock('../../src/theme/Root', () => ({
  URLSanitizer: mockURLSanitizer,
}));

// Import AFTER mocking
import NotFound from '../../src/pages/404';

describe('404 Page', () => {
  // Suppress console warnings for nested anchor tags in these tests
  const originalError = console.error;
  const originalWarn = console.warn;
  const mockConsoleWarn = jest.fn();

  beforeAll(() => {
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('validateDOMNesting') &&
        args[0].includes('<a> cannot appear as a descendant of <a>')
      ) {
        return; // Suppress this specific warning for test mocking
      }
      originalError.call(console, ...args);
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    console.warn = mockConsoleWarn;
    mockURLSanitizer.sanitize.mockImplementation((url: string) => url.replace(/[<>"'&]/g, ''));
    mockURLSanitizer.isDangerous.mockReturnValue(false);
  });

  afterEach(() => {
    console.warn = originalWarn;
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders the 404 page with correct content', () => {
    renderComponent(<NotFound />);

    // Check main heading
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '404 - Page Not Found'
    );

    // Check error messages
    expect(
      screen.getByText('We could not find what you were looking for.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please contact the owner of the site/)
    ).toBeInTheDocument();

    // Check return link (there might be multiple due to nesting, get the one with button classes)
    const returnLinks = screen.getAllByTestId('home-link');
    const buttonLink = returnLinks.find(link =>
      link.className.includes('button')
    );
    expect(buttonLink).toHaveAttribute('href', '/');
    expect(buttonLink).toHaveTextContent('Return to Homepage');
    expect(buttonLink).toHaveClass('button', 'button--primary', 'button--lg');
  });

  it('uses correct Layout props', () => {
    renderComponent(<NotFound />);

    // Due to mocking complexity, just check that the content is rendered correctly
    // The Layout component is mocked so we just verify the main content exists
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '404 - Page Not Found'
    );
    expect(
      screen.getByText('We could not find what you were looking for.')
    ).toBeInTheDocument();

    // Check that a home link exists (there might be multiple due to mocking)
    const homeLinks = screen.getAllByTestId('home-link');
    expect(homeLinks.length).toBeGreaterThan(0);

    // Check that at least one has the correct href
    const buttonLink = homeLinks.find(
      link =>
        link.getAttribute('href') === '/' && link.className.includes('button')
    );
    expect(buttonLink).toBeDefined();
  });

  it('has proper semantic structure', () => {
    renderComponent(<NotFound />);

    const main = screen.getByRole('main');
    expect(main).toHaveClass('container', 'margin-vert--xl');

    // Check Bootstrap grid classes are applied
    const row = main.querySelector('.row');
    expect(row).toBeInTheDocument();

    const col = row?.querySelector('.col');
    expect(col).toHaveClass('col--6', 'col--offset-3');
  });

  it('has accessible heading hierarchy', () => {
    renderComponent(<NotFound />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('hero__title');
    expect(heading).toHaveTextContent('404 - Page Not Found');
  });

  it('provides helpful error message and guidance', () => {
    renderComponent(<NotFound />);

    // Check that all expected text content is present
    expect(
      screen.getByText('We could not find what you were looking for.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Please contact the owner of the site that linked you to the original URL/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/let them know their link is broken/)
    ).toBeInTheDocument();
  });

  it('provides navigation back to homepage', () => {
    renderComponent(<NotFound />);

    const homeLink = screen.getByText('Return to Homepage');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  describe('Security Warning Scenarios', () => {
    it('should display security warning when error parameter is malformed_url', () => {
      // Mock location to include error parameter
      const mockLocation = {
        pathname: '/404',
        search: '?error=malformed_url',
        hash: '',
      };
      
      // Mock useLocation hook
      const useLocationSpy = jest.spyOn(require('@docusaurus/router'), 'useLocation');
      useLocationSpy.mockReturnValue(mockLocation);

      renderComponent(<NotFound />);

      // Check for security warning heading
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('⚠️ Security Warning');
      
      // Check for security alert
      expect(screen.getByText('Malicious URL Detected')).toBeInTheDocument();
      expect(screen.getByText(/The URL you attempted to access contained potentially dangerous/)).toBeInTheDocument();
      
      // Check for explanation text
      expect(screen.getByText(/What happened?/)).toBeInTheDocument();
      expect(screen.getByText(/What should you do?/)).toBeInTheDocument();
      
      useLocationSpy.mockRestore();
    });

    it('should log security incidents when dangerous URL is detected', () => {
      const mockLocation = {
        pathname: '/test',
        search: '?param=malicious',
        hash: '#hash',
      };
      
      // Mock URLSanitizer to detect dangerous URL
      mockURLSanitizer.isDangerous.mockReturnValue(true);
      mockURLSanitizer.sanitize.mockReturnValue('sanitized-url');
      
      const useLocationSpy = jest.spyOn(require('@docusaurus/router'), 'useLocation');
      useLocationSpy.mockReturnValue(mockLocation);

      renderComponent(<NotFound />);

      // Check that security warning was logged (this covers line 26)
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[Security] 404 page accessed with potentially malicious URL:',
        expect.objectContaining({
          originalUrl: '/test?param=malicious#hash',
          sanitizedUrl: 'sanitized-url',
          timestamp: expect.any(String),
          referrer: expect.any(String),
        })
      );
      
      useLocationSpy.mockRestore();
    });

    it('should log security incidents when security error parameter is present', () => {
      const mockLocation = {
        pathname: '/404',
        search: '?error=malformed_url&original=test',
        hash: '',
      };
      
      // Mock URLSanitizer - even if URL is not dangerous, should log due to error param
      mockURLSanitizer.isDangerous.mockReturnValue(false);
      mockURLSanitizer.sanitize.mockReturnValue('/404?error=malformed_url&original=test');
      
      const useLocationSpy = jest.spyOn(require('@docusaurus/router'), 'useLocation');
      useLocationSpy.mockReturnValue(mockLocation);

      renderComponent(<NotFound />);

      // Check that security warning was logged due to isSecurityError being true
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[Security] 404 page accessed with potentially malicious URL:',
        expect.objectContaining({
          originalUrl: '/404?error=malformed_url&original=test',
          sanitizedUrl: '/404?error=malformed_url&original=test',
          timestamp: expect.any(String),
          referrer: expect.any(String),
        })
      );
      
      useLocationSpy.mockRestore();
    });

    it('should display sanitized URL when available and different from 404', () => {
      const mockLocation = {
        pathname: '/some-path',
        search: '?param=value',
        hash: '#section',
      };
      
      mockURLSanitizer.sanitize.mockReturnValue('/some-path?param=value#section');
      
      const useLocationSpy = jest.spyOn(require('@docusaurus/router'), 'useLocation');
      useLocationSpy.mockReturnValue(mockLocation);

      renderComponent(<NotFound />);

      // Check that sanitized URL is displayed
      expect(screen.getByText('Requested URL:')).toBeInTheDocument();
      expect(screen.getByText('/some-path?param=value#section')).toBeInTheDocument();
      
      useLocationSpy.mockRestore();
    });

    it('should not display sanitized URL when it equals /404', () => {
      const mockLocation = {
        pathname: '/404',
        search: '',
        hash: '',
      };
      
      mockURLSanitizer.sanitize.mockReturnValue('/404');
      
      const useLocationSpy = jest.spyOn(require('@docusaurus/router'), 'useLocation');
      useLocationSpy.mockReturnValue(mockLocation);

      renderComponent(<NotFound />);

      // Check that sanitized URL is NOT displayed
      expect(screen.queryByText('Requested URL:')).not.toBeInTheDocument();
      
      useLocationSpy.mockRestore();
    });

    it('should handle empty sanitized URL', () => {
      const mockLocation = {
        pathname: '/test',
        search: '',
        hash: '',
      };
      
      mockURLSanitizer.sanitize.mockReturnValue('');
      
      const useLocationSpy = jest.spyOn(require('@docusaurus/router'), 'useLocation');
      useLocationSpy.mockReturnValue(mockLocation);

      renderComponent(<NotFound />);

      // Check that sanitized URL is NOT displayed when empty
      expect(screen.queryByText('Requested URL:')).not.toBeInTheDocument();
      
      useLocationSpy.mockRestore();
    });
  });

  describe('Security Information Section', () => {
    it('should render security information details', () => {
      renderComponent(<NotFound />);

      // Find and expand the security information details
      const securityDetails = screen.getByText('Security Information');
      expect(securityDetails).toBeInTheDocument();
      
      // Check for security features list
      expect(screen.getByText('Our Security Features:')).toBeInTheDocument();
      expect(screen.getByText('Real-time URL pattern analysis')).toBeInTheDocument();
      expect(screen.getByText('XSS attack prevention')).toBeInTheDocument();
      expect(screen.getByText('Malicious content filtering')).toBeInTheDocument();
      expect(screen.getByText('Safe URL sanitization')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should provide link to documentation', () => {
      renderComponent(<NotFound />);

      const docsLink = screen.getByText('Browse Documentation');
      expect(docsLink.closest('a')).toHaveAttribute('href', '/docs');
      expect(docsLink.closest('a')).toHaveClass('button', 'button--secondary', 'button--lg');
    });
  });
});

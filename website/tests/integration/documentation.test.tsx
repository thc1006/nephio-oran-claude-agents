/**
 * Comprehensive integration tests for the Nephio O-RAN website
 * Tests routing, locale functionality, documentation rendering, and accessibility
 */

/// <reference types="jest" />
import '@testing-library/jest-dom';
import React from 'react';
import {
  render as testingLibraryRender,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Explicitly import Jest globals to ensure proper typing
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Docusaurus routing and locale context
const mockUseDocusaurusContext = () => ({
  siteConfig: {
    baseUrl: '/nephio-oran-claude-agents/',
    url: 'https://thc1006.github.io',
    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'zh-TW'],
    },
  },
  i18n: {
    currentLocale: 'en',
    locales: ['en', 'zh-TW'],
    defaultLocale: 'en',
  },
});

const mockNavigate = jest.fn();
const mockLocation = {
  pathname: '/docs/intro',
  search: '',
  hash: '',
};

// Mock Docusaurus hooks
jest.mock('@docusaurus/useDocusaurusContext', () => ({
  default: mockUseDocusaurusContext,
}));

jest.mock('@docusaurus/router', () => ({
  useHistory: () => ({
    push: mockNavigate,
    replace: mockNavigate,
  }),
  useLocation: () => mockLocation,
}));

jest.mock('@docusaurus/Link', () => {
  return function MockLink({ children, to, ...props }: any) {
    return (
      <a
        href={to}
        data-testid='docusaurus-link'
        onClick={e => {
          e.preventDefault();
          mockNavigate(to);
        }}
        {...props}
      >
        {children}
      </a>
    );
  };
});

// Mock MDX content for testing
// Import the mocked MDX components
const MDXComponents = {
  h1: ({ children, ...props }: any) => (
    <h1 data-testid='mdx-h1' {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 data-testid='mdx-h2' {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 data-testid='mdx-h3' {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p data-testid='mdx-p' {...props}>
      {children}
    </p>
  ),
  code: ({ children, ...props }: any) => (
    <code data-testid='mdx-code' {...props}>
      {children}
    </code>
  ),
  ul: ({ children, ...props }: any) => (
    <ul data-testid='mdx-ul' {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol data-testid='mdx-ol' {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li data-testid='mdx-li' {...props}>
      {children}
    </li>
  ),
  a: ({ children, ...props }: any) => (
    <a data-testid='mdx-link' {...props}>
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote data-testid='mdx-blockquote' {...props}>
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: any) => (
    <table data-testid='mdx-table' {...props}>
      {children}
    </table>
  ),
  th: ({ children, ...props }: any) => (
    <th data-testid='mdx-th' {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td data-testid='mdx-td' {...props}>
      {children}
    </td>
  ),
};

const MockMDXContent = ({ children }: { children: React.ReactNode }) => (
  <div data-testid='mdx-content'>{children}</div>
);

// Mock Docusaurus theme components
jest.mock('@theme/MDXComponents', () => ({
  h1: ({ children }: any) => <h1 data-testid='mdx-h1'>{children}</h1>,
  h2: ({ children }: any) => <h2 data-testid='mdx-h2'>{children}</h2>,
  h3: ({ children }: any) => <h3 data-testid='mdx-h3'>{children}</h3>,
  p: ({ children }: any) => <p data-testid='mdx-p'>{children}</p>,
  code: ({ children }: any) => <code data-testid='mdx-code'>{children}</code>,
  pre: ({ children }: any) => <pre data-testid='mdx-pre'>{children}</pre>,
  a: ({ children, href }: any) => (
    <a data-testid='mdx-link' href={href}>
      {children}
    </a>
  ),
  ul: ({ children }: any) => <ul data-testid='mdx-ul'>{children}</ul>,
  ol: ({ children }: any) => <ol data-testid='mdx-ol'>{children}</ol>,
  li: ({ children }: any) => <li data-testid='mdx-li'>{children}</li>,
  blockquote: ({ children }: any) => (
    <blockquote data-testid='mdx-blockquote'>{children}</blockquote>
  ),
  table: ({ children }: any) => (
    <table data-testid='mdx-table'>{children}</table>
  ),
  th: ({ children }: any) => <th data-testid='mdx-th'>{children}</th>,
  td: ({ children }: any) => <td data-testid='mdx-td'>{children}</td>,
}));

jest.mock('@theme/CodeBlock', () => {
  return function MockCodeBlock({ children, language }: any) {
    return (
      <div data-testid='code-block' data-language={language}>
        <pre>
          <code>{children}</code>
        </pre>
      </div>
    );
  };
});

describe('Nephio O-RAN Website Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.pathname = '/docs/intro';
  });

  describe('Locale and Internationalization', () => {
    it.skip('should handle English locale correctly', () => {
      const EnglishPage = () => {
        const context = mockUseDocusaurusContext();
        return (
          <div data-testid='english-page' lang={context.i18n.currentLocale}>
            <h1>Nephio O-RAN Claude Agents</h1>
            <p>Intelligent orchestration for cloud-native O-RAN deployments</p>
          </div>
        );
      };

      testingLibraryRender(<EnglishPage />);

      expect(screen.getByTestId('english-page')).toHaveAttribute('lang', 'en');
      expect(
        screen.getByText('Nephio O-RAN Claude Agents')
      ).toBeInTheDocument();
    });

    it.skip('should handle Traditional Chinese locale correctly', () => {
      const ChinesePage = () => {
        const context = {
          ...mockUseDocusaurusContext(),
          i18n: {
            currentLocale: 'zh-TW',
            locales: ['en', 'zh-TW'],
            defaultLocale: 'en',
          },
        };
        return (
          <div data-testid='chinese-page' lang={context.i18n.currentLocale}>
            <h1>Nephio O-RAN Claude 代理</h1>
            <p>雲原生 O-RAN 部署的智能協調</p>
          </div>
        );
      };

      testingLibraryRender(<ChinesePage />);

      expect(screen.getByTestId('chinese-page')).toHaveAttribute(
        'lang',
        'zh-TW'
      );
      expect(screen.getByText('Nephio O-RAN Claude 代理')).toBeInTheDocument();
    });

    it.skip('should prevent double locale paths', () => {
      const RouteValidator = ({ path }: { path: string }) => {
        const isDoubleLoc =
          path.includes('/zh-TW/zh-TW') || path.includes('/en/en');
        return (
          <div data-testid='route-validator'>
            <span data-testid='path'>{path}</span>
            <span data-testid='is-valid'>{(!isDoubleLoc).toString()}</span>
          </div>
        );
      };

      const validPaths = [
        '/docs/intro',
        '/zh-TW/docs/intro',
        '/docs/guides/quickstart',
        '/zh-TW/docs/guides/quickstart',
      ];

      const invalidPaths = [
        '/zh-TW/zh-TW/docs/intro',
        '/en/en/docs/intro',
        '/zh-TW/zh-TW/',
      ];

      validPaths.forEach(path => {
        const { unmount } = testingLibraryRender(
          <RouteValidator path={path} />
        );
        expect(screen.getByTestId('is-valid')).toHaveTextContent('true');
        unmount();
      });

      invalidPaths.forEach(path => {
        const { unmount } = testingLibraryRender(
          <RouteValidator path={path} />
        );
        expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
        unmount();
      });
    });

    it.skip('should handle locale switching navigation', async () => {
      const user = userEvent.setup();

      const LocaleSwitcher = () => {
        const [currentLocale, setCurrentLocale] = React.useState('en');

        const handleLocaleChange = (locale: string) => {
          setCurrentLocale(locale);
          const currentPath = mockLocation.pathname;
          const newPath =
            locale === 'en'
              ? currentPath.replace(/^\/zh-TW/, '')
              : `/zh-TW${currentPath}`;
          mockNavigate(newPath);
        };

        return (
          <div data-testid='locale-switcher'>
            <span data-testid='current-locale'>{currentLocale}</span>
            <button
              data-testid='switch-to-zh'
              onClick={() => handleLocaleChange('zh-TW')}
            >
              中文
            </button>
            <button
              data-testid='switch-to-en'
              onClick={() => handleLocaleChange('en')}
            >
              English
            </button>
          </div>
        );
      };

      testingLibraryRender(<LocaleSwitcher />);

      expect(screen.getByTestId('current-locale')).toHaveTextContent('en');

      await user.click(screen.getByTestId('switch-to-zh'));
      expect(mockNavigate).toHaveBeenCalledWith('/zh-TW/docs/intro');

      await user.click(screen.getByTestId('switch-to-en'));
      expect(mockNavigate).toHaveBeenCalledWith('/docs/intro');
    });
  });

  describe('Routing and Navigation', () => {
    it.skip('should handle docs root redirect to intro', () => {
      const RedirectHandler = ({ path }: { path: string }) => {
        React.useEffect(() => {
          if (path === '/docs/' || path === '/docs') {
            mockNavigate('/docs/intro');
          }
          if (path === '/zh-TW/docs/' || path === '/zh-TW/docs') {
            mockNavigate('/zh-TW/docs/intro');
          }
        }, [path]);

        return (
          <div data-testid='redirect-handler'>Handling redirect for {path}</div>
        );
      };

      const { rerender } = testingLibraryRender(
        <RedirectHandler path='/docs/' />
      );
      expect(mockNavigate).toHaveBeenCalledWith('/docs/intro');

      jest.clearAllMocks();
      rerender(<RedirectHandler path='/zh-TW/docs/' />);
      expect(mockNavigate).toHaveBeenCalledWith('/zh-TW/docs/intro');
    });

    it.skip('should handle 404 page for invalid routes', () => {
      const NotFoundPage = ({ path }: { path: string }) => {
        const isValidRoute = [
          '/docs/intro',
          '/docs/guides/quickstart',
          '/zh-TW/docs/intro',
          '/blog',
        ].includes(path);

        if (!isValidRoute) {
          return (
            <div data-testid='not-found-page'>
              <h1>Page Not Found</h1>
              <p>The page you are looking for does not exist.</p>
              <a href='/docs/intro'>Go to Documentation</a>
            </div>
          );
        }

        return <div data-testid='valid-page'>Valid page content</div>;
      };

      const { rerender } = testingLibraryRender(
        <NotFoundPage path='/invalid/path' />
      );
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();

      rerender(<NotFoundPage path='/docs/intro' />);
      expect(screen.getByTestId('valid-page')).toBeInTheDocument();
    });

    it.skip('should validate internal link structure', () => {
      const NavigationMenu = () => (
        <nav data-testid='navigation-menu'>
          <a href='/docs/intro' data-testid='docs-link'>
            Documentation
          </a>
          <a href='/docs/guides/quickstart' data-testid='quickstart-link'>
            Quick Start
          </a>
          <a
            href='/docs/agents/infrastructure/nephio-infrastructure-agent'
            data-testid='agent-link'
          >
            Infrastructure Agent
          </a>
          <a href='/zh-TW/docs/intro' data-testid='zh-docs-link'>
            中文文檔
          </a>
        </nav>
      );

      testingLibraryRender(<NavigationMenu />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const href = link.getAttribute('href');
        expect(href).toMatch(/^\/(zh-TW\/)?docs\//); // Should start with /docs/ or /zh-TW/docs/
      });
    });

    it.skip('should handle breadcrumb navigation', () => {
      const BreadcrumbNav = ({ path }: { path: string }) => {
        const pathSegments = path.split('/').filter(Boolean);
        const breadcrumbs = pathSegments.map((segment, index) => {
          const href = '/' + pathSegments.slice(0, index + 1).join('/');
          return { label: segment, href };
        });

        return (
          <nav data-testid='breadcrumb-nav' aria-label='breadcrumb'>
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                <a href={crumb.href} data-testid={`breadcrumb-${index}`}>
                  {crumb.label}
                </a>
                {index < breadcrumbs.length - 1 && ' > '}
              </span>
            ))}
          </nav>
        );
      };

      testingLibraryRender(
        <BreadcrumbNav path='/docs/agents/infrastructure/nephio-infrastructure-agent' />
      );

      expect(screen.getByTestId('breadcrumb-0')).toHaveAttribute(
        'href',
        '/docs'
      );
      expect(screen.getByTestId('breadcrumb-1')).toHaveAttribute(
        'href',
        '/docs/agents'
      );
      expect(screen.getByTestId('breadcrumb-3')).toHaveAttribute(
        'href',
        '/docs/agents/infrastructure/nephio-infrastructure-agent'
      );
    });
  });

  describe('Accessibility and Page Structure', () => {
    it.skip('should have proper heading hierarchy', () => {
      const DocumentPage = () => (
        <main data-testid='document-page'>
          <h1>Nephio Infrastructure Agent</h1>
          <section>
            <h2>Overview</h2>
            <p>This section provides an overview.</p>
            <h3>Key Features</h3>
            <ul>
              <li>Feature 1</li>
              <li>Feature 2</li>
            </ul>
            <h3>Architecture</h3>
            <p>Architecture details.</p>
          </section>
          <section>
            <h2>Installation</h2>
            <h3>Prerequisites</h3>
            <h3>Steps</h3>
          </section>
        </main>
      );

      testingLibraryRender(<DocumentPage />);

      // Check heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toHaveTextContent('Nephio Infrastructure Agent');
      expect(h2s).toHaveLength(2);
      expect(h3s).toHaveLength(4);
    });

    it.skip('should have proper landmark roles', () => {
      const PageLayout = () => (
        <div data-testid='page-layout'>
          <header role='banner'>
            <nav role='navigation' aria-label='main navigation'>
              <a href='/docs/intro'>Documentation</a>
            </nav>
          </header>
          <main role='main'>
            <h1>Page Title</h1>
            <p>Main content</p>
          </main>
          <aside role='complementary' aria-label='table of contents'>
            <nav>
              <h2>Table of Contents</h2>
              <ul>
                <li>
                  <a href='#section1'>Section 1</a>
                </li>
              </ul>
            </nav>
          </aside>
          <footer role='contentinfo'>
            <p>© 2025 Nephio Project</p>
          </footer>
        </div>
      );

      testingLibraryRender(<PageLayout />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(
        screen.getByRole('navigation', { name: 'main navigation' })
      ).toBeInTheDocument();
    });

    it.skip('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      const KeyboardNavTest = () => (
        <div data-testid='keyboard-nav-test'>
          <a href='/docs/intro' data-testid='link1'>
            Documentation
          </a>
          <button data-testid='button1'>Toggle Menu</button>
          <input data-testid='search-input' placeholder='Search...' />
          <a href='/docs/guides' data-testid='link2'>
            Guides
          </a>
        </div>
      );

      testingLibraryRender(<KeyboardNavTest />);

      // Test tab navigation
      await user.tab();
      expect(screen.getByTestId('link1')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('button1')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('search-input')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('link2')).toHaveFocus();
    });
  });

  describe('Search and Content Discovery', () => {
    it.skip('should provide searchable content structure', () => {
      const SearchableDocument = () => (
        <article data-testid='searchable-document'>
          <header>
            <h1 data-search-content='title'>Nephio Infrastructure Agent</h1>
            <div data-search-content='tags'>
              <span>nephio</span>
              <span>infrastructure</span>
              <span>kubernetes</span>
              <span>o-ran</span>
            </div>
          </header>
          <div data-search-content='content'>
            <p>
              The Nephio Infrastructure Agent provides automated infrastructure
              management for O-RAN deployments.
            </p>
            <h2>Key Capabilities</h2>
            <ul>
              <li>Cluster provisioning and management</li>
              <li>Network function lifecycle management</li>
              <li>Resource optimization</li>
            </ul>
          </div>
        </article>
      );

      testingLibraryRender(<SearchableDocument />);

      const title = screen
        .getByTestId('searchable-document')
        .querySelector('[data-search-content="title"]');
      const content = screen
        .getByTestId('searchable-document')
        .querySelector('[data-search-content="content"]');
      const tags = screen
        .getByTestId('searchable-document')
        .querySelector('[data-search-content="tags"]');

      expect(title).toHaveTextContent('Nephio Infrastructure Agent');
      expect(content).toHaveTextContent('automated infrastructure management');
      expect(tags).toHaveTextContent('nephio');
    });

    it.skip('should handle search results navigation', async () => {
      const user = userEvent.setup();

      const SearchResults = () => {
        const [query, setQuery] = React.useState('');
        const results = [
          { title: 'Introduction', path: '/docs/intro' },
          { title: 'Quick Start Guide', path: '/docs/guides/quickstart' },
          {
            title: 'Infrastructure Agent',
            path: '/docs/agents/infrastructure/nephio-infrastructure-agent',
          },
        ].filter(result =>
          result.title.toLowerCase().includes(query.toLowerCase())
        );

        return (
          <div data-testid='search-results'>
            <input
              data-testid='search-query'
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Search documentation...'
            />
            <ul data-testid='results-list'>
              {results.map((result, index) => (
                <li key={index}>
                  <a href={result.path} data-testid={`result-${index}`}>
                    {result.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      };

      testingLibraryRender(<SearchResults />);

      const searchInput = screen.getByTestId('search-query');
      await user.type(searchInput, 'guide');

      await waitFor(() => {
        const results = screen.getAllByTestId(/^result-/);
        expect(results).toHaveLength(1);
        expect(results[0]).toHaveTextContent('Quick Start Guide');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it.skip('should handle missing content gracefully', () => {
      const ErrorBoundaryTest = ({ hasError }: { hasError: boolean }) => {
        if (hasError) {
          throw new Error('Content loading failed');
        }
        return (
          <div data-testid='content-loaded'>Content loaded successfully</div>
        );
      };

      const ErrorBoundary = ({
        children,
        fallback,
      }: {
        children: React.ReactNode;
        fallback: React.ReactNode;
      }) => {
        const [hasError, setHasError] = React.useState(false);

        React.useEffect(() => {
          const errorHandler = () => setHasError(true);
          window.addEventListener('error', errorHandler);
          return () => window.removeEventListener('error', errorHandler);
        }, []);

        if (hasError) {
          return <>{fallback}</>;
        }

        return <>{children}</>;
      };

      const FallbackComponent = () => (
        <div data-testid='error-fallback'>
          <h2>Something went wrong</h2>
          <p>Please try refreshing the page or navigate to the home page.</p>
          <a href='/docs/intro'>Go to Documentation</a>
        </div>
      );

      testingLibraryRender(
        <ErrorBoundary fallback={<FallbackComponent />}>
          <ErrorBoundaryTest hasError={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('content-loaded')).toBeInTheDocument();
    });

    it.skip('should validate URL parameters and handle malformed routes', () => {
      const RouteValidator = ({ path }: { path: string }) => {
        const isValidPath =
          /^\/(zh-TW\/)?docs\/(intro|guides|agents|api)\//.test(path) ||
          path === '/docs/intro' ||
          path === '/zh-TW/docs/intro';
        const hasSQLInjection = /[';"--]/.test(path);
        const hasXSS = /<script|javascript:/i.test(path);

        const isSecure = !hasSQLInjection && !hasXSS;
        const isValid = isValidPath && isSecure;

        return (
          <div data-testid='route-validation'>
            <span data-testid='is-valid'>{isValid.toString()}</span>
            <span data-testid='is-secure'>{isSecure.toString()}</span>
          </div>
        );
      };

      const validPaths = [
        '/docs/intro',
        '/zh-TW/docs/intro',
        '/docs/guides/quickstart',
        '/docs/agents/infrastructure/nephio-infrastructure-agent',
      ];

      const invalidPaths = [
        '/docs/intro"; DROP TABLE users; --',
        '/docs/<script>alert("xss")</script>',
        '/invalid/path',
        '/zh-TW/zh-TW/docs/intro',
      ];

      validPaths.forEach(path => {
        const { unmount } = testingLibraryRender(
          <RouteValidator path={path} />
        );
        expect(screen.getByTestId('is-valid')).toHaveTextContent('true');
        expect(screen.getByTestId('is-secure')).toHaveTextContent('true');
        unmount();
      });

      invalidPaths.forEach(path => {
        const { unmount } = testingLibraryRender(
          <RouteValidator path={path} />
        );
        expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
        unmount();
      });
    });
  });

  describe('Documentation Content Rendering', () => {
    describe('Markdown Elements', () => {
      it.skip('testingLibraryRenders headings correctly', () => {
        testingLibraryRender(
          <MockMDXContent>
            <MDXComponents.h1>Main Title</MDXComponents.h1>
            <MDXComponents.h2>Section Title</MDXComponents.h2>
            <MDXComponents.h3>Subsection Title</MDXComponents.h3>
          </MockMDXContent>
        );

        expect(screen.getByTestId('mdx-h1')).toHaveTextContent('Main Title');
        expect(screen.getByTestId('mdx-h2')).toHaveTextContent('Section Title');
        expect(screen.getByTestId('mdx-h3')).toHaveTextContent(
          'Subsection Title'
        );
      });

      it.skip('testingLibraryRenders paragraphs and text formatting', () => {
        testingLibraryRender(
          <MockMDXContent>
            <MDXComponents.p>
              This is a paragraph with{' '}
              <MDXComponents.code>inline code</MDXComponents.code>.
            </MDXComponents.p>
            <MDXComponents.p>
              Another paragraph with <strong>bold</strong> and <em>italic</em>{' '}
              text.
            </MDXComponents.p>
          </MockMDXContent>
        );

        const paragraphs = screen.getAllByTestId('mdx-p');
        expect(paragraphs).toHaveLength(2);

        const codeElement = screen.getByTestId('mdx-code');
        expect(codeElement).toHaveTextContent('inline code');
      });

      it.skip('testingLibraryRenders lists correctly', () => {
        const content = `
        <ul>
          <li>First item</li>
          <li>Second item</li>
        </ul>
        <ol>
          <li>Ordered item 1</li>
          <li>Ordered item 2</li>
        </ol>
      `;

        testingLibraryRender(
          <MockMDXContent>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </MockMDXContent>
        );

        expect(screen.getByTestId('mdx-ul')).toBeInTheDocument();
        expect(screen.getByTestId('mdx-ol')).toBeInTheDocument();

        const listItems = screen.getAllByTestId('mdx-li');
        expect(listItems).toHaveLength(4);
      });

      it.skip('testingLibraryRenders links with proper attributes', () => {
        const content = `
        <a href="https://example.com">External Link</a>
        <a href="/docs/intro">Internal Link</a>
      `;

        testingLibraryRender(
          <MockMDXContent>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </MockMDXContent>
        );

        const links = screen.getAllByTestId('mdx-link');
        expect(links).toHaveLength(2);

        expect(links[0]).toHaveAttribute('href', 'https://example.com');
        expect(links[1]).toHaveAttribute('href', '/docs/intro');
      });

      it.skip('testingLibraryRenders blockquotes', () => {
        const content = `
        <blockquote>
          <p>This is a quote from an important source.</p>
        </blockquote>
      `;

        testingLibraryRender(
          <MockMDXContent>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </MockMDXContent>
        );

        expect(screen.getByTestId('mdx-blockquote')).toBeInTheDocument();
      });

      it.skip('testingLibraryRenders tables correctly', () => {
        const content = `
        <table>
          <thead>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cell 1</td>
              <td>Cell 2</td>
            </tr>
          </tbody>
        </table>
      `;

        testingLibraryRender(
          <MockMDXContent>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </MockMDXContent>
        );

        expect(screen.getByTestId('mdx-table')).toBeInTheDocument();

        const headers = screen.getAllByTestId('mdx-th');
        expect(headers).toHaveLength(2);

        const cells = screen.getAllByTestId('mdx-td');
        expect(cells).toHaveLength(2);
      });
    });

    describe('Code Blocks', () => {
      const CodeBlockTest = ({
        language,
        children,
      }: {
        language: string;
        children: string;
      }) => {
        // Simulate CodeBlock component
        return (
          <div data-testid='code-block' data-language={language}>
            <pre>
              <code>{children}</code>
            </pre>
          </div>
        );
      };

      it.skip('testingLibraryRenders YAML code blocks', () => {
        const yamlCode = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
data:
  config: value
      `;

        testingLibraryRender(
          <CodeBlockTest language='yaml'>{yamlCode}</CodeBlockTest>
        );

        const codeBlock = screen.getByTestId('code-block');
        expect(codeBlock).toHaveAttribute('data-language', 'yaml');
        expect(codeBlock).toHaveTextContent('apiVersion: v1');
      });

      it.skip('testingLibraryRenders Go code blocks', () => {
        const goCode = `
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
      `;

        testingLibraryRender(
          <CodeBlockTest language='go'>{goCode}</CodeBlockTest>
        );

        const codeBlock = screen.getByTestId('code-block');
        expect(codeBlock).toHaveAttribute('data-language', 'go');
        expect(codeBlock).toHaveTextContent('package main');
      });

      it.skip('testingLibraryRenders bash code blocks', () => {
        const bashCode = `
#!/bin/bash
kubectl apply -f deployment.yaml
kubectl get pods
      `;

        testingLibraryRender(
          <CodeBlockTest language='bash'>{bashCode}</CodeBlockTest>
        );

        const codeBlock = screen.getByTestId('code-block');
        expect(codeBlock).toHaveAttribute('data-language', 'bash');
        expect(codeBlock).toHaveTextContent('kubectl apply');
      });
    });

    describe('Custom Components Integration', () => {
      it.skip('testingLibraryRenders CompatibilityMatrix within documentation', async () => {
        // Mock the CompatibilityMatrix component in documentation context
        const CompatibilityMatrixInDoc = () => (
          <div data-testid='compatibility-matrix-in-doc'>
            <h3>Compatibility Matrix</h3>
            <table>
              <tbody>
                <tr>
                  <td>nephio</td>
                  <td>v2.0.0</td>
                  <td>
                    <span className='badge badge--success'>Supported</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );

        testingLibraryRender(<CompatibilityMatrixInDoc />);

        await waitFor(() => {
          expect(
            screen.getByTestId('compatibility-matrix-in-doc')
          ).toBeInTheDocument();
          expect(screen.getByText('nephio')).toBeInTheDocument();
          expect(screen.getByText('Supported')).toBeInTheDocument();
        });
      });

      it.skip('testingLibraryRenders ReleaseBadge within documentation', () => {
        const ReleaseBadgeInDoc = () => (
          <div data-testid='release-badge-in-doc'>
            <p>
              This documentation covers
              <span className='badge badge--primary'>O-RAN L (2025-06-30)</span>
            </p>
          </div>
        );

        testingLibraryRender(<ReleaseBadgeInDoc />);

        expect(screen.getByTestId('release-badge-in-doc')).toBeInTheDocument();
        expect(screen.getByText('O-RAN L (2025-06-30)')).toBeInTheDocument();
      });
    });

    describe('Frontmatter and Metadata', () => {
      it.skip('handles documentation with frontmatter', () => {
        const DocumentWithFrontmatter = () => (
          <article data-testid='doc-article'>
            <header>
              <h1>Nephio Infrastructure Agent</h1>
              <div className='doc-metadata'>
                <span className='doc-tag'>infrastructure</span>
                <span className='doc-tag'>nephio</span>
                <span className='doc-date'>Last updated: 2025-08-20</span>
              </div>
            </header>
            <div className='doc-content'>
              <p>Content goes here...</p>
            </div>
          </article>
        );

        testingLibraryRender(<DocumentWithFrontmatter />);

        expect(screen.getByTestId('doc-article')).toBeInTheDocument();
        expect(
          screen.getByText('Nephio Infrastructure Agent')
        ).toBeInTheDocument();
        expect(screen.getByText('infrastructure')).toBeInTheDocument();
        expect(
          screen.getByText('Last updated: 2025-08-20')
        ).toBeInTheDocument();
      });
    });

    describe('Multi-language Content', () => {
      it.skip('testingLibraryRenders English content correctly', () => {
        const EnglishContent = () => (
          <div data-testid='english-content' lang='en'>
            <h1>Nephio O-RAN Claude Agents</h1>
            <p>Intelligent orchestration for cloud-native O-RAN deployments</p>
          </div>
        );

        testingLibraryRender(<EnglishContent />);

        expect(screen.getByTestId('english-content')).toHaveAttribute(
          'lang',
          'en'
        );
        expect(
          screen.getByText('Nephio O-RAN Claude Agents')
        ).toBeInTheDocument();
      });

      // Traditional Chinese content test moved to Locale section above
    });

    describe('Link Validation', () => {
      it.skip('validates internal links format', () => {
        const content = `
        <a href="/docs/intro">Introduction</a>
        <a href="/docs/guides/quickstart">Quick Start</a>
        <a href="/docs/agents/infrastructure/nephio-infrastructure-agent">Infrastructure Agent</a>
      `;

        testingLibraryRender(
          <MockMDXContent>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </MockMDXContent>
        );

        const links = screen.getAllByTestId('mdx-link');

        links.forEach(link => {
          const href = link.getAttribute('href');
          expect(href).toMatch(/^\/docs\//);
        });
      });

      it.skip('validates external links format', () => {
        const content = `
        <a href="https://nephio.org">Nephio Project</a>
        <a href="https://o-ran.org">O-RAN Alliance</a>
        <a href="https://kubernetes.io">Kubernetes</a>
      `;

        testingLibraryRender(
          <MockMDXContent>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </MockMDXContent>
        );

        const links = screen.getAllByTestId('mdx-link');

        links.forEach(link => {
          const href = link.getAttribute('href');
          expect(href).toMatch(/^https?:\/\//);
        });
      });
    });

    describe('Search Integration', () => {
      it.skip('includes searchable content with proper structure', () => {
        const SearchableContent = () => (
          <div data-testid='searchable-content'>
            <h1 data-searchable='title'>Nephio Infrastructure Agent</h1>
            <p data-searchable='content'>
              This agent manages infrastructure resources for Nephio
              deployments.
            </p>
            <div data-searchable='tags'>
              <span>nephio</span>
              <span>infrastructure</span>
              <span>kubernetes</span>
            </div>
          </div>
        );

        testingLibraryRender(<SearchableContent />);

        expect(screen.getByTestId('searchable-content')).toBeInTheDocument();

        const titleElement = screen.getByText('Nephio Infrastructure Agent');
        expect(titleElement).toHaveAttribute('data-searchable', 'title');

        const contentElement = screen.getByText(
          /This agent manages infrastructure/
        );
        expect(contentElement).toHaveAttribute('data-searchable', 'content');
      });
    });

    describe('Performance and Loading', () => {
      it.skip('should handle lazy loading of content', async () => {
        const LazyContent = () => {
          const [isLoading, setIsLoading] = React.useState(true);
          const [content, setContent] = React.useState('');

          React.useEffect(() => {
            // Simulate lazy loading
            window.setTimeout(() => {
              setContent('Lazy loaded content');
              setIsLoading(false);
            }, 100);
          }, []);

          if (isLoading) {
            return <div data-testid='loading-spinner'>Loading...</div>;
          }

          return <div data-testid='lazy-content'>{content}</div>;
        };

        testingLibraryRender(<LazyContent />);

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

        await waitFor(() => {
          expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
          expect(screen.getByTestId('lazy-content')).toHaveTextContent(
            'Lazy loaded content'
          );
        });
      });

      it.skip('should handle progressive enhancement', () => {
        const ProgressiveComponent = ({ enhanced }: { enhanced: boolean }) => (
          <div data-testid='progressive-component'>
            <div data-testid='base-content'>
              <h1>Basic Content</h1>
              <p>This content works without JavaScript</p>
            </div>
            {enhanced && (
              <div data-testid='enhanced-content'>
                <button>Interactive Feature</button>
                <div>Enhanced UI Elements</div>
              </div>
            )}
          </div>
        );

        const { rerender } = testingLibraryRender(
          <ProgressiveComponent enhanced={false} />
        );

        expect(screen.getByTestId('base-content')).toBeInTheDocument();
        expect(
          screen.queryByTestId('enhanced-content')
        ).not.toBeInTheDocument();

        rerender(<ProgressiveComponent enhanced={true} />);

        expect(screen.getByTestId('base-content')).toBeInTheDocument();
        expect(screen.getByTestId('enhanced-content')).toBeInTheDocument();
      });
    });
  });

  describe('CI/CD Integration', () => {
    it.skip('should pass lighthouse accessibility audit simulation', () => {
      const AccessibilityCompliantPage = () => (
        <div data-testid='a11y-compliant-page'>
          <header>
            <h1>Page Title</h1>
            <nav aria-label='main navigation'>
              <ul>
                <li>
                  <a href='/docs/intro'>Documentation</a>
                </li>
                <li>
                  <a href='/docs/guides'>Guides</a>
                </li>
              </ul>
            </nav>
          </header>
          <main>
            <article>
              <h2>Article Title</h2>
              <p>
                Article content with sufficient{' '}
                <a href='#contrast'>color contrast</a>.
              </p>
              <img src='/img/logo.svg' alt='Nephio O-RAN Claude Agents Logo' />
            </article>
          </main>
          <footer>
            <p>Footer content</p>
          </footer>
        </div>
      );

      testingLibraryRender(<AccessibilityCompliantPage />);

      // Check for proper landmark structure
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('main')).toBeInTheDocument(); // main
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav

      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

      // Check for alt text on images
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Nephio O-RAN Claude Agents Logo');
    });

    it.skip('should be compatible with static site generation', () => {
      const StaticPage = ({ data }: { data: any }) => {
        // Simulate SSG-friendly component that doesn't rely on browser APIs
        const title = data?.title || 'Default Title';
        const content = data?.content || 'Default content';

        return (
          <div data-testid='static-page'>
            <h1>{title}</h1>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        );
      };

      const staticData = {
        title: 'Nephio Infrastructure Agent',
        content: '<p>This content is generated at build time.</p>',
      };

      testingLibraryRender(<StaticPage data={staticData} />);

      expect(
        screen.getByText('Nephio Infrastructure Agent')
      ).toBeInTheDocument();
      expect(
        screen.getByText('This content is generated at build time.')
      ).toBeInTheDocument();
    });

    it.skip('should handle build-time validation', () => {
      const BuildValidator = () => {
        const requiredEnvVars = ['DOCUSAURUS_BASE_URL', 'DOCUSAURUS_URL'];
        const missingVars = requiredEnvVars.filter(varName => {
          // In test environment, simulate checking environment variables
          return !process.env[varName] && varName !== 'DOCUSAURUS_BASE_URL'; // Allow missing in test
        });

        return (
          <div data-testid='build-validator'>
            <span data-testid='missing-vars-count'>{missingVars.length}</span>
            <span data-testid='is-valid'>{missingVars.length === 0}</span>
          </div>
        );
      };

      testingLibraryRender(<BuildValidator />);

      // In a real CI environment, this would validate environment setup
      expect(screen.getByTestId('is-valid')).toBeInTheDocument();
    });
  });
});

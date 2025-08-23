// Mock for Docusaurus modules
const React = require('react');

module.exports = {
  useDocusaurusContext: () => ({
    siteConfig: {
      title: 'Nephio O-RAN Claude Agents',
      tagline: 'AI-powered automation for telecommunications',
      url: 'https://thc1006.github.io',
      baseUrl: '/nephio-oran-claude-agents/',
      organizationName: 'thc1006',
      projectName: 'nephio-oran-claude-agents',
    },
    siteMetadata: {},
  }),
  useBaseUrl: (url) => `/nephio-oran-claude-agents${url}`,
  useBaseUrlUtils: () => ({
    withBaseUrl: (url) => `/nephio-oran-claude-agents${url}`,
  }),
  Redirect: ({ to }) => `Redirect to ${to}`,
  Head: ({ children }) => children,
  Link: React.forwardRef(({ to, children, ...props }, ref) => 
    React.createElement('a', { 
      ref,
      href: to, 
      'data-testid': 'home-link',
      ...props 
    }, children)),
  Layout: React.forwardRef(({ title, description, children, ...props }, ref) => 
    React.createElement('div', { 
      ref,
      'data-testid': 'layout',
      'data-title': title,
      'data-description': description,
      ...props 
    }, children)),
  NavbarItem: ({ children, ...props }) => 
    React.createElement('div', props, children),
  useColorMode: () => ({
    colorMode: 'light',
    setColorMode: jest.fn(),
  }),
  useThemeConfig: () => ({
    navbar: {
      title: 'Nephio O-RAN Claude Agents',
      items: [],
    },
    footer: {
      links: [],
    },
  }),
  usePrismTheme: () => ({}),
  useSearchPage: () => ({
    searchQuery: '',
    setSearchQuery: jest.fn(),
  }),
  interpolate: (message, values) => {
    let result = message;
    Object.keys(values || {}).forEach(key => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), values[key]);
    });
    return result;
  },
  translate: ({ message, id }) => message,
  ExecutionEnvironment: {
    canUseDOM: false,
    canUseEventListeners: false,
    canUseIntersectionObserver: false,
    canUseViewport: false,
  },
  // Router hooks
  useLocation: () => ({
    pathname: '/test-path',
    search: '',
    hash: '',
  }),
  useHistory: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
  }),
};

// For ES modules compatibility - export specific named exports
module.exports.default = module.exports;

// Export individual components for named imports and default exports
// For @theme/Layout
const Layout = module.exports.Layout;
Layout.default = Layout;
module.exports.Layout = Layout;

// For @docusaurus/Link  
const Link = module.exports.Link;
Link.default = Link;
module.exports.Link = Link;

// For router hooks
module.exports.useLocation = module.exports.useLocation;
module.exports.useHistory = module.exports.useHistory;
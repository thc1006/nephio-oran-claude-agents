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
  Link: ({ to, children, ...props }) => 
    React.createElement('a', { 
      href: to, 
      'data-testid': 'home-link',
      ...props 
    }, children),
  Layout: ({ title, description, children, ...props }) => 
    React.createElement('div', { 
      'data-testid': 'layout',
      'data-title': title,
      'data-description': description,
      ...props 
    }, children),
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

// For ES modules compatibility
module.exports.default = module.exports;
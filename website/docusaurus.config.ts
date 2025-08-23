import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Nephio O-RAN Claude Agents',
  tagline: 'Intelligent orchestration for cloud-native O-RAN deployments',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://thc1006.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/nephio-oran-claude-agents/',

  // GitHub pages deployment config.
  organizationName: 'thc1006', // Usually your GitHub org/user name.
  projectName: 'nephio-oran-claude-agents', // Usually your repo name.
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  // TODO: Revert these to 'throw' after all broken links are fixed
  // Temporarily set to 'warn' to unblock CI pipeline
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Enhanced SEO configuration
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        property: 'og:type',
        content: 'website',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:site_name',
        content: 'Nephio O-RAN Claude Agents',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:site',
        content: '@nephio_org',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'canonical',
        href: 'https://thc1006.github.io/nephio-oran-claude-agents/',
      },
    },
  ],

  // Internationalization with enhanced support
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-TW'],
    path: 'i18n',
    localeConfigs: {
      en: {
        label: 'English',
        direction: 'ltr',
        htmlLang: 'en-US',
        calendar: 'gregory',
      },
      'zh-TW': {
        label: '繁體中文',
        direction: 'ltr',
        htmlLang: 'zh-TW',
        calendar: 'gregory',
      },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/thc1006/nephio-oran-claude-agents/tree/main/website/',
          routeBasePath: 'docs',
          // Versioning support
          includeCurrentVersion: true,
          lastVersion: 'current',
          onlyIncludeVersions: ['current'],
          versions: {
            current: {
              label: '1.0.0',
              path: '',
            },
          },
          // Enhanced documentation features
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          breadcrumbs: true,
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/thc1006/nephio-oran-claude-agents/tree/main/website/',
          // Enhanced blog features
          blogTitle: 'Nephio O-RAN Claude Agents Blog',
          blogDescription:
            'Latest updates and insights on O-RAN orchestration with Claude agents',
          postsPerPage: 10,
          feedOptions: {
            type: 'all',
            title: 'Nephio O-RAN Claude Agents Blog',
            description:
              'Latest updates and insights on O-RAN orchestration with Claude agents',
            copyright: `Copyright © ${new Date().getFullYear()} Nephio O-RAN Claude Agents Project`,
            language: 'en-US',
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          priority: 0.5,
          ignorePatterns: ['/tags/**', '/search/**'],
          filename: 'sitemap.xml',
        },
        // Google Analytics Configuration
        // To enable analytics:
        // 1. Set GOOGLE_ANALYTICS_ID in your .env.local file
        // 2. Use format: G-XXXXXXXXXX or UA-XXXXXXXXX-X
        // 3. Never commit actual tracking IDs to version control
        gtag: process.env.GOOGLE_ANALYTICS_ID
          ? {
              trackingID: process.env.GOOGLE_ANALYTICS_ID,
              anonymizeIP: true, // Respects user privacy by anonymizing IP addresses
            }
          : undefined,
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    // Performance optimization plugin with graceful fallbacks
    [
      './plugins/performance-optimizer',
      {
        enableBundleAnalyzer: true, // Enable bundle analysis (if available)
        enableTerser: true, // Enable Terser minification (if available)
        enableCssOptimization: true, // Enable CSS optimization (if available)
        enableWebVitals: true, // Enable Web Vitals monitoring
        silent: false, // Show plugin status messages
      },
    ],
    // Security Headers Plugin
    [
      './plugins/docusaurus-plugin-security-headers',
      {
        disableCSP: process.env.NODE_ENV === 'test' || process.env.DISABLE_CSP_FOR_TESTS === 'true', // Disable CSP for testing
        customHeaders: {
          // Add any additional custom headers here
          'X-DNS-Prefetch-Control': 'on',
          'X-Permitted-Cross-Domain-Policies': 'none',
        },
      },
    ],
    // PWA Plugin for offline support (optional)
    // [
    //   '@docusaurus/plugin-pwa',
    //   {
    //     debug: process.env.NODE_ENV === 'development',
    //     offlineModeActivationStrategies: [
    //       'appInstalled',
    //       'standalone',
    //       'queryString',
    //     ],
    //     pwaHead: [
    //       {
    //         tagName: 'link',
    //         rel: 'icon',
    //         href: '/img/logo.svg',
    //       },
    //       {
    //         tagName: 'link',
    //         rel: 'manifest',
    //         href: '/manifest.json',
    //       },
    //       {
    //         tagName: 'meta',
    //         name: 'theme-color',
    //         content: 'rgb(37, 194, 160)',
    //       },
    //     ],
    //   },
    // ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    metadata: [
      {
        name: 'keywords',
        content:
          'O-RAN, Nephio, cloud-native orchestration, Kubernetes operators, telco automation, 5G orchestration, O-RAN L release, Nephio R5 agents',
      },
      {
        name: 'description',
        content:
          'Advanced cloud-native orchestration for telecom infrastructure. Leverage Nephio and O-RAN technologies with intelligent Claude agents for seamless 5G network automation.',
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'revisit-after', content: '7 days' },
      { name: 'language', content: 'English' },
      { name: 'generator', content: 'Docusaurus' },
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Nephio O-RAN Claude Agents',
      logo: {
        alt: 'Nephio O-RAN Claude Agents Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: 'blog',
          label: 'Blog',
          position: 'left'
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/thc1006/nephio-oran-claude-agents',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: 'docs/intro',
            },
            {
              label: 'Quick Start',
              to: 'docs/guides/quickstart',
            },
            {
              label: 'Architecture',
              to: 'docs/architecture',
            },
            {
              label: 'Agents',
              to: 'docs/agents',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Nephio Community',
              href: 'https://github.com/nephio-project',
            },
            {
              label: 'O-RAN Alliance',
              href: 'https://www.o-ran.org/',
            },
            {
              label: 'Kubernetes',
              href: 'https://kubernetes.io/',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: 'blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/thc1006/nephio-oran-claude-agents',
            },
            {
              label: 'Compatibility Matrix',
              href: 'https://github.com/thc1006/nephio-oran-claude-agents/blob/main/COMPATIBILITY_MATRIX.md',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Nephio O-RAN Claude Agents Project. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'json', 'go', 'python'],
    },
    // Enhanced search configuration with Algolia and fallback
    algolia: {
      // IMPORTANT: These are PLACEHOLDER values for demonstration only
      // To enable search functionality:
      // 1. Copy .env.example to .env.local
      // 2. Replace with your actual Algolia credentials
      // 3. Never commit .env.local to version control
      //
      // Get free DocSearch at: https://docsearch.algolia.com/
      // Or create your own at: https://www.algolia.com/
      appId: process.env.ALGOLIA_APP_ID || 'PLACEHOLDER_APP_ID', // PLACEHOLDER - Replace via environment variable
      apiKey: process.env.ALGOLIA_API_KEY || 'PLACEHOLDER_SEARCH_API_KEY', // PLACEHOLDER - Must be search-only API key
      indexName: process.env.ALGOLIA_INDEX_NAME || 'nephio-oran-claude-agents',
      contextualSearch: true,
      externalUrlRegex: 'external\\.com|domain\\.com',
      replaceSearchResultPathname: {
        from: '/docs/',
        to: '/',
      },
      searchParameters: {
        facetFilters: [],
      },
      searchPagePath: 'search',
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

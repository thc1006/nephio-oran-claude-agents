import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  docsSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'guides/quickstart',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
      ],
    },
    {
      type: 'category',
      label: 'Agents',
      collapsed: false,
      items: [
        'agents/orchestrator-agent',
        'agents/comparison-matrix',
        {
          type: 'category',
          label: 'Infrastructure & Platform',
          collapsed: true,
          items: [
            'infrastructure/nephio-infrastructure-agent',
            'infrastructure/oran-nephio-dep-doctor-agent',
          ],
        },
        {
          type: 'category',
          label: 'Network Functions',
          collapsed: true,
          items: [
            'network-functions/oran-network-functions-agent',
          ],
        },
        {
          type: 'category',
          label: 'Configuration & Management',
          collapsed: true,
          items: [
            'config-management/configuration-management-agent',
          ],
        },
        {
          type: 'category',
          label: 'Operations & Monitoring',
          collapsed: true,
          items: [
            'monitoring/monitoring-analytics-agent',
            'analytics/data-analytics-agent',
            'performance/performance-optimization-agent',
          ],
        },
        {
          type: 'category',
          label: 'Security & Testing',
          collapsed: true,
          items: [
            'security/security-compliance-agent',
            'testing/testing-validation-agent',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Integration',
      collapsed: true,
      items: [
        'integration/deployment-workflows',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      collapsed: true,
      items: [
        'api-reference/overview',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      items: [
        'examples/enterprise-5g-deployment',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      collapsed: true,
      items: [
        'troubleshooting/index',
      ],
    },
  ],
};

export default sidebars;
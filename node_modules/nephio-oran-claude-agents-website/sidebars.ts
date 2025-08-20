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
      label: 'Orchestration',
      collapsed: true,
      items: [
        'orchestration/nephio-oran-orchestrator-agent',
      ],
    },
    {
      type: 'category',
      label: 'Infrastructure',
      collapsed: true,
      items: [
        'infrastructure/nephio-infrastructure-agent',
        'infrastructure/oran-nephio-dep-doctor-agent',
      ],
    },
    {
      type: 'category',
      label: 'Monitoring',
      collapsed: true,
      items: [
        'monitoring/monitoring-analytics-agent',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      collapsed: true,
      items: [
        'security/security-compliance-agent',
      ],
    },
    {
      type: 'category',
      label: 'Performance',
      collapsed: true,
      items: [
        'performance/performance-optimization-agent',
      ],
    },
    {
      type: 'category',
      label: 'Testing',
      collapsed: true,
      items: [
        'testing/testing-validation-agent',
      ],
    },
    {
      type: 'category',
      label: 'Data & Analytics',
      collapsed: true,
      items: [
        'analytics/data-analytics-agent',
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
      label: 'Configuration Management',
      collapsed: true,
      items: [
        'config-management/configuration-management-agent',
      ],
    },
  ],
};

export default sidebars;
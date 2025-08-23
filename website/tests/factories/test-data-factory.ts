/**
 * Test Data Factory for Nephio O-RAN Claude Agents
 * Provides consistent test data generation and mocking utilities
 */

import { faker } from '@faker-js/faker';

export interface AgentData {
  id: string;
  name: string;
  description: string;
  model: 'haiku' | 'sonnet' | 'opus';
  capabilities: string[];
  dependencies: string[];
  examples: AgentExample[];
  metadata: AgentMetadata;
}

export interface AgentExample {
  name: string;
  input: string;
  expectedOutput: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: number; // in seconds
}

export interface AgentMetadata {
  version: string;
  author: string;
  lastUpdated: string;
  category: string;
  tags: string[];
  status: 'active' | 'deprecated' | 'experimental';
}

export interface CompatibilityEntry {
  component: string;
  version: string;
  status: 'supported' | 'experimental' | 'deprecated' | 'unsupported';
  notes: string;
  lastTested: string;
}

export interface WorkflowScenario {
  name: string;
  steps: WorkflowStep[];
  expectedOutcome: string;
  prerequisites: string[];
  validationCriteria: ValidationCriteria[];
}

export interface WorkflowStep {
  action: string;
  target: string;
  parameters: Record<string, any>;
  expectedResult: string;
}

export interface ValidationCriteria {
  type: 'presence' | 'content' | 'structure' | 'performance';
  selector: string;
  expected: string | number | boolean;
  tolerance?: number;
}

/**
 * Factory class for generating test data
 */
export class TestDataFactory {
  // Seed faker for consistent test data
  static seed(value: number = 12345) {
    faker.seed(value);
  }

  /**
   * Generate a complete agent data structure
   */
  static createAgent(overrides: Partial<AgentData> = {}): AgentData {
    const categories = [
      'infrastructure', 'configuration', 'monitoring', 'security', 
      'orchestration', 'analytics', 'performance', 'testing'
    ];
    
    const models: Array<'haiku' | 'sonnet' | 'opus'> = ['haiku', 'sonnet', 'opus'];
    const category = faker.helpers.arrayElement(categories);
    
    const baseAgent: AgentData = {
      id: `${category}-agent-${faker.string.alphanumeric(8)}`,
      name: `${faker.company.name()} ${category.charAt(0).toUpperCase() + category.slice(1)} Agent`,
      description: faker.lorem.paragraph(2),
      model: faker.helpers.arrayElement(models),
      capabilities: this.generateCapabilities(category),
      dependencies: this.generateDependencies(),
      examples: this.generateExamples(3),
      metadata: this.createAgentMetadata(category),
    };

    return { ...baseAgent, ...overrides };
  }

  /**
   * Generate realistic agent capabilities based on category
   */
  private static generateCapabilities(category: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      infrastructure: [
        'Cluster provisioning and management',
        'Resource allocation and optimization',
        'Network function deployment',
        'Edge computing setup',
        'Container orchestration'
      ],
      configuration: [
        'YANG model validation',
        'Configuration template generation',
        'Infrastructure as Code management',
        'Configuration drift detection',
        'Compliance verification'
      ],
      monitoring: [
        'Real-time performance monitoring',
        'Alert and notification management',
        'Metrics collection and analysis',
        'Dashboard creation',
        'Log aggregation'
      ],
      security: [
        'Security policy enforcement',
        'Vulnerability scanning',
        'Access control management',
        'Compliance auditing',
        'Threat detection'
      ],
      orchestration: [
        'Service lifecycle management',
        'Workflow automation',
        'Multi-cluster coordination',
        'GitOps integration',
        'CI/CD pipeline management'
      ],
      analytics: [
        'Data processing and analysis',
        'Machine learning model deployment',
        'Predictive analytics',
        'Report generation',
        'Data visualization'
      ],
      performance: [
        'Performance optimization',
        'Resource efficiency analysis',
        'Bottleneck identification',
        'Scalability assessment',
        'Load testing'
      ],
      testing: [
        'Automated test execution',
        'Test case generation',
        'Coverage analysis',
        'Integration testing',
        'Performance benchmarking'
      ]
    };

    const capabilities = capabilityMap[category] || [
      'Generic capability 1',
      'Generic capability 2',
      'Generic capability 3'
    ];

    return faker.helpers.arrayElements(capabilities, { min: 3, max: 5 });
  }

  /**
   * Generate realistic dependencies for agents
   */
  private static generateDependencies(): string[] {
    const commonDependencies = [
      'kubernetes', 'kubectl', 'helm', 'docker', 'containerd',
      'nephio', 'kpt', 'argocd', 'prometheus', 'grafana',
      'istio', 'envoy', 'flannel', 'calico', 'cilium'
    ];

    return faker.helpers.arrayElements(commonDependencies, { min: 2, max: 4 });
  }

  /**
   * Generate agent examples
   */
  private static generateExamples(count: number): AgentExample[] {
    const examples: AgentExample[] = [];
    const complexities: Array<'simple' | 'medium' | 'complex'> = ['simple', 'medium', 'complex'];

    for (let i = 0; i < count; i++) {
      const complexity = faker.helpers.arrayElement(complexities);
      const timeMultiplier = { simple: 1, medium: 3, complex: 6 }[complexity];

      examples.push({
        name: faker.hacker.phrase(),
        input: faker.lorem.sentence(),
        expectedOutput: faker.lorem.paragraph(),
        complexity,
        estimatedTime: faker.number.int({ min: 30, max: 300 }) * timeMultiplier
      });
    }

    return examples;
  }

  /**
   * Create agent metadata
   */
  private static createAgentMetadata(category: string): AgentMetadata {
    const statuses: Array<'active' | 'deprecated' | 'experimental'> = ['active', 'deprecated', 'experimental'];
    
    return {
      version: `${faker.number.int({ min: 1, max: 3 })}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 9 })}`,
      author: faker.internet.userName(),
      lastUpdated: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
      category,
      tags: [
        category,
        'nephio',
        'o-ran',
        faker.hacker.noun(),
        faker.hacker.abbreviation().toLowerCase()
      ],
      status: faker.helpers.arrayElement(statuses)
    };
  }

  /**
   * Generate compatibility matrix entries
   */
  static createCompatibilityEntries(count: number): CompatibilityEntry[] {
    const entries: CompatibilityEntry[] = [];
    
    const components = [
      'Kubernetes', 'Go Runtime', 'Python Runtime', 'Node.js',
      'O-RAN L-Release', 'Nephio', 'kpt', 'Istio Service Mesh',
      'Prometheus', 'Grafana', 'ArgoCD', 'Helm', 'Docker', 'containerd'
    ];

    const statuses: Array<'supported' | 'experimental' | 'deprecated' | 'unsupported'> = 
      ['supported', 'experimental', 'deprecated', 'unsupported'];

    for (let i = 0; i < count; i++) {
      const component = faker.helpers.arrayElement(components);
      const status = faker.helpers.arrayElement(statuses);
      
      entries.push({
        component,
        version: this.generateVersionString(component),
        status,
        notes: this.generateCompatibilityNotes(component, status),
        lastTested: faker.date.recent({ days: 90 }).toISOString().split('T')[0]
      });
    }

    return entries;
  }

  /**
   * Generate realistic version strings
   */
  private static generateVersionString(component: string): string {
    const versionPatterns: Record<string, () => string> = {
      'Kubernetes': () => `1.${faker.number.int({ min: 25, max: 30 })}.x`,
      'Go Runtime': () => `1.${faker.number.int({ min: 19, max: 22 })}.${faker.number.int({ min: 0, max: 9 })}`,
      'Python Runtime': () => `3.${faker.number.int({ min: 9, max: 12 })}.x`,
      'Node.js': () => `${faker.number.int({ min: 16, max: 20 })}.x LTS`,
      'O-RAN L-Release': () => '2025-06-30',
      'Nephio': () => `R${faker.number.int({ min: 3, max: 6 })} (v${faker.number.int({ min: 3, max: 6 })}.x)`,
      'kpt': () => `v1.0.0-beta.${faker.number.int({ min: 50, max: 60 })}`,
      default: () => `${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({ min: 0, max: 20 })}.x`
    };

    return (versionPatterns[component] || versionPatterns.default)();
  }

  /**
   * Generate compatibility notes
   */
  private static generateCompatibilityNotes(component: string, status: string): string {
    const noteTemplates: Record<string, string[]> = {
      supported: [
        `Fully supported for production workloads`,
        `Recommended version for ${component.toLowerCase()} deployments`,
        `Production-ready with comprehensive testing`,
        `Active support and regular updates available`
      ],
      experimental: [
        `Experimental support - use with caution`,
        `Limited testing in production environments`,
        `Preview version with potential breaking changes`,
        `Community feedback and testing encouraged`
      ],
      deprecated: [
        `Deprecated - upgrade recommended within 6 months`,
        `End of support scheduled for next major release`,
        `Security patches only - no new features`,
        `Migration guide available for newer versions`
      ],
      unsupported: [
        `No longer supported - immediate upgrade required`,
        `Known security vulnerabilities - do not use`,
        `Compatibility not guaranteed`,
        `Consider alternative solutions`
      ]
    };

    const templates = noteTemplates[status] || noteTemplates.supported;
    return faker.helpers.arrayElement(templates);
  }

  /**
   * Create workflow test scenarios
   */
  static createWorkflowScenario(overrides: Partial<WorkflowScenario> = {}): WorkflowScenario {
    const baseScenario: WorkflowScenario = {
      name: `${faker.hacker.verb()} ${faker.hacker.noun()} workflow`,
      steps: this.generateWorkflowSteps(),
      expectedOutcome: faker.lorem.sentence(),
      prerequisites: [
        'Valid Kubernetes cluster',
        'Nephio installation',
        'Required CLI tools installed'
      ],
      validationCriteria: this.generateValidationCriteria()
    };

    return { ...baseScenario, ...overrides };
  }

  /**
   * Generate workflow steps
   */
  private static generateWorkflowSteps(count: number = 5): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    
    const actions = [
      'navigate', 'click', 'input', 'select', 'verify', 'wait', 'scroll', 'hover'
    ];

    const targets = [
      'agent-selector', 'configuration-form', 'submit-button', 
      'results-panel', 'status-indicator', 'error-message'
    ];

    for (let i = 0; i < count; i++) {
      steps.push({
        action: faker.helpers.arrayElement(actions),
        target: faker.helpers.arrayElement(targets),
        parameters: {
          timeout: faker.number.int({ min: 1000, max: 10000 }),
          value: faker.lorem.word(),
          selector: `[data-testid="${faker.lorem.word()}"]`
        },
        expectedResult: faker.lorem.sentence()
      });
    }

    return steps;
  }

  /**
   * Generate validation criteria
   */
  private static generateValidationCriteria(count: number = 3): ValidationCriteria[] {
    const criteria: ValidationCriteria[] = [];
    
    const types: Array<'presence' | 'content' | 'structure' | 'performance'> = 
      ['presence', 'content', 'structure', 'performance'];

    for (let i = 0; i < count; i++) {
      const type = faker.helpers.arrayElement(types);
      
      criteria.push({
        type,
        selector: `[data-testid="${faker.lorem.word()}"]`,
        expected: this.generateExpectedValue(type),
        tolerance: type === 'performance' ? faker.number.int({ min: 100, max: 1000 }) : undefined
      });
    }

    return criteria;
  }

  /**
   * Generate expected values based on criteria type
   */
  private static generateExpectedValue(type: string): string | number | boolean {
    switch (type) {
      case 'presence':
        return true;
      case 'content':
        return faker.lorem.sentence();
      case 'structure':
        return faker.helpers.arrayElement(['visible', 'enabled', 'focused']);
      case 'performance':
        return faker.number.int({ min: 500, max: 3000 });
      default:
        return faker.lorem.word();
    }
  }

  /**
   * Create mock API responses
   */
  static createMockApiResponse<T>(data: T, overrides: Partial<{
    status: number;
    message: string;
    timestamp: string;
    requestId: string;
  }> = {}) {
    return {
      status: overrides.status || 200,
      message: overrides.message || 'Success',
      data,
      timestamp: overrides.timestamp || new Date().toISOString(),
      requestId: overrides.requestId || faker.string.uuid(),
      ...overrides
    };
  }

  /**
   * Create performance test data
   */
  static createPerformanceMetrics() {
    return {
      loadTime: faker.number.int({ min: 500, max: 3000 }),
      firstContentfulPaint: faker.number.int({ min: 200, max: 1500 }),
      largestContentfulPaint: faker.number.int({ min: 800, max: 2500 }),
      cumulativeLayoutShift: faker.number.float({ min: 0, max: 0.25, precision: 0.001 }),
      firstInputDelay: faker.number.int({ min: 10, max: 300 }),
      totalBlockingTime: faker.number.int({ min: 50, max: 600 }),
      timeToInteractive: faker.number.int({ min: 1000, max: 5000 }),
      bundleSize: faker.number.int({ min: 100000, max: 2000000 }), // bytes
      resourceCount: faker.number.int({ min: 10, max: 100 }),
      memoryUsage: faker.number.int({ min: 10000000, max: 100000000 }) // bytes
    };
  }

  /**
   * Create security test scenarios
   */
  static createSecurityTestScenarios() {
    return {
      xssPayloads: [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '"><script>alert("xss")</script>',
        'onload=alert("xss")',
        '<svg onload=alert("xss")>',
        'data:text/html,<script>alert("xss")</script>'
      ],
      sqlInjectionPayloads: [
        "' OR '1'='1",
        "'; DROP TABLE users;--",
        "' UNION SELECT * FROM users--",
        "admin'--",
        "' OR 1=1--"
      ],
      malformedUrls: [
        '/docs/../../../etc/passwd',
        '/docs/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '/docs/..\\..\\..\\windows\\system32\\config\\sam',
        '//evil.com/redirect',
        '/docs?redirect=javascript:alert("xss")'
      ],
      csrfScenarios: [
        {
          name: 'Form submission without token',
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'action=delete&id=1'
        }
      ]
    };
  }

  /**
   * Create accessibility test scenarios
   */
  static createAccessibilityTestScenarios() {
    return {
      keyboardNavigation: [
        'Tab through all interactive elements',
        'Use Enter to activate buttons',
        'Use Space to check checkboxes',
        'Use arrow keys for radio groups',
        'Use Escape to close modals'
      ],
      screenReaderTests: [
        'All images have alt text or aria-label',
        'Form inputs have associated labels',
        'Headings follow logical hierarchy',
        'Links have descriptive text',
        'Error messages are announced'
      ],
      colorContrastTests: [
        'Text meets WCAG AA standards (4.5:1)',
        'Large text meets WCAG AA standards (3:1)',
        'Interactive elements are distinguishable',
        'Focus indicators are visible',
        'Error states are not color-only'
      ],
      motionTests: [
        'Respect prefers-reduced-motion',
        'Provide animation controls',
        'Avoid auto-playing content',
        'Limit flashing content',
        'Provide static alternatives'
      ]
    };
  }

  /**
   * Reset faker seed for reproducible tests
   */
  static resetSeed() {
    faker.seed(12345);
  }

  /**
   * Generate random seed for varied test data
   */
  static randomSeed() {
    faker.seed(Date.now());
  }
}

/**
 * Test data presets for common scenarios
 */
export const TestDataPresets = {
  // Common agent configurations
  configurationAgent: () => TestDataFactory.createAgent({
    id: 'configuration-management-agent',
    name: 'Configuration Management Agent',
    model: 'sonnet',
    capabilities: [
      'YANG model validation',
      'Infrastructure as Code management',
      'Configuration drift detection'
    ]
  }),

  infrastructureAgent: () => TestDataFactory.createAgent({
    id: 'nephio-infrastructure-agent',
    name: 'Nephio Infrastructure Agent',
    model: 'sonnet',
    capabilities: [
      'Cluster provisioning',
      'Network function deployment',
      'Resource optimization'
    ]
  }),

  // Performance benchmarks
  goodPerformance: () => ({
    loadTime: 800,
    firstContentfulPaint: 400,
    largestContentfulPaint: 1200,
    cumulativeLayoutShift: 0.05,
    firstInputDelay: 50,
    score: 95
  }),

  poorPerformance: () => ({
    loadTime: 5000,
    firstContentfulPaint: 2000,
    largestContentfulPaint: 4000,
    cumulativeLayoutShift: 0.4,
    firstInputDelay: 500,
    score: 45
  }),

  // Security test payloads
  basicXssPayloads: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src="x" onerror="alert(\'xss\')">'
  ],

  // Accessibility violations
  commonA11yViolations: [
    'Missing alt text on images',
    'Insufficient color contrast',
    'Missing form labels',
    'Improper heading hierarchy',
    'Missing keyboard navigation'
  ]
};

export default TestDataFactory;
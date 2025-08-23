/**
 * Tests for siteConfig.ts - Site configuration constants
 * 
 * This test suite verifies all exported constants, helpers, and types
 * to ensure they meet expected values and formats.
 */

import {
  // Version constants
  GO_VERSION,
  ORAN_L_RELEASE,
  NEPHIO_VERSION,
  KPT_VERSION,
  K8S_POLICY,
  DOCUSAURUS_VERSION,
  KUBERNETES_MIN_VERSION,
  KUBERNETES_RECOMMENDED_VERSION,
  
  // O-RAN specific constants
  ORAN_ALLIANCE_RELEASE,
  ORAN_SMO_VERSION,
  ORAN_DU_VERSION,
  ORAN_CU_VERSION,
  ORAN_RIC_VERSION,
  
  // Nephio specific constants
  NEPHIO_GITOPS_MODE,
  NEPHIO_PACKAGE_ORCHESTRATION,
  NEPHIO_CONFIG_AS_DATA,
  
  // Claude Agents specific constants
  CLAUDE_API_VERSION,
  AGENT_FRAMEWORK_VERSION,
  SUPPORTED_LANGUAGES,
  
  // Deployment constants
  DEPLOYMENT_TARGET,
  CONTAINER_RUNTIME,
  SERVICE_MESH,
  MONITORING_STACK,
  
  // Security and Compliance
  FIPS_COMPLIANCE,
  SECURITY_FRAMEWORK,
  RBAC_ENABLED,
  TLS_VERSION,
  
  // Documentation metadata
  LAST_UPDATED,
  DOCUMENTATION_VERSION,
  LICENSE,
  
  // Version display helpers
  VERSION_DISPLAY,
  
  // URLs and endpoints
  GITHUB_REPO_URL,
  NEPHIO_DOCS_URL,
  ORAN_DOCS_URL,
  CLAUDE_DOCS_URL,
  
  // Feature flags
  FEATURES,
  
  // Agent categories and deployment environments
  AGENT_CATEGORIES,
  DEPLOYMENT_ENVIRONMENTS,
  
  // Types
  type AgentCategory,
  type DeploymentEnvironment,
} from '../../src/data/siteConfig';

describe('siteConfig', () => {
  describe('Version Constants', () => {
    it('should export correct Go version', () => {
      expect(GO_VERSION).toBe('1.24.6');
      expect(typeof GO_VERSION).toBe('string');
      expect(GO_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should export correct O-RAN L-Release date', () => {
      expect(ORAN_L_RELEASE).toBe('2025-06-30');
      expect(typeof ORAN_L_RELEASE).toBe('string');
      expect(ORAN_L_RELEASE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should export correct Nephio version', () => {
      expect(NEPHIO_VERSION).toBe('R5 (v5.x)');
      expect(typeof NEPHIO_VERSION).toBe('string');
    });

    it('should export correct KPT version', () => {
      expect(KPT_VERSION).toBe('v1.0.0-beta.55');
      expect(typeof KPT_VERSION).toBe('string');
      expect(KPT_VERSION).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should export correct Kubernetes policy', () => {
      expect(K8S_POLICY).toBe('latest three minor releases');
      expect(typeof K8S_POLICY).toBe('string');
    });

    it('should export correct Docusaurus version', () => {
      expect(DOCUSAURUS_VERSION).toBe('3.5.2');
      expect(typeof DOCUSAURUS_VERSION).toBe('string');
      expect(DOCUSAURUS_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should export correct Kubernetes versions', () => {
      expect(KUBERNETES_MIN_VERSION).toBe('1.26.0');
      expect(KUBERNETES_RECOMMENDED_VERSION).toBe('1.30.0');
      expect(typeof KUBERNETES_MIN_VERSION).toBe('string');
      expect(typeof KUBERNETES_RECOMMENDED_VERSION).toBe('string');
      expect(KUBERNETES_MIN_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
      expect(KUBERNETES_RECOMMENDED_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('O-RAN Specific Constants', () => {
    it('should export correct O-RAN Alliance release', () => {
      expect(ORAN_ALLIANCE_RELEASE).toBe('L-Release');
      expect(typeof ORAN_ALLIANCE_RELEASE).toBe('string');
    });

    it('should export correct O-RAN component versions', () => {
      expect(ORAN_SMO_VERSION).toBe('2.0.0');
      expect(ORAN_DU_VERSION).toBe('2.0.0');
      expect(ORAN_CU_VERSION).toBe('2.0.0');
      expect(ORAN_RIC_VERSION).toBe('H-Release');
      
      expect(typeof ORAN_SMO_VERSION).toBe('string');
      expect(typeof ORAN_DU_VERSION).toBe('string');
      expect(typeof ORAN_CU_VERSION).toBe('string');
      expect(typeof ORAN_RIC_VERSION).toBe('string');
    });
  });

  describe('Nephio Specific Constants', () => {
    it('should export correct Nephio configuration', () => {
      expect(NEPHIO_GITOPS_MODE).toBe('GitOps');
      expect(NEPHIO_PACKAGE_ORCHESTRATION).toBe('Enabled');
      expect(NEPHIO_CONFIG_AS_DATA).toBe('KPT');
      
      expect(typeof NEPHIO_GITOPS_MODE).toBe('string');
      expect(typeof NEPHIO_PACKAGE_ORCHESTRATION).toBe('string');
      expect(typeof NEPHIO_CONFIG_AS_DATA).toBe('string');
    });
  });

  describe('Claude Agents Specific Constants', () => {
    it('should export correct Claude API version', () => {
      expect(CLAUDE_API_VERSION).toBe('2023-06-01');
      expect(typeof CLAUDE_API_VERSION).toBe('string');
      expect(CLAUDE_API_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should export correct agent framework version', () => {
      expect(AGENT_FRAMEWORK_VERSION).toBe('1.0.0');
      expect(typeof AGENT_FRAMEWORK_VERSION).toBe('string');
      expect(AGENT_FRAMEWORK_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should export supported languages array', () => {
      expect(SUPPORTED_LANGUAGES).toEqual(['Python', 'Go', 'TypeScript']);
      expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true);
      expect(SUPPORTED_LANGUAGES).toHaveLength(3);
      expect(SUPPORTED_LANGUAGES).toContain('Python');
      expect(SUPPORTED_LANGUAGES).toContain('Go');
      expect(SUPPORTED_LANGUAGES).toContain('TypeScript');
    });
  });

  describe('Deployment Constants', () => {
    it('should export correct deployment configuration', () => {
      expect(DEPLOYMENT_TARGET).toBe('Kubernetes');
      expect(CONTAINER_RUNTIME).toBe('containerd');
      expect(SERVICE_MESH).toBe('Istio');
      expect(MONITORING_STACK).toBe('Prometheus + Grafana');
      
      expect(typeof DEPLOYMENT_TARGET).toBe('string');
      expect(typeof CONTAINER_RUNTIME).toBe('string');
      expect(typeof SERVICE_MESH).toBe('string');
      expect(typeof MONITORING_STACK).toBe('string');
    });
  });

  describe('Security and Compliance Constants', () => {
    it('should export correct security configuration', () => {
      expect(FIPS_COMPLIANCE).toBe('FIPS 140-3');
      expect(SECURITY_FRAMEWORK).toBe('NIST Cybersecurity Framework');
      expect(RBAC_ENABLED).toBe(true);
      expect(TLS_VERSION).toBe('1.3');
      
      expect(typeof FIPS_COMPLIANCE).toBe('string');
      expect(typeof SECURITY_FRAMEWORK).toBe('string');
      expect(typeof RBAC_ENABLED).toBe('boolean');
      expect(typeof TLS_VERSION).toBe('string');
    });
  });

  describe('Documentation Metadata', () => {
    it('should export correct documentation metadata', () => {
      expect(LAST_UPDATED).toBe('2025-08-20');
      expect(DOCUMENTATION_VERSION).toBe('1.0.0');
      expect(LICENSE).toBe('Apache 2.0');
      
      expect(typeof LAST_UPDATED).toBe('string');
      expect(typeof DOCUMENTATION_VERSION).toBe('string');
      expect(typeof LICENSE).toBe('string');
      
      expect(LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(DOCUMENTATION_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Version Display Helpers', () => {
    it('should export VERSION_DISPLAY object with correct format', () => {
      expect(typeof VERSION_DISPLAY).toBe('object');
      expect(VERSION_DISPLAY).toBeDefined();
    });

    it('should format Go version correctly', () => {
      expect(VERSION_DISPLAY.GO).toBe(`Go ${GO_VERSION}`);
      expect(VERSION_DISPLAY.GO).toBe('Go 1.24.6');
    });

    it('should format O-RAN version correctly', () => {
      expect(VERSION_DISPLAY.ORAN).toBe(`O-RAN L (${ORAN_L_RELEASE})`);
      expect(VERSION_DISPLAY.ORAN).toBe('O-RAN L (2025-06-30)');
    });

    it('should format Nephio version correctly', () => {
      expect(VERSION_DISPLAY.NEPHIO).toBe(`Nephio ${NEPHIO_VERSION}`);
      expect(VERSION_DISPLAY.NEPHIO).toBe('Nephio R5 (v5.x)');
    });

    it('should format KPT version correctly', () => {
      expect(VERSION_DISPLAY.KPT).toBe(`kpt ${KPT_VERSION}`);
      expect(VERSION_DISPLAY.KPT).toBe('kpt v1.0.0-beta.55');
    });

    it('should format Kubernetes version correctly', () => {
      expect(VERSION_DISPLAY.KUBERNETES).toBe(`Kubernetes ${KUBERNETES_RECOMMENDED_VERSION}+`);
      expect(VERSION_DISPLAY.KUBERNETES).toBe('Kubernetes 1.30.0+');
    });

    it('should be readonly', () => {
      // This tests the 'as const' assertion
      const versionDisplay: typeof VERSION_DISPLAY = VERSION_DISPLAY;
      expect(versionDisplay).toBe(VERSION_DISPLAY);
    });
  });

  describe('URLs and Endpoints', () => {
    it('should export valid GitHub repository URL', () => {
      expect(GITHUB_REPO_URL).toBe('https://github.com/thc1006/nephio-oran-claude-agents');
      expect(typeof GITHUB_REPO_URL).toBe('string');
      expect(GITHUB_REPO_URL).toMatch(/^https?:\/\//);
      expect(GITHUB_REPO_URL).toContain('github.com');
    });

    it('should export valid documentation URLs', () => {
      expect(NEPHIO_DOCS_URL).toBe('https://docs.nephio.org/');
      expect(ORAN_DOCS_URL).toBe('https://docs.o-ran-sc.org/');
      expect(CLAUDE_DOCS_URL).toBe('https://docs.anthropic.com/');
      
      expect(typeof NEPHIO_DOCS_URL).toBe('string');
      expect(typeof ORAN_DOCS_URL).toBe('string');
      expect(typeof CLAUDE_DOCS_URL).toBe('string');
      
      expect(NEPHIO_DOCS_URL).toMatch(/^https?:\/\//);
      expect(ORAN_DOCS_URL).toMatch(/^https?:\/\//);
      expect(CLAUDE_DOCS_URL).toMatch(/^https?:\/\//);
    });
  });

  describe('Feature Flags', () => {
    it('should export FEATURES object with correct structure', () => {
      expect(typeof FEATURES).toBe('object');
      expect(FEATURES).toBeDefined();
    });

    it('should have correct feature flag values', () => {
      expect(FEATURES.MULTI_LANGUAGE_SUPPORT).toBe(true);
      expect(FEATURES.DARK_MODE).toBe(true);
      expect(FEATURES.SEARCH_ENABLED).toBe(true);
      expect(FEATURES.ANALYTICS_ENABLED).toBe(false);
      expect(FEATURES.ALGOLIA_SEARCH).toBe(false);
      expect(FEATURES.INTERNATIONALIZATION).toBe(true);
      
      expect(typeof FEATURES.MULTI_LANGUAGE_SUPPORT).toBe('boolean');
      expect(typeof FEATURES.DARK_MODE).toBe('boolean');
      expect(typeof FEATURES.SEARCH_ENABLED).toBe('boolean');
      expect(typeof FEATURES.ANALYTICS_ENABLED).toBe('boolean');
      expect(typeof FEATURES.ALGOLIA_SEARCH).toBe('boolean');
      expect(typeof FEATURES.INTERNATIONALIZATION).toBe('boolean');
    });

    it('should be readonly', () => {
      // This tests the 'as const' assertion
      const features: typeof FEATURES = FEATURES;
      expect(features).toBe(FEATURES);
    });
  });

  describe('Agent Categories', () => {
    it('should export AGENT_CATEGORIES array with correct values', () => {
      expect(Array.isArray(AGENT_CATEGORIES)).toBe(true);
      expect(AGENT_CATEGORIES).toHaveLength(7);
      
      const expectedCategories = [
        'Orchestration Agents',
        'Infrastructure Agents',
        'Monitoring & Analytics Agents',
        'Security & Compliance Agents',
        'Network Functions Agents',
        'Testing & Validation Agents',
        'Configuration Management Agents',
      ];
      
      expect(AGENT_CATEGORIES).toEqual(expectedCategories);
    });

    it('should contain specific category types', () => {
      expect(AGENT_CATEGORIES).toContain('Orchestration Agents');
      expect(AGENT_CATEGORIES).toContain('Infrastructure Agents');
      expect(AGENT_CATEGORIES).toContain('Monitoring & Analytics Agents');
      expect(AGENT_CATEGORIES).toContain('Security & Compliance Agents');
      expect(AGENT_CATEGORIES).toContain('Network Functions Agents');
      expect(AGENT_CATEGORIES).toContain('Testing & Validation Agents');
      expect(AGENT_CATEGORIES).toContain('Configuration Management Agents');
    });

    it('should be readonly', () => {
      // This tests the 'as const' assertion
      const categories: typeof AGENT_CATEGORIES = AGENT_CATEGORIES;
      expect(categories).toBe(AGENT_CATEGORIES);
    });
  });

  describe('Deployment Environments', () => {
    it('should export DEPLOYMENT_ENVIRONMENTS array with correct values', () => {
      expect(Array.isArray(DEPLOYMENT_ENVIRONMENTS)).toBe(true);
      expect(DEPLOYMENT_ENVIRONMENTS).toHaveLength(5);
      
      const expectedEnvironments = [
        'Development',
        'Staging',
        'Production',
        'Edge',
        'Multi-Cloud',
      ];
      
      expect(DEPLOYMENT_ENVIRONMENTS).toEqual(expectedEnvironments);
    });

    it('should contain specific environment types', () => {
      expect(DEPLOYMENT_ENVIRONMENTS).toContain('Development');
      expect(DEPLOYMENT_ENVIRONMENTS).toContain('Staging');
      expect(DEPLOYMENT_ENVIRONMENTS).toContain('Production');
      expect(DEPLOYMENT_ENVIRONMENTS).toContain('Edge');
      expect(DEPLOYMENT_ENVIRONMENTS).toContain('Multi-Cloud');
    });

    it('should be readonly', () => {
      // This tests the 'as const' assertion
      const environments: typeof DEPLOYMENT_ENVIRONMENTS = DEPLOYMENT_ENVIRONMENTS;
      expect(environments).toBe(DEPLOYMENT_ENVIRONMENTS);
    });
  });

  describe('TypeScript Types', () => {
    it('should define AgentCategory type correctly', () => {
      // Test that the type can be used
      const testCategory: AgentCategory = 'Orchestration Agents';
      expect(AGENT_CATEGORIES).toContain(testCategory);
      
      // Test that it accepts valid categories
      const validCategories: AgentCategory[] = [
        'Orchestration Agents',
        'Infrastructure Agents',
        'Monitoring & Analytics Agents',
      ];
      validCategories.forEach(category => {
        expect(AGENT_CATEGORIES).toContain(category);
      });
    });

    it('should define DeploymentEnvironment type correctly', () => {
      // Test that the type can be used
      const testEnvironment: DeploymentEnvironment = 'Production';
      expect(DEPLOYMENT_ENVIRONMENTS).toContain(testEnvironment);
      
      // Test that it accepts valid environments
      const validEnvironments: DeploymentEnvironment[] = [
        'Development',
        'Production',
        'Edge',
      ];
      validEnvironments.forEach(environment => {
        expect(DEPLOYMENT_ENVIRONMENTS).toContain(environment);
      });
    });
  });

  describe('Data Integrity and Consistency', () => {
    it('should have consistent version formats', () => {
      const semverPattern = /^\d+\.\d+\.\d+/;
      expect(GO_VERSION).toMatch(semverPattern);
      expect(DOCUSAURUS_VERSION).toMatch(semverPattern);
      expect(KUBERNETES_MIN_VERSION).toMatch(semverPattern);
      expect(KUBERNETES_RECOMMENDED_VERSION).toMatch(semverPattern);
      expect(AGENT_FRAMEWORK_VERSION).toMatch(semverPattern);
      expect(DOCUMENTATION_VERSION).toMatch(semverPattern);
    });

    it('should have consistent date formats', () => {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      expect(ORAN_L_RELEASE).toMatch(datePattern);
      expect(CLAUDE_API_VERSION).toMatch(datePattern);
      expect(LAST_UPDATED).toMatch(datePattern);
    });

    it('should have valid URLs', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(GITHUB_REPO_URL).toMatch(urlPattern);
      expect(NEPHIO_DOCS_URL).toMatch(urlPattern);
      expect(ORAN_DOCS_URL).toMatch(urlPattern);
      expect(CLAUDE_DOCS_URL).toMatch(urlPattern);
    });

    it('should have non-empty string values', () => {
      const stringConstants = [
        GO_VERSION, ORAN_L_RELEASE, NEPHIO_VERSION, KPT_VERSION, K8S_POLICY,
        DOCUSAURUS_VERSION, KUBERNETES_MIN_VERSION, KUBERNETES_RECOMMENDED_VERSION,
        ORAN_ALLIANCE_RELEASE, ORAN_SMO_VERSION, ORAN_DU_VERSION, ORAN_CU_VERSION, ORAN_RIC_VERSION,
        NEPHIO_GITOPS_MODE, NEPHIO_PACKAGE_ORCHESTRATION, NEPHIO_CONFIG_AS_DATA,
        CLAUDE_API_VERSION, AGENT_FRAMEWORK_VERSION, DEPLOYMENT_TARGET, CONTAINER_RUNTIME,
        SERVICE_MESH, MONITORING_STACK, FIPS_COMPLIANCE, SECURITY_FRAMEWORK, TLS_VERSION,
        LAST_UPDATED, DOCUMENTATION_VERSION, LICENSE, GITHUB_REPO_URL, NEPHIO_DOCS_URL,
        ORAN_DOCS_URL, CLAUDE_DOCS_URL
      ];

      stringConstants.forEach(constant => {
        expect(typeof constant).toBe('string');
        expect(constant.length).toBeGreaterThan(0);
        expect(constant.trim()).toBe(constant); // No leading/trailing spaces
      });
    });

    it('should have valid array structures', () => {
      expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true);
      expect(Array.isArray(AGENT_CATEGORIES)).toBe(true);
      expect(Array.isArray(DEPLOYMENT_ENVIRONMENTS)).toBe(true);
      
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(0);
      expect(AGENT_CATEGORIES.length).toBeGreaterThan(0);
      expect(DEPLOYMENT_ENVIRONMENTS.length).toBeGreaterThan(0);
    });
  });
});

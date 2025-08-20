/**
 * Site configuration constants for Nephio O-RAN Claude Agents
 *
 * This file contains version numbers, release dates, and other constants
 * used throughout the documentation site.
 */

// Canonical Version Constants (as specified in requirements)
export const GO_VERSION = '1.24.6';
export const ORAN_L_RELEASE = '2025-06-30';
export const NEPHIO_VERSION = 'R5 (v5.x)';
export const KPT_VERSION = 'v1.0.0-beta.55';
export const K8S_POLICY = 'latest three minor releases';

// Additional version constants
export const DOCUSAURUS_VERSION = '3.5.2';
export const KUBERNETES_MIN_VERSION = '1.26.0';
export const KUBERNETES_RECOMMENDED_VERSION = '1.30.0';

// O-RAN specific constants
export const ORAN_ALLIANCE_RELEASE = 'L-Release';
export const ORAN_SMO_VERSION = '2.0.0';
export const ORAN_DU_VERSION = '2.0.0';
export const ORAN_CU_VERSION = '2.0.0';
export const ORAN_RIC_VERSION = 'H-Release';

// Nephio specific constants
export const NEPHIO_GITOPS_MODE = 'GitOps';
export const NEPHIO_PACKAGE_ORCHESTRATION = 'Enabled';
export const NEPHIO_CONFIG_AS_DATA = 'KPT';

// Claude Agents specific constants
export const CLAUDE_API_VERSION = '2023-06-01';
export const AGENT_FRAMEWORK_VERSION = '1.0.0';
export const SUPPORTED_LANGUAGES = ['Python', 'Go', 'TypeScript'];

// Deployment constants
export const DEPLOYMENT_TARGET = 'Kubernetes';
export const CONTAINER_RUNTIME = 'containerd';
export const SERVICE_MESH = 'Istio';
export const MONITORING_STACK = 'Prometheus + Grafana';

// Security and Compliance
export const FIPS_COMPLIANCE = 'FIPS 140-3';
export const SECURITY_FRAMEWORK = 'NIST Cybersecurity Framework';
export const RBAC_ENABLED = true;
export const TLS_VERSION = '1.3';

// Documentation metadata
export const LAST_UPDATED = '2025-08-20';
export const DOCUMENTATION_VERSION = '1.0.0';
export const LICENSE = 'Apache 2.0';

// Version display helpers
export const VERSION_DISPLAY = {
  GO: `Go ${GO_VERSION}`,
  ORAN: `O-RAN L (${ORAN_L_RELEASE})`,
  NEPHIO: `Nephio ${NEPHIO_VERSION}`,
  KPT: `kpt ${KPT_VERSION}`,
  KUBERNETES: `Kubernetes ${KUBERNETES_RECOMMENDED_VERSION}+`,
} as const;

// URLs and endpoints
export const GITHUB_REPO_URL =
  'https://github.com/thc1006/nephio-oran-claude-agents';
export const NEPHIO_DOCS_URL = 'https://docs.nephio.org/';
export const ORAN_DOCS_URL = 'https://docs.o-ran-sc.org/';
export const CLAUDE_DOCS_URL = 'https://docs.anthropic.com/';

// Feature flags
export const FEATURES = {
  MULTI_LANGUAGE_SUPPORT: true,
  DARK_MODE: true,
  SEARCH_ENABLED: true,
  ANALYTICS_ENABLED: false, // Set to true when analytics are configured
  ALGOLIA_SEARCH: false, // Set to true when Algolia is configured
  INTERNATIONALIZATION: true,
} as const;

// Agent categories for organization
export const AGENT_CATEGORIES = [
  'Orchestration Agents',
  'Infrastructure Agents',
  'Monitoring & Analytics Agents',
  'Security & Compliance Agents',
  'Network Functions Agents',
  'Testing & Validation Agents',
  'Configuration Management Agents',
] as const;

// Supported deployment environments
export const DEPLOYMENT_ENVIRONMENTS = [
  'Development',
  'Staging',
  'Production',
  'Edge',
  'Multi-Cloud',
] as const;

export type AgentCategory = (typeof AGENT_CATEGORIES)[number];
export type DeploymentEnvironment = (typeof DEPLOYMENT_ENVIRONMENTS)[number];

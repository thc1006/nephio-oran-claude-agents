// Export all custom components for easy importing
export { default as CompatibilityMatrix } from './CompatibilityMatrix';
export type {
  CompatibilityData,
  CompatibilityMatrixProps,
} from './CompatibilityMatrix';

export {
  default as ReleaseBadge,
  OranBadge,
  NephioBadge,
  GoBadge,
  KptBadge,
  KubernetesBadge,
} from './ReleaseBadge';
export type { ReleaseBadgeProps, ReleaseType } from './ReleaseBadge';

export { default as SupportStatement } from './SupportStatement';
export type { SupportStatementProps } from './SupportStatement';

// Re-export existing components
export { default as HomepageFeatures } from './HomepageFeatures';

import React from 'react';
import clsx from 'clsx';
import {
  GO_VERSION as _GO_VERSION,
  ORAN_L_RELEASE as _ORAN_L_RELEASE,
  NEPHIO_VERSION as _NEPHIO_VERSION,
  KPT_VERSION as _KPT_VERSION,
  VERSION_DISPLAY as _VERSION_DISPLAY,
  LAST_UPDATED,
} from '../../data/siteConfig';
import ReleaseBadge from '../ReleaseBadge';
import styles from './styles.module.css';

export interface SupportStatementProps {
  variant?: 'full' | 'compact' | 'badges-only';
  showLastUpdated?: boolean;
  className?: string;
}

export default function SupportStatement({
  variant = 'full',
  showLastUpdated = true,
  className,
}: SupportStatementProps): React.ReactElement {
  const containerClasses = clsx(
    styles.supportStatement,
    styles[variant],
    className
  );

  if (variant === 'badges-only') {
    return (
      <div className={containerClasses}>
        <div className={styles.badges}>
          <ReleaseBadge type='go' size='small' />
          <ReleaseBadge type='oran' size='small' />
          <ReleaseBadge type='nephio' size='small' />
          <ReleaseBadge type='kpt' size='small' />
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={styles.header}>
        <h4 className={styles.title}>
          {variant === 'compact'
            ? 'Supported Versions'
            : 'Version Support Statement'}
        </h4>
        {showLastUpdated && (
          <span className={styles.lastUpdated}>Updated: {LAST_UPDATED}</span>
        )}
      </div>

      <div className={styles.content}>
        {variant === 'full' && (
          <p className={styles.description}>
            This documentation and the associated Claude agents are tested and
            supported with the following canonical versions of O-RAN, Nephio,
            and related technologies.
          </p>
        )}

        <div className={styles.versionList}>
          <div className={styles.versionItem}>
            <ReleaseBadge type='go' variant='outline' size='medium' />
            <span className={styles.versionDescription}>
              Required Go runtime version for agent execution
            </span>
          </div>

          <div className={styles.versionItem}>
            <ReleaseBadge type='oran' variant='outline' size='medium' />
            <span className={styles.versionDescription}>
              O-RAN Alliance L-Release specifications and implementations
            </span>
          </div>

          <div className={styles.versionItem}>
            <ReleaseBadge type='nephio' variant='outline' size='medium' />
            <span className={styles.versionDescription}>
              Nephio R5 package orchestration and GitOps workflows
            </span>
          </div>

          <div className={styles.versionItem}>
            <ReleaseBadge type='kpt' variant='outline' size='medium' />
            <span className={styles.versionDescription}>
              Configuration as Data package management with kpt
            </span>
          </div>
        </div>

        {variant === 'full' && (
          <div className={styles.additionalInfo}>
            <div className={styles.note}>
              <strong>Note:</strong> While these are the canonical supported
              versions, many agents may work with adjacent versions. Please
              refer to individual agent documentation for specific compatibility
              requirements.
            </div>

            <div className={styles.policy}>
              <strong>Support Policy:</strong> We follow Kubernetes' support
              policy of maintaining compatibility with the latest three minor
              releases.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience export for MDX usage
export { SupportStatement };

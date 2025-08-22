import React from 'react';
import clsx from 'clsx';
import { VERSION_DISPLAY } from '../../data/siteConfig';
import styles from './styles.module.css';

export type ReleaseType = 'oran' | 'nephio' | 'go' | 'kpt' | 'kubernetes';

export interface ReleaseBadgeProps {
  type: ReleaseType;
  version?: string;
  variant?: 'default' | 'outline' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}

const releaseConfig = {
  oran: {
    label: 'O-RAN',
    color: 'primary',
    icon: '📡',
    defaultVersion: VERSION_DISPLAY.ORAN,
  },
  nephio: {
    label: 'Nephio',
    color: 'success',
    icon: '☸️',
    defaultVersion: VERSION_DISPLAY.NEPHIO,
  },
  go: {
    label: 'Go',
    color: 'info',
    icon: '🐹',
    defaultVersion: VERSION_DISPLAY.GO,
  },
  kpt: {
    label: 'kpt',
    color: 'warning',
    icon: '📦',
    defaultVersion: VERSION_DISPLAY.KPT,
  },
  kubernetes: {
    label: 'Kubernetes',
    color: 'secondary',
    icon: '☸️',
    defaultVersion: VERSION_DISPLAY.KUBERNETES,
  },
};

export default function ReleaseBadge({
  type,
  version,
  variant = 'default',
  size = 'medium',
  showIcon = true,
  className,
}: ReleaseBadgeProps): React.ReactElement {
  const config = releaseConfig[type];
  const displayVersion = version || config.defaultVersion;
  
  const badgeClasses = clsx(
    'badge',
    `badge--${config.color}`,
    styles.releaseBadge,
    styles[variant],
    styles[size],
    {
      [styles.withIcon]: showIcon,
    },
    className
  );

  return (
    <span className={badgeClasses} title={`${config.label} ${displayVersion}`}>
      {showIcon && (
        <span className={styles.icon} role="img" aria-label={config.label}>
          {config.icon}
        </span>
      )}
      <span className={styles.content}>
        <span className={styles.label}>{config.label}</span>
        <span className={styles.version}>{displayVersion}</span>
      </span>
    </span>
  );
}

// Convenience components for common use cases
export function OranBadge(props: Omit<ReleaseBadgeProps, 'type'>) {
  return <ReleaseBadge type="oran" {...props} />;
}

export function NephioBadge(props: Omit<ReleaseBadgeProps, 'type'>) {
  return <ReleaseBadge type="nephio" {...props} />;
}

export function GoBadge(props: Omit<ReleaseBadgeProps, 'type'>) {
  return <ReleaseBadge type="go" {...props} />;
}

export function KptBadge(props: Omit<ReleaseBadgeProps, 'type'>) {
  return <ReleaseBadge type="kpt" {...props} />;
}

export function KubernetesBadge(props: Omit<ReleaseBadgeProps, 'type'>) {
  return <ReleaseBadge type="kubernetes" {...props} />;
}
import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export interface CompatibilityData {
  component: string;
  version: string;
  status: 'supported' | 'deprecated' | 'experimental' | 'not-supported';
  notes?: string;
  lastTested?: string;
}

export interface CompatibilityMatrixProps {
  title?: string;
  data: CompatibilityData[];
  showLastTested?: boolean;
  compact?: boolean;
}

const statusMap = {
  'supported': { label: 'Supported', className: 'success' },
  'deprecated': { label: 'Deprecated', className: 'warning' },
  'experimental': { label: 'Experimental', className: 'info' },
  'not-supported': { label: 'Not Supported', className: 'danger' },
};

export default function CompatibilityMatrix({
  title = 'Compatibility Matrix',
  data,
  showLastTested = true,
  compact = false,
}: CompatibilityMatrixProps): React.ReactElement {
  return (
    <div className={clsx('compatibility-matrix', styles.compatibilityMatrix)}>
      <h3 className={styles.title}>{title}</h3>
      
      <div className={clsx('table-responsive', styles.tableContainer)}>
        <table className={clsx('table table-striped', styles.table, {
          [styles.compact]: compact,
        })}>
          <thead>
            <tr>
              <th>Component</th>
              <th>Version</th>
              <th>Status</th>
              {showLastTested && <th>Last Tested</th>}
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td className={styles.componentName}>
                  <code>{item.component}</code>
                </td>
                <td className={styles.version}>
                  <code>{item.version}</code>
                </td>
                <td className={styles.status}>
                  <span 
                    className={clsx(
                      'badge',
                      `badge--${statusMap[item.status].className}`,
                      styles.statusBadge
                    )}
                  >
                    {statusMap[item.status].label}
                  </span>
                </td>
                {showLastTested && (
                  <td className={styles.lastTested}>
                    {item.lastTested || 'N/A'}
                  </td>
                )}
                <td className={styles.notes}>
                  {item.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.legend}>
        <h4>Status Legend:</h4>
        <div className={styles.legendItems}>
          {Object.entries(statusMap).map(([key, value]) => (
            <span key={key} className={styles.legendItem}>
              <span 
                className={clsx(
                  'badge',
                  `badge--${value.className}`,
                  styles.legendBadge
                )}
              >
                {value.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
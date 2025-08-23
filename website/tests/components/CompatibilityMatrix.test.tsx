import React from 'react';
import { render as testingLibraryRender, screen } from '@testing-library/react';
import CompatibilityMatrix, {
  CompatibilityData,
  CompatibilityMatrixProps,
} from '../../src/components/CompatibilityMatrix';

const mockData: CompatibilityData[] = [
  {
    component: 'nephio',
    version: 'v2.0.0',
    status: 'supported',
    notes: 'Latest stable release',
    lastTested: '2025-08-20',
  },
  {
    component: 'kubernetes',
    version: 'v1.28.0',
    status: 'supported',
    notes: 'Recommended version',
    lastTested: '2025-08-19',
  },
  {
    component: 'istio',
    version: 'v1.19.0',
    status: 'experimental',
    notes: 'Testing in progress',
    lastTested: '2025-08-18',
  },
  {
    component: 'old-component',
    version: 'v1.0.0',
    status: 'deprecated',
    notes: 'Will be removed in next release',
    lastTested: '2025-07-01',
  },
  {
    component: 'unsupported-component',
    version: 'v0.5.0',
    status: 'not-supported',
    notes: 'Not compatible',
  },
];

describe('CompatibilityMatrix', () => {
  const defaultProps: CompatibilityMatrixProps = {
    data: mockData,
  };

  it('renders with default title', () => {
    testingLibraryRender(<CompatibilityMatrix {...defaultProps} />);
    expect(screen.getByText('Compatibility Matrix')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    const customTitle = 'Custom Compatibility Matrix';
    testingLibraryRender(
      <CompatibilityMatrix {...defaultProps} title={customTitle} />
    );
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('renders table headers correctly', () => {
    testingLibraryRender(<CompatibilityMatrix {...defaultProps} />);

    expect(screen.getByText('Component')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Last Tested')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('hides Last Tested column when showLastTested is false', () => {
    testingLibraryRender(
      <CompatibilityMatrix {...defaultProps} showLastTested={false} />
    );

    expect(screen.queryByText('Last Tested')).not.toBeInTheDocument();
  });

  it('renders all data rows correctly', () => {
    testingLibraryRender(<CompatibilityMatrix {...defaultProps} />);

    // Check that all components are rendered
    mockData.forEach(item => {
      expect(screen.getByText(item.component)).toBeInTheDocument();
      expect(screen.getByText(item.version)).toBeInTheDocument();
      if (item.notes) {
        expect(screen.getByText(item.notes)).toBeInTheDocument();
      }
      if (item.lastTested) {
        expect(screen.getByText(item.lastTested)).toBeInTheDocument();
      }
    });
  });

  it('renders status badges with correct classes', () => {
    testingLibraryRender(<CompatibilityMatrix {...defaultProps} />);

    const supportedBadges = screen.getAllByText('Supported');
    expect(supportedBadges[0]).toHaveClass('badge--success');
    expect(screen.getAllByText('Experimental')[0]).toHaveClass('badge--info');
    expect(screen.getAllByText('Deprecated')[0]).toHaveClass('badge--warning');
    expect(screen.getAllByText('Not Supported')[0]).toHaveClass(
      'badge--danger'
    );
  });

  it('renders component names and versions in code elements', () => {
    testingLibraryRender(<CompatibilityMatrix {...defaultProps} />);

    const componentCodes = screen.getAllByText('nephio')[0];
    expect(componentCodes.tagName).toBe('CODE');

    const versionCodes = screen.getAllByText('v2.0.0')[0];
    expect(versionCodes.tagName).toBe('CODE');
  });

  it('shows N/A for missing lastTested values', () => {
    testingLibraryRender(<CompatibilityMatrix {...defaultProps} />);

    // The unsupported-component doesn't have lastTested, should show N/A
    const naTd = screen.getByText('N/A');
    expect(naTd).toBeInTheDocument();
  });

  it('shows em dash for missing notes', () => {
    const dataWithoutNotes: CompatibilityData[] = [
      {
        component: 'test-component',
        version: 'v1.0.0',
        status: 'supported',
      },
    ];

    testingLibraryRender(<CompatibilityMatrix data={dataWithoutNotes} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders status legend', () => {
    testingLibraryRender(<CompatibilityMatrix {...defaultProps} />);

    expect(screen.getByText('Status Legend:')).toBeInTheDocument();

    // Check that all status types are in the legend
    const legendBadges = screen.getAllByText(
      /Supported|Deprecated|Experimental|Not Supported/
    );
    expect(legendBadges.length).toBeGreaterThanOrEqual(8); // 4 in table + 4 in legend
  });

  it('renders in compact mode', () => {
    testingLibraryRender(<CompatibilityMatrix {...defaultProps} compact />);

    // Test functional behavior instead of CSS classes
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Component')).toBeInTheDocument();
    // Look for actual components in the test data
    expect(screen.getByText('nephio')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('has responsive table container', () => {
    const { container } = testingLibraryRender(
      <CompatibilityMatrix {...defaultProps} />
    );

    const tableContainer = container.querySelector('.table-responsive');
    expect(tableContainer).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    testingLibraryRender(<CompatibilityMatrix {...defaultProps} />);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBeGreaterThan(0);

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(mockData.length + 1); // +1 for header row
  });

  it('handles empty data gracefully', () => {
    testingLibraryRender(<CompatibilityMatrix data={[]} />);

    // Should still render headers and structure
    expect(screen.getByText('Component')).toBeInTheDocument();
    expect(screen.getByText('Status Legend:')).toBeInTheDocument();

    // Should have only header row
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(1);
  });

  describe('Status mapping', () => {
    it('correctly maps all status types', () => {
      const allStatusData: CompatibilityData[] = [
        { component: 'comp1', version: 'v1', status: 'supported' },
        { component: 'comp2', version: 'v1', status: 'deprecated' },
        { component: 'comp3', version: 'v1', status: 'experimental' },
        { component: 'comp4', version: 'v1', status: 'not-supported' },
      ];

      testingLibraryRender(<CompatibilityMatrix data={allStatusData} />);

      expect(screen.getAllByText('Supported')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Deprecated')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Experimental')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Not Supported')[0]).toBeInTheDocument();
    });
  });
});

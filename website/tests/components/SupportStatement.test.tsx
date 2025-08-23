import React from 'react';
import { rtlRender as rtlRender, screen } from '@testing-library/react';
import SupportStatement, { SupportStatementProps } from '../../src/components/SupportStatement';

// Mock the siteConfig module
jest.mock('../../src/data/siteConfig', () => ({
  GO_VERSION: 'Go 1.24.6',
  ORAN_L_RELEASE: 'O-RAN L (2025-06-30)',
  NEPHIO_VERSION: 'Nephio R5 (v5.x)',
  KPT_VERSION: 'kpt v1.0.0-beta.55',
  VERSION_DISPLAY: {
    ORAN: 'O-RAN L (2025-06-30)',
    NEPHIO: 'Nephio R5 (v5.x)',
    GO: 'Go 1.24.6',
    KPT: 'kpt v1.0.0-beta.55',
    KUBERNETES: 'Kubernetes 1.30.0+',
  },
  LAST_UPDATED: '2025-08-22',
}));

// Mock ReleaseBadge component
jest.mock('../../src/components/ReleaseBadge', () => ({
  __esModule: true,
  default: ({ type, size, variant }: any) => (
    <span 
      data-testid={`release-badge-${type}`} 
      data-size={size}
      data-variant={variant}
      className="mock-release-badge"
    >
      {type} badge
    </span>
  ),
}));

describe('SupportStatement', () => {
  const defaultProps: SupportStatementProps = {};

  describe('Full variant (default)', () => {
    it('rtlRenders full variant with all content', () => {
      rtlRender(<SupportStatement {...defaultProps} />);
      
      expect(screen.getByText('Version Support Statement')).toBeInTheDocument();
      expect(screen.getByText(/This documentation and the associated Claude agents/)).toBeInTheDocument();
      expect(screen.getByText(/Required Go runtime version/)).toBeInTheDocument();
      expect(screen.getByText(/O-RAN Alliance L-Release specifications/)).toBeInTheDocument();
      expect(screen.getByText(/Nephio R5 package orchestration/)).toBeInTheDocument();
      expect(screen.getByText(/Configuration as Data package management/)).toBeInTheDocument();
    });

    it('shows last updated date by default', () => {
      rtlRender(<SupportStatement {...defaultProps} />);
      
      expect(screen.getByText('Updated: 2025-08-22')).toBeInTheDocument();
    });

    it('displays additional info in full variant', () => {
      rtlRender(<SupportStatement {...defaultProps} />);
      
      expect(screen.getByText(/While these are the canonical supported versions/)).toBeInTheDocument();
      expect(screen.getByText(/We follow Kubernetes' support policy/)).toBeInTheDocument();
    });

    it('rtlRenders all release badges with correct props', () => {
      rtlRender(<SupportStatement {...defaultProps} />);
      
      expect(screen.getByTestId('release-badge-go')).toHaveAttribute('data-variant', 'outline');
      expect(screen.getByTestId('release-badge-go')).toHaveAttribute('data-size', 'medium');
      expect(screen.getByTestId('release-badge-oran')).toHaveAttribute('data-variant', 'outline');
      expect(screen.getByTestId('release-badge-nephio')).toHaveAttribute('data-variant', 'outline');
      expect(screen.getByTestId('release-badge-kpt')).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('Compact variant', () => {
    it('rtlRenders compact variant with reduced content', () => {
      rtlRender(<SupportStatement variant="compact" />);
      
      expect(screen.getByText('Supported Versions')).toBeInTheDocument();
      expect(screen.queryByText(/This documentation and the associated Claude agents/)).not.toBeInTheDocument();
      expect(screen.queryByText(/While these are the canonical supported versions/)).not.toBeInTheDocument();
    });

    it('still shows version descriptions in compact variant', () => {
      rtlRender(<SupportStatement variant="compact" />);
      
      expect(screen.getByText(/Required Go runtime version/)).toBeInTheDocument();
      expect(screen.getByText(/O-RAN Alliance L-Release specifications/)).toBeInTheDocument();
    });
  });

  describe('Badges-only variant', () => {
    it('rtlRenders only badges without text content', () => {
      rtlRender(<SupportStatement variant="badges-only" />);
      
      expect(screen.queryByText('Version Support Statement')).not.toBeInTheDocument();
      expect(screen.queryByText('Supported Versions')).not.toBeInTheDocument();
      expect(screen.queryByText(/Required Go runtime version/)).not.toBeInTheDocument();
      
      // Should still rtlRender badges
      expect(screen.getByTestId('release-badge-go')).toBeInTheDocument();
      expect(screen.getByTestId('release-badge-oran')).toBeInTheDocument();
      expect(screen.getByTestId('release-badge-nephio')).toBeInTheDocument();
      expect(screen.getByTestId('release-badge-kpt')).toBeInTheDocument();
    });

    it('rtlRenders badges with small size in badges-only variant', () => {
      rtlRender(<SupportStatement variant="badges-only" />);
      
      expect(screen.getByTestId('release-badge-go')).toHaveAttribute('data-size', 'small');
      expect(screen.getByTestId('release-badge-oran')).toHaveAttribute('data-size', 'small');
      expect(screen.getByTestId('release-badge-nephio')).toHaveAttribute('data-size', 'small');
      expect(screen.getByTestId('release-badge-kpt')).toHaveAttribute('data-size', 'small');
    });
  });

  describe('Last Updated Display', () => {
    it('hides last updated when showLastUpdated is false', () => {
      rtlRender(<SupportStatement showLastUpdated={false} />);
      
      expect(screen.queryByText('Updated: 2025-08-22')).not.toBeInTheDocument();
    });

    it('shows last updated when showLastUpdated is true', () => {
      rtlRender(<SupportStatement showLastUpdated={true} />);
      
      expect(screen.getByText('Updated: 2025-08-22')).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Structure', () => {
    it('applies custom className', () => {
      const { container } = rtlRender(<SupportStatement className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('rtlRenders different variants correctly', () => {
      // Test full variant
      const { rertlRender } = rtlRender(<SupportStatement variant="full" />);
      expect(screen.getByText('Version Support Statement')).toBeInTheDocument();
      expect(screen.getByText(/While these are the canonical supported versions/)).toBeInTheDocument();
      
      // Test compact variant
      rertlRender(<SupportStatement variant="compact" />);
      expect(screen.getByText('Supported Versions')).toBeInTheDocument();
      expect(screen.queryByText(/While these are the canonical supported versions/)).not.toBeInTheDocument();
      
      // Test badges-only variant
      rertlRender(<SupportStatement variant="badges-only" />);
      expect(screen.queryByText('Version Support Statement')).not.toBeInTheDocument();
      expect(screen.queryByText('Supported Versions')).not.toBeInTheDocument();
      // But badges should still be present
      expect(screen.getByTestId('release-badge-go')).toBeInTheDocument();
    });

    it('has proper content structure', () => {
      rtlRender(<SupportStatement />);
      
      // Test functional behavior instead of CSS classes
      expect(screen.getByText('Version Support Statement')).toBeInTheDocument();
      expect(screen.getByText(/Required Go runtime version/)).toBeInTheDocument();
      expect(screen.getByText(/O-RAN Alliance L-Release specifications/)).toBeInTheDocument();
      expect(screen.getByText(/Nephio R5 package orchestration/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses proper heading hierarchy', () => {
      rtlRender(<SupportStatement />);
      
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('Version Support Statement');
    });

    it('provides descriptive text for each version item', () => {
      rtlRender(<SupportStatement />);
      
      expect(screen.getByText(/Required Go runtime version/)).toBeInTheDocument();
      expect(screen.getByText(/O-RAN Alliance L-Release/)).toBeInTheDocument();
      expect(screen.getByText(/Nephio R5 package orchestration/)).toBeInTheDocument();
      expect(screen.getByText(/Configuration as Data package management/)).toBeInTheDocument();
    });
  });

  describe('Export', () => {
    it('exports SupportStatement as named export', () => {
      const { SupportStatement: NamedExport } = require('../../src/components/SupportStatement');
      expect(NamedExport).toBeDefined();
      expect(typeof NamedExport).toBe('function');
    });
  });
});
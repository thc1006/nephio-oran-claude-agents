import React from 'react';
import { render, screen } from '@testing-library/react';
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
    it('renders full variant with all content', () => {
      render(<SupportStatement {...defaultProps} />);
      
      expect(screen.getByText('Version Support Statement')).toBeInTheDocument();
      expect(screen.getByText(/This documentation and the associated Claude agents/)).toBeInTheDocument();
      expect(screen.getByText(/Required Go runtime version/)).toBeInTheDocument();
      expect(screen.getByText(/O-RAN Alliance L-Release specifications/)).toBeInTheDocument();
      expect(screen.getByText(/Nephio R5 package orchestration/)).toBeInTheDocument();
      expect(screen.getByText(/Configuration as Data package management/)).toBeInTheDocument();
    });

    it('shows last updated date by default', () => {
      render(<SupportStatement {...defaultProps} />);
      
      expect(screen.getByText('Updated: 2025-08-22')).toBeInTheDocument();
    });

    it('displays additional info in full variant', () => {
      render(<SupportStatement {...defaultProps} />);
      
      expect(screen.getByText(/While these are the canonical supported versions/)).toBeInTheDocument();
      expect(screen.getByText(/We follow Kubernetes' support policy/)).toBeInTheDocument();
    });

    it('renders all release badges with correct props', () => {
      render(<SupportStatement {...defaultProps} />);
      
      expect(screen.getByTestId('release-badge-go')).toHaveAttribute('data-variant', 'outline');
      expect(screen.getByTestId('release-badge-go')).toHaveAttribute('data-size', 'medium');
      expect(screen.getByTestId('release-badge-oran')).toHaveAttribute('data-variant', 'outline');
      expect(screen.getByTestId('release-badge-nephio')).toHaveAttribute('data-variant', 'outline');
      expect(screen.getByTestId('release-badge-kpt')).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('Compact variant', () => {
    it('renders compact variant with reduced content', () => {
      render(<SupportStatement variant="compact" />);
      
      expect(screen.getByText('Supported Versions')).toBeInTheDocument();
      expect(screen.queryByText(/This documentation and the associated Claude agents/)).not.toBeInTheDocument();
      expect(screen.queryByText(/While these are the canonical supported versions/)).not.toBeInTheDocument();
    });

    it('still shows version descriptions in compact variant', () => {
      render(<SupportStatement variant="compact" />);
      
      expect(screen.getByText(/Required Go runtime version/)).toBeInTheDocument();
      expect(screen.getByText(/O-RAN Alliance L-Release specifications/)).toBeInTheDocument();
    });
  });

  describe('Badges-only variant', () => {
    it('renders only badges without text content', () => {
      render(<SupportStatement variant="badges-only" />);
      
      expect(screen.queryByText('Version Support Statement')).not.toBeInTheDocument();
      expect(screen.queryByText('Supported Versions')).not.toBeInTheDocument();
      expect(screen.queryByText(/Required Go runtime version/)).not.toBeInTheDocument();
      
      // Should still render badges
      expect(screen.getByTestId('release-badge-go')).toBeInTheDocument();
      expect(screen.getByTestId('release-badge-oran')).toBeInTheDocument();
      expect(screen.getByTestId('release-badge-nephio')).toBeInTheDocument();
      expect(screen.getByTestId('release-badge-kpt')).toBeInTheDocument();
    });

    it('renders badges with small size in badges-only variant', () => {
      render(<SupportStatement variant="badges-only" />);
      
      expect(screen.getByTestId('release-badge-go')).toHaveAttribute('data-size', 'small');
      expect(screen.getByTestId('release-badge-oran')).toHaveAttribute('data-size', 'small');
      expect(screen.getByTestId('release-badge-nephio')).toHaveAttribute('data-size', 'small');
      expect(screen.getByTestId('release-badge-kpt')).toHaveAttribute('data-size', 'small');
    });
  });

  describe('Last Updated Display', () => {
    it('hides last updated when showLastUpdated is false', () => {
      render(<SupportStatement showLastUpdated={false} />);
      
      expect(screen.queryByText('Updated: 2025-08-22')).not.toBeInTheDocument();
    });

    it('shows last updated when showLastUpdated is true', () => {
      render(<SupportStatement showLastUpdated={true} />);
      
      expect(screen.getByText('Updated: 2025-08-22')).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Structure', () => {
    it('applies custom className', () => {
      const { container } = render(<SupportStatement className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders different variants correctly', () => {
      // Test full variant
      const { rerender } = render(<SupportStatement variant="full" />);
      expect(screen.getByText('Version Support Statement')).toBeInTheDocument();
      expect(screen.getByText(/While these are the canonical supported versions/)).toBeInTheDocument();
      
      // Test compact variant
      rerender(<SupportStatement variant="compact" />);
      expect(screen.getByText('Supported Versions')).toBeInTheDocument();
      expect(screen.queryByText(/While these are the canonical supported versions/)).not.toBeInTheDocument();
      
      // Test badges-only variant
      rerender(<SupportStatement variant="badges-only" />);
      expect(screen.queryByText('Version Support Statement')).not.toBeInTheDocument();
      expect(screen.queryByText('Supported Versions')).not.toBeInTheDocument();
      // But badges should still be present
      expect(screen.getByTestId('release-badge-go')).toBeInTheDocument();
    });

    it('has proper content structure', () => {
      render(<SupportStatement />);
      
      // Test functional behavior instead of CSS classes
      expect(screen.getByText('Version Support Statement')).toBeInTheDocument();
      expect(screen.getByText(/Required Go runtime version/)).toBeInTheDocument();
      expect(screen.getByText(/O-RAN Alliance L-Release specifications/)).toBeInTheDocument();
      expect(screen.getByText(/Nephio R5 package orchestration/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses proper heading hierarchy', () => {
      render(<SupportStatement />);
      
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('Version Support Statement');
    });

    it('provides descriptive text for each version item', () => {
      render(<SupportStatement />);
      
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
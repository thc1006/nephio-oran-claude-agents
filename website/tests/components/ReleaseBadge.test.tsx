import React from 'react';
import { render, screen } from '@testing-library/react';
import ReleaseBadge, { 
  OranBadge, 
  NephioBadge, 
  GoBadge, 
  KptBadge, 
  KubernetesBadge,
  ReleaseBadgeProps 
} from '../../src/components/ReleaseBadge';

// Mock the siteConfig module
jest.mock('../../src/data/siteConfig', () => ({
  VERSION_DISPLAY: {
    ORAN: 'O-RAN L (2025-06-30)',
    NEPHIO: 'Nephio R5 (v5.x)',
    GO: 'Go 1.24.6',
    KPT: 'kpt v1.0.0-beta.55',
    KUBERNETES: 'Kubernetes 1.30.0+',
  },
}));

describe('ReleaseBadge', () => {
  const defaultProps: ReleaseBadgeProps = {
    type: 'oran',
  };

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<ReleaseBadge {...defaultProps} />);
      
      expect(screen.getByText('O-RAN')).toBeInTheDocument();
      expect(screen.getByText('O-RAN L (2025-06-30)')).toBeInTheDocument();
    });

    it('renders with custom version', () => {
      render(<ReleaseBadge type="nephio" version="R6 (v6.0)" />);
      
      expect(screen.getByText('Nephio')).toBeInTheDocument();
      expect(screen.getByText('R6 (v6.0)')).toBeInTheDocument();
    });

    it('displays correct title attribute', () => {
      render(<ReleaseBadge type="go" />);
      
      const badge = screen.getByText('Go').closest('span');
      expect(badge).toHaveAttribute('title', 'Go Go 1.24.6');
    });
  });

  describe('All Badge Types', () => {
    const badgeTypes = [
      { type: 'oran' as const, label: 'O-RAN', color: 'primary', icon: '📡' },
      { type: 'nephio' as const, label: 'Nephio', color: 'success', icon: '☸️' },
      { type: 'go' as const, label: 'Go', color: 'info', icon: '🐹' },
      { type: 'kpt' as const, label: 'kpt', color: 'warning', icon: '📦' },
      { type: 'kubernetes' as const, label: 'Kubernetes', color: 'secondary', icon: '☸️' },
    ];

    badgeTypes.forEach(({ type, label, color, icon }) => {
      it(`renders ${type} badge correctly`, () => {
        render(<ReleaseBadge type={type} />);
        
        expect(screen.getByText(label)).toBeInTheDocument();
        
        const badge = screen.getByText(label).closest('span');
        expect(badge).toHaveClass(`badge--${color}`);
        
        const iconElement = screen.getByRole('img', { name: label });
        expect(iconElement).toHaveTextContent(icon);
      });
    });
  });

  describe('Variants', () => {
    it('applies default variant class', () => {
      const { container } = render(<ReleaseBadge type="oran" variant="default" />);
      const badge = container.querySelector('.releaseBadge');
      expect(badge).toHaveClass('default');
    });

    it('applies outline variant class', () => {
      const { container } = render(<ReleaseBadge type="oran" variant="outline" />);
      const badge = container.querySelector('.releaseBadge');
      expect(badge).toHaveClass('outline');
    });

    it('applies minimal variant class', () => {
      const { container } = render(<ReleaseBadge type="oran" variant="minimal" />);
      const badge = container.querySelector('.releaseBadge');
      expect(badge).toHaveClass('minimal');
    });
  });

  describe('Sizes', () => {
    const sizes = ['small', 'medium', 'large'] as const;

    sizes.forEach(size => {
      it(`applies ${size} size class`, () => {
        const { container } = render(<ReleaseBadge type="oran" size={size} />);
        const badge = container.querySelector('.releaseBadge');
        expect(badge).toHaveClass(size);
      });
    });
  });

  describe('Icon Display', () => {
    it('shows icon by default', () => {
      render(<ReleaseBadge type="oran" />);
      
      const icon = screen.getByRole('img', { name: 'O-RAN' });
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('📡');
    });

    it('hides icon when showIcon is false', () => {
      render(<ReleaseBadge type="oran" showIcon={false} />);
      
      expect(screen.queryByRole('img', { name: 'O-RAN' })).not.toBeInTheDocument();
    });

    it('applies withIcon class when icon is shown', () => {
      const { container } = render(<ReleaseBadge type="oran" showIcon={true} />);
      const badge = container.querySelector('.releaseBadge');
      expect(badge).toHaveClass('withIcon');
    });

    it('does not apply withIcon class when icon is hidden', () => {
      const { container } = render(<ReleaseBadge type="oran" showIcon={false} />);
      const badge = container.querySelector('.releaseBadge');
      expect(badge).not.toHaveClass('withIcon');
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<ReleaseBadge type="oran" className="custom-class" />);
      const badge = container.querySelector('.releaseBadge');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label for icon', () => {
      render(<ReleaseBadge type="nephio" />);
      
      const icon = screen.getByRole('img', { name: 'Nephio' });
      expect(icon).toHaveAttribute('aria-label', 'Nephio');
    });

    it('has descriptive title attribute', () => {
      render(<ReleaseBadge type="kpt" version="v2.0.0" />);
      
      const badge = screen.getByText('kpt').closest('span');
      expect(badge).toHaveAttribute('title', 'kpt v2.0.0');
    });
  });

  describe('Convenience Components', () => {
    it('OranBadge renders correctly', () => {
      render(<OranBadge />);
      expect(screen.getByText('O-RAN')).toBeInTheDocument();
    });

    it('NephioBadge renders correctly', () => {
      render(<NephioBadge />);
      expect(screen.getByText('Nephio')).toBeInTheDocument();
    });

    it('GoBadge renders correctly', () => {
      render(<GoBadge />);
      expect(screen.getByText('Go')).toBeInTheDocument();
    });

    it('KptBadge renders correctly', () => {
      render(<KptBadge />);
      expect(screen.getByText('kpt')).toBeInTheDocument();
    });

    it('KubernetesBadge renders correctly', () => {
      render(<KubernetesBadge />);
      expect(screen.getByText('Kubernetes')).toBeInTheDocument();
    });

    it('convenience components accept props correctly', () => {
      render(<OranBadge version="Custom L" size="large" variant="outline" />);
      
      expect(screen.getByText('Custom L')).toBeInTheDocument();
      
      const badge = screen.getByText('O-RAN').closest('span');
      expect(badge).toHaveClass('large', 'outline');
    });
  });

  describe('Content Structure', () => {
    it('has proper content structure', () => {
      const { container } = render(<ReleaseBadge type="oran" />);
      
      const content = container.querySelector('.content');
      expect(content).toBeInTheDocument();
      
      const label = container.querySelector('.label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('O-RAN');
      
      const version = container.querySelector('.version');
      expect(version).toBeInTheDocument();
      expect(version).toHaveTextContent('O-RAN L (2025-06-30)');
    });
  });
});
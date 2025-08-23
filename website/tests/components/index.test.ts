/**
 * Tests for components/index.ts - Component exports
 * 
 * This test suite verifies that all components and types are properly exported
 * from the main components index file.
 */

import {
  // Component exports
  CompatibilityMatrix,
  ReleaseBadge,
  OranBadge,
  NephioBadge,
  GoBadge,
  KptBadge,
  KubernetesBadge,
  SupportStatement,
  HomepageFeatures,
} from '../../src/components';

// Import types to test they are exported
import type {
  CompatibilityData,
  CompatibilityMatrixProps,
  ReleaseBadgeProps,
  ReleaseType,
  SupportStatementProps,
} from '../../src/components';

describe('Components Index Exports', () => {
  describe('Component Exports', () => {
    it('should export CompatibilityMatrix component', () => {
      expect(CompatibilityMatrix).toBeDefined();
      expect(typeof CompatibilityMatrix).toBe('function');
    });

    it('should export ReleaseBadge component', () => {
      expect(ReleaseBadge).toBeDefined();
      expect(typeof ReleaseBadge).toBe('function');
    });

    it('should export convenience badge components', () => {
      expect(OranBadge).toBeDefined();
      expect(typeof OranBadge).toBe('function');
      
      expect(NephioBadge).toBeDefined();
      expect(typeof NephioBadge).toBe('function');
      
      expect(GoBadge).toBeDefined();
      expect(typeof GoBadge).toBe('function');
      
      expect(KptBadge).toBeDefined();
      expect(typeof KptBadge).toBe('function');
      
      expect(KubernetesBadge).toBeDefined();
      expect(typeof KubernetesBadge).toBe('function');
    });

    it('should export SupportStatement component', () => {
      expect(SupportStatement).toBeDefined();
      expect(typeof SupportStatement).toBe('function');
    });

    it('should export HomepageFeatures component', () => {
      expect(HomepageFeatures).toBeDefined();
      expect(typeof HomepageFeatures).toBe('function');
    });
  });

  describe('Type Exports', () => {
    it('should export CompatibilityData type', () => {
      // Type test - if this compiles, the type is properly exported
      const testData: CompatibilityData = {
        component: 'Test Component',
        nephio: { version: '1.0.0', status: 'supported' },
        oran: { version: '2.0.0', status: 'supported' },
        kubernetes: { version: '1.28.0', status: 'supported' },
        go: { version: '1.21.0', status: 'supported' },
        notes: 'Test notes',
      };
      expect(testData).toBeDefined();
    });

    it('should export CompatibilityMatrixProps type', () => {
      // Type test - if this compiles, the type is properly exported
      const testProps: CompatibilityMatrixProps = {
        data: [],
        showFilters: true,
        showExportButton: true,
      };
      expect(testProps).toBeDefined();
    });

    it('should export ReleaseBadgeProps type', () => {
      // Type test - if this compiles, the type is properly exported
      const testProps: ReleaseBadgeProps = {
        type: 'oran',
        version: '2.0.0',
      };
      expect(testProps).toBeDefined();
    });

    it('should export ReleaseType type', () => {
      // Type test - if this compiles, the type is properly exported
      const testType: ReleaseType = 'oran';
      expect(['oran', 'nephio', 'go', 'kpt', 'kubernetes']).toContain(testType);
    });

    it('should export SupportStatementProps type', () => {
      // Type test - if this compiles, the type is properly exported
      const testProps: SupportStatementProps = {
        level: 'full',
        description: 'Full support available',
      };
      expect(testProps).toBeDefined();
    });
  });

  describe('Export Consistency', () => {
    it('should have consistent default exports', () => {
      // Test that default exports are functions (React components)
      const defaultExports = [
        CompatibilityMatrix,
        ReleaseBadge,
        SupportStatement,
        HomepageFeatures,
      ];

      defaultExports.forEach(component => {
        expect(typeof component).toBe('function');
        expect(component.name).toBeTruthy(); // Should have a name
      });
    });

    it('should have consistent convenience exports', () => {
      // Test that convenience badge exports are functions
      const badgeExports = [
        OranBadge,
        NephioBadge,
        GoBadge,
        KptBadge,
        KubernetesBadge,
      ];

      badgeExports.forEach(badge => {
        expect(typeof badge).toBe('function');
        expect(badge.name).toBeTruthy(); // Should have a name
      });
    });
  });

  describe('Component Functionality', () => {
    it('should allow creating CompatibilityMatrix with basic props', () => {
      const testData: CompatibilityData[] = [
        {
          component: 'Test Component',
          nephio: { version: '1.0.0', status: 'supported' },
          oran: { version: '2.0.0', status: 'supported' },
          kubernetes: { version: '1.28.0', status: 'supported' },
          go: { version: '1.21.0', status: 'supported' },
          notes: 'Test notes',
        },
      ];

      const props: CompatibilityMatrixProps = {
        data: testData,
      };

      expect(props.data).toEqual(testData);
    });

    it('should allow creating ReleaseBadge with different types', () => {
      const releaseTypes: ReleaseType[] = ['oran', 'nephio', 'go', 'kpt', 'kubernetes'];
      
      releaseTypes.forEach(type => {
        const props: ReleaseBadgeProps = {
          type,
          version: '1.0.0',
        };
        expect(props.type).toBe(type);
      });
    });

    it('should allow creating SupportStatement with different levels', () => {
      const supportLevels = ['full', 'partial', 'community', 'deprecated'] as const;
      
      supportLevels.forEach(level => {
        const props: SupportStatementProps = {
          level,
          description: `${level} support`,
        };
        expect(props.level).toBe(level);
      });
    });
  });
});

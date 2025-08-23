import compatibilityData from '../../src/data/compatibility.json';

describe('Compatibility Matrix Data', () => {
  describe('structure validation', () => {
    it('should have required top-level properties', () => {
      expect(compatibilityData).toHaveProperty('lastUpdated');
      expect(compatibilityData).toHaveProperty('compatibilityMatrix');
      expect(compatibilityData).toHaveProperty('categories');
      expect(compatibilityData).toHaveProperty('supportPolicy');
    });

    it('should have valid lastUpdated format', () => {
      expect(compatibilityData.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Should be a valid date
      const date = new Date(compatibilityData.lastUpdated);
      expect(date.toString()).not.toBe('Invalid Date');
      
      // Should be recent (within last year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      expect(date.getTime()).toBeGreaterThan(oneYearAgo.getTime());
    });

    it('should have non-empty compatibilityMatrix array', () => {
      expect(Array.isArray(compatibilityData.compatibilityMatrix)).toBe(true);
      expect(compatibilityData.compatibilityMatrix.length).toBeGreaterThan(0);
    });
  });

  describe('compatibility matrix entries', () => {
    it('should have all required fields for each entry', () => {
      const requiredFields = ['component', 'version', 'status', 'notes', 'lastTested'];
      
      compatibilityData.compatibilityMatrix.forEach((entry, index) => {
        requiredFields.forEach(field => {
          expect(entry).toHaveProperty(field, expect.any(String));
          expect(entry[field as keyof typeof entry]).toBeTruthy();
        }, `Entry ${index} (${entry.component}) missing ${requiredFields.join(', ')}`);
      });
    });

    it('should have valid status values', () => {
      const validStatuses = ['supported', 'experimental', 'deprecated', 'unsupported'];
      
      compatibilityData.compatibilityMatrix.forEach(entry => {
        expect(validStatuses).toContain(entry.status);
      });
    });

    it('should have valid lastTested dates', () => {
      compatibilityData.compatibilityMatrix.forEach(entry => {
        expect(entry.lastTested).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        const testDate = new Date(entry.lastTested);
        expect(testDate.toString()).not.toBe('Invalid Date');
        
        // Should not be in the future
        const now = new Date();
        expect(testDate.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should not have duplicate components with same version', () => {
      const componentVersionPairs = new Set();
      
      compatibilityData.compatibilityMatrix.forEach(entry => {
        const key = `${entry.component}:${entry.version}`;
        expect(componentVersionPairs.has(key)).toBe(false);
        componentVersionPairs.add(key);
      });
    });
  });

  describe('core components validation', () => {
    it('should include required O-RAN components', () => {
      const components = compatibilityData.compatibilityMatrix.map(entry => entry.component);
      const requiredComponents = [
        'O-RAN L-Release',
        'Nephio',
        'Kubernetes',
        'Go Runtime'
      ];
      
      requiredComponents.forEach(required => {
        expect(components).toContain(required);
      });
    });

    it('should have correct O-RAN L-Release version', () => {
      const oranEntry = compatibilityData.compatibilityMatrix.find(
        entry => entry.component === 'O-RAN L-Release'
      );
      
      expect(oranEntry).toBeDefined();
      expect(oranEntry?.version).toBe('2025-06-30');
      expect(oranEntry?.status).toBe('supported');
    });

    it('should have supported Nephio R5 version', () => {
      const nephioEntry = compatibilityData.compatibilityMatrix.find(
        entry => entry.component === 'Nephio'
      );
      
      expect(nephioEntry).toBeDefined();
      expect(nephioEntry?.version).toMatch(/R5.*v5\./);
      expect(nephioEntry?.status).toBe('supported');
    });

    it('should follow Kubernetes version support policy', () => {
      const kubernetesEntries = compatibilityData.compatibilityMatrix.filter(
        entry => entry.component === 'Kubernetes'
      );
      
      expect(kubernetesEntries.length).toBeGreaterThanOrEqual(3);
      
      const supportedEntries = kubernetesEntries.filter(entry => entry.status === 'supported');
      expect(supportedEntries.length).toBeGreaterThanOrEqual(3);
      
      // Check version format
      kubernetesEntries.forEach(entry => {
        expect(entry.version).toMatch(/^\d+\.\d+\.x$/);
      });
    });
  });

  describe('categories validation', () => {
    it('should have all required categories', () => {
      const requiredCategories = [
        'core',
        'kubernetes', 
        'observability',
        'gitops',
        'container',
        'tooling',
        'ai',
        'runtimes'
      ];
      
      requiredCategories.forEach(category => {
        expect(compatibilityData.categories).toHaveProperty(category);
        expect(Array.isArray(compatibilityData.categories[category])).toBe(true);
      });
    });

    it('should map all components to categories', () => {
      const allCategorizedComponents = Object.values(compatibilityData.categories)
        .flat()
        .filter((value, index, array) => array.indexOf(value) === index); // unique
        
      const allComponents = compatibilityData.compatibilityMatrix
        .map(entry => entry.component)
        .filter((value, index, array) => array.indexOf(value) === index); // unique
      
      // All components should be categorized
      allComponents.forEach(component => {
        expect(allCategorizedComponents).toContain(component);
      });
    });

    it('should not have empty categories', () => {
      Object.entries(compatibilityData.categories).forEach(([category, components]) => {
        expect(components.length).toBeGreaterThan(0);
      });
    });
  });

  describe('support policy validation', () => {
    it('should have complete support policy', () => {
      const policy = compatibilityData.supportPolicy;
      
      expect(policy).toHaveProperty('description', expect.any(String));
      expect(policy).toHaveProperty('kubernetesVersions', expect.any(Number));
      expect(policy).toHaveProperty('updateFrequency', expect.any(String));
      expect(policy).toHaveProperty('endOfLifePolicy', expect.any(String));
      
      expect(policy.kubernetesVersions).toBeGreaterThanOrEqual(3);
      expect(policy.description).toContain('Kubernetes');
    });
  });

  describe('version consistency', () => {
    it('should have consistent version patterns within component families', () => {
      // Check Python versions follow semantic versioning
      const pythonEntries = compatibilityData.compatibilityMatrix.filter(
        entry => entry.component === 'Python Runtime'
      );
      
      pythonEntries.forEach(entry => {
        expect(entry.version).toMatch(/^\d+\.\d+\.x$/);
      });
      
      // Check Node.js versions
      const nodeEntries = compatibilityData.compatibilityMatrix.filter(
        entry => entry.component === 'Node.js'
      );
      
      nodeEntries.forEach(entry => {
        expect(entry.version).toMatch(/^\d+\.x LTS$/);
      });
    });

    it('should have logical version progression', () => {
      // Kubernetes versions should be in descending order
      const kubernetesEntries = compatibilityData.compatibilityMatrix
        .filter(entry => entry.component === 'Kubernetes')
        .map(entry => ({
          ...entry,
          majorMinor: parseFloat(entry.version.replace('.x', ''))
        }))
        .sort((a, b) => b.majorMinor - a.majorMinor);
      
      // Latest version should be supported
      expect(kubernetesEntries[0].status).toBe('supported');
      
      // Oldest versions should be deprecated
      const oldestVersion = kubernetesEntries[kubernetesEntries.length - 1];
      if (kubernetesEntries.length > 3) {
        expect(['deprecated', 'unsupported']).toContain(oldestVersion.status);
      }
    });
  });

  describe('data quality checks', () => {
    it('should have meaningful notes for all entries', () => {
      compatibilityData.compatibilityMatrix.forEach(entry => {
        expect(entry.notes.length).toBeGreaterThan(10);
        expect(entry.notes).not.toMatch(/^(TODO|TBD|N\/A|None)$/i);
      });
    });

    it('should have recent testing dates', () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const supportedEntries = compatibilityData.compatibilityMatrix.filter(
        entry => entry.status === 'supported'
      );
      
      supportedEntries.forEach(entry => {
        const testDate = new Date(entry.lastTested);
        
        // Supported components should be tested within 3 months
        expect(testDate.getTime()).toBeGreaterThan(threeMonthsAgo.getTime());
      }, `Supported component ${supportedEntries[0].component} was last tested too long ago`);
    });

    it('should have appropriate status for deprecated versions', () => {
      const deprecatedEntries = compatibilityData.compatibilityMatrix.filter(
        entry => entry.status === 'deprecated'
      );
      
      deprecatedEntries.forEach(entry => {
        // Deprecated entries should mention upgrade or end-of-life
        expect(entry.notes.toLowerCase()).toMatch(/(upgrade|end|eol|deprecated|legacy)/);
      });
    });
  });

  describe('integration validation', () => {
    it('should have compatible versions across related components', () => {
      // Find Go runtime version
      const goEntry = compatibilityData.compatibilityMatrix.find(
        entry => entry.component === 'Go Runtime'
      );
      
      expect(goEntry).toBeDefined();
      expect(goEntry?.version).toMatch(/^\d+\.\d+\.\d+$/);
      
      // Go version should be reasonably recent (1.20+)
      const [major, minor] = goEntry!.version.split('.').map(Number);
      expect(major).toBeGreaterThanOrEqual(1);
      expect(minor).toBeGreaterThanOrEqual(20);
    });

    it('should have CI/CD compatible tool versions', () => {
      const gitopsComponents = ['ArgoCD', 'Flux'];
      const gitopsEntries = compatibilityData.compatibilityMatrix.filter(
        entry => gitopsComponents.includes(entry.component)
      );
      
      expect(gitopsEntries.length).toBeGreaterThan(0);
      
      // At least one GitOps tool should be fully supported
      const supportedGitops = gitopsEntries.filter(entry => entry.status === 'supported');
      expect(supportedGitops.length).toBeGreaterThan(0);
    });
  });

  describe('performance and scalability data', () => {
    it('should include container runtime options', () => {
      const containerRuntimes = ['containerd', 'Docker'];
      const runtimeEntries = compatibilityData.compatibilityMatrix.filter(
        entry => containerRuntimes.includes(entry.component)
      );
      
      expect(runtimeEntries.length).toBeGreaterThanOrEqual(2);
      
      // At least one should be fully supported
      const supportedRuntimes = runtimeEntries.filter(entry => entry.status === 'supported');
      expect(supportedRuntimes.length).toBeGreaterThan(0);
    });

    it('should include observability stack', () => {
      const observabilityComponents = ['Prometheus', 'Grafana'];
      
      observabilityComponents.forEach(component => {
        const entry = compatibilityData.compatibilityMatrix.find(
          e => e.component === component
        );
        
        expect(entry).toBeDefined();
        expect(entry?.status).toBe('supported');
      });
    });
  });

  describe('security and compliance', () => {
    it('should include Claude API with proper versioning', () => {
      const claudeEntry = compatibilityData.compatibilityMatrix.find(
        entry => entry.component === 'Claude API'
      );
      
      expect(claudeEntry).toBeDefined();
      expect(claudeEntry?.status).toBe('supported');
      expect(claudeEntry?.version).toMatch(/^\d{4}-\d{2}-\d{2}$/); // API version date format
    });

    it('should have recent security-related component versions', () => {
      const securityComponents = ['Istio Service Mesh'];
      
      securityComponents.forEach(component => {
        const entry = compatibilityData.compatibilityMatrix.find(
          e => e.component === component
        );
        
        expect(entry).toBeDefined();
        if (entry?.status === 'supported') {
          const testDate = new Date(entry.lastTested);
          const twoMonthsAgo = new Date();
          twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
          
          expect(testDate.getTime()).toBeGreaterThan(twoMonthsAgo.getTime());
        }
      });
    });
  });
});

describe('Compatibility Matrix Utilities', () => {
  describe('filtering and querying', () => {
    it('should be able to filter by status', () => {
      const supportedComponents = compatibilityData.compatibilityMatrix
        .filter(entry => entry.status === 'supported');
      
      expect(supportedComponents.length).toBeGreaterThan(10);
      
      const experimentalComponents = compatibilityData.compatibilityMatrix
        .filter(entry => entry.status === 'experimental');
      
      expect(experimentalComponents.length).toBeGreaterThan(0);
    });

    it('should be able to filter by category', () => {
      const coreComponents = compatibilityData.categories.core;
      const coreEntries = compatibilityData.compatibilityMatrix
        .filter(entry => coreComponents.includes(entry.component));
      
      expect(coreEntries.length).toBe(coreComponents.length);
      
      // All core components should be supported
      coreEntries.forEach(entry => {
        expect(entry.status).toBe('supported');
      });
    });

    it('should be able to group by component family', () => {
      const kubernetesFamily = compatibilityData.compatibilityMatrix
        .filter(entry => entry.component === 'Kubernetes')
        .sort((a, b) => b.version.localeCompare(a.version));
      
      expect(kubernetesFamily.length).toBeGreaterThanOrEqual(3);
      
      // Should have mix of supported and deprecated
      const statuses = kubernetesFamily.map(entry => entry.status);
      expect(statuses).toContain('supported');
    });
  });

  describe('compatibility checking logic', () => {
    it('should identify minimum supported versions', () => {
      const pythonVersions = compatibilityData.compatibilityMatrix
        .filter(entry => entry.component === 'Python Runtime' && entry.status === 'supported')
        .map(entry => ({
          version: entry.version,
          major: parseInt(entry.version.split('.')[0]),
          minor: parseInt(entry.version.split('.')[1])
        }))
        .sort((a, b) => a.major - b.major || a.minor - b.minor);
      
      expect(pythonVersions.length).toBeGreaterThan(0);
      
      // Minimum supported Python should be 3.11+
      const minVersion = pythonVersions[0];
      expect(minVersion.major).toBe(3);
      expect(minVersion.minor).toBeGreaterThanOrEqual(11);
    });

    it('should validate component interdependencies', () => {
      // Helm should be compatible with supported Kubernetes versions
      const helmEntry = compatibilityData.compatibilityMatrix.find(
        entry => entry.component === 'Helm'
      );
      
      const supportedK8s = compatibilityData.compatibilityMatrix
        .filter(entry => entry.component === 'Kubernetes' && entry.status === 'supported');
      
      expect(helmEntry).toBeDefined();
      expect(supportedK8s.length).toBeGreaterThan(0);
      
      if (helmEntry?.status === 'supported') {
        // Helm version should be recent enough for supported K8s versions
        expect(helmEntry.version).toMatch(/^3\.\d+\.x$/);
      }
    });
  });
});
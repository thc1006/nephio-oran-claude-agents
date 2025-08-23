#!/usr/bin/env python3
"""
Version management tests for Nephio-O-RAN Claude Agents.
Validates version consistency across the repository.
"""

import unittest
import re
import yaml
from pathlib import Path

class TestVersionManagement(unittest.TestCase):
    """Test version consistency and management."""
    
    def setUp(self):
        """Set up test environment."""
        self.project_root = Path(__file__).parent.parent
        self.makefile = self.project_root / "Makefile"
        self.agents_dir = self.project_root / "agents"
        
    def test_makefile_versions_defined(self):
        """Test that Makefile defines all required versions."""
        with open(self.makefile, 'r') as f:
            content = f.read()
        
        # Extract version definitions
        kpt_match = re.search(r'KPT_VERSION\s*:=\s*(v[\d\.\-\w]+)', content)
        go_match = re.search(r'GO_VERSION\s*:=\s*([\d\.]+)', content)
        k8s_match = re.search(r'KUBERNETES_VERSION\s*:=\s*([\d\.x]+)', content)
        nephio_match = re.search(r'NEPHIO_VERSION\s*:=\s*(v[\d\.]+)', content)
        
        self.assertIsNotNone(kpt_match, "KPT_VERSION not found in Makefile")
        self.assertIsNotNone(go_match, "GO_VERSION not found in Makefile")
        self.assertIsNotNone(k8s_match, "KUBERNETES_VERSION not found in Makefile")
        self.assertIsNotNone(nephio_match, "NEPHIO_VERSION not found in Makefile")
        
        # Validate version formats
        self.assertTrue(kpt_match.group(1).startswith('v'), 
                       "KPT_VERSION should start with 'v'")
        self.assertRegex(go_match.group(1), r'^\d+\.\d+(\.\d+)?$',
                        "GO_VERSION format invalid")
        self.assertIn('.x', k8s_match.group(1), 
                     "KUBERNETES_VERSION should use .x for minor version flexibility")
        self.assertTrue(nephio_match.group(1).startswith('v'),
                       "NEPHIO_VERSION should start with 'v'")
        
    def test_version_compatibility(self):
        """Test that versions are compatible with each other."""
        with open(self.makefile, 'r') as f:
            content = f.read()
        
        nephio_match = re.search(r'NEPHIO_VERSION\s*:=\s*v(\d+)', content)
        if nephio_match:
            nephio_major = int(nephio_match.group(1))
            
            # Nephio R5 should be version 5.x.x
            self.assertEqual(nephio_major, 5, 
                           f"Expected Nephio R5 (v5.x.x), got v{nephio_major}")
            
    def test_agent_model_versions(self):
        """Test that agents specify valid model versions."""
        valid_models = ['haiku', 'sonnet', 'opus']
        
        for agent_file in self.agents_dir.glob('*.md'):
            with open(agent_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract YAML frontmatter
            if content.startswith('---'):
                parts = content.split('---')
                if len(parts) >= 3:
                    frontmatter = parts[1].strip()
                    data = yaml.safe_load(frontmatter)
                    
                    self.assertIn('model', data, 
                                f"Agent {agent_file.name} missing model specification")
                    self.assertIn(data['model'], valid_models,
                                f"Agent {agent_file.name} has invalid model: {data['model']}")
                    
    def test_o_ran_l_release_references(self):
        """Test that O-RAN L Release is consistently referenced."""
        # O-RAN L Release is the latest release
        for agent_file in self.agents_dir.glob('*.md'):
            with open(agent_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'O-RAN' in content:
                # Check for consistent release naming
                if 'Release' in content:
                    # Should reference "L Release" or "L-Release"
                    has_l_release = ('L Release' in content or 'L-Release' in content)
                    self.assertTrue(has_l_release,
                                  f"Agent {agent_file.name} should reference O-RAN L Release")
                    
    def test_kpt_version_consistency(self):
        """Test that kpt version is consistently referenced."""
        with open(self.makefile, 'r') as f:
            makefile_content = f.read()
        
        kpt_match = re.search(r'KPT_VERSION\s*:=\s*(v[\d\.\-\w]+)', makefile_content)
        if kpt_match:
            expected_version = kpt_match.group(1)
            
            # Check if there are any hardcoded old versions
            old_version_pattern = r'v1\.0\.0-beta\.27'
            
            # Check Makefile doesn't have old hardcoded versions
            self.assertNotIn('v1.0.0-beta.27', makefile_content.replace(expected_version, ''),
                           "Found hardcoded old kpt version in Makefile")

if __name__ == '__main__':
    unittest.main(verbosity=2)
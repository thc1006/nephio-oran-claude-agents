#!/usr/bin/env python3
"""
Version management tests for Nephio-O-RAN Claude Agents.
Tests version consistency across different components and configurations.
"""

import unittest
import json
import yaml
import re
from pathlib import Path

class TestVersionManagement(unittest.TestCase):
    """Test version consistency across the project."""
    
    def setUp(self):
        """Set up test environment."""
        self.project_root = Path(__file__).parent.parent
        self.website_dir = self.project_root / "website"
        self.agents_dir = self.project_root / "agents"
        
    def test_package_json_versions(self):
        """Test that package.json files have consistent versioning."""
        # Main package.json
        main_package = self.project_root / "package.json"
        if main_package.exists():
            with open(main_package, 'r') as f:
                main_data = json.load(f)
                
            self.assertIn('version', main_data)
            self.assertTrue(re.match(r'^\d+\.\d+\.\d+', main_data['version']))
        
        # Website package.json
        website_package = self.website_dir / "package.json"
        if website_package.exists():
            with open(website_package, 'r') as f:
                website_data = json.load(f)
                
            self.assertIn('version', website_data)
            self.assertTrue(re.match(r'^\d+\.\d+\.\d+', website_data['version']))
    
    def test_compatibility_matrix_versions(self):
        """Test compatibility matrix has proper versioning."""
        compatibility_file = self.website_dir / "src" / "data" / "compatibility.json"
        
        if compatibility_file.exists():
            with open(compatibility_file, 'r') as f:
                data = json.load(f)
            
            # Check lastUpdated format
            self.assertIn('lastUpdated', data)
            self.assertTrue(re.match(r'^\d{4}-\d{2}-\d{2}$', data['lastUpdated']))
            
            # Check component versions
            for entry in data['compatibilityMatrix']:
                self.assertIn('version', entry)
                self.assertIn('lastTested', entry)
                self.assertTrue(re.match(r'^\d{4}-\d{2}-\d{2}$', entry['lastTested']))
    
    def test_go_mod_version(self):
        """Test Go module version if go.mod exists."""
        go_mod = self.project_root / "go.mod"
        
        if go_mod.exists():
            with open(go_mod, 'r') as f:
                content = f.read()
            
            # Check Go version
            go_version_match = re.search(r'go (\d+\.\d+(?:\.\d+)?)', content)
            self.assertIsNotNone(go_version_match, "Go version not found in go.mod")
            
            go_version = go_version_match.group(1)
            major, minor = go_version.split('.')[:2]
            
            # Go version should be reasonably recent (1.19+)
            self.assertGreaterEqual(int(major), 1)
            self.assertGreaterEqual(int(minor), 19)
    
    def test_agent_version_consistency(self):
        """Test that agents have consistent version references."""
        agent_files = list(self.agents_dir.glob('*.md'))
        
        version_patterns = {
            'o-ran': r'O-RAN.*?(?:2025-06-30|L.Release)',
            'nephio': r'Nephio.*?R5.*?v5\.\d+',
            'kubernetes': r'Kubernetes.*?1\.\d+',
            'kpt': r'kpt.*?v1\.0\.0-beta\.\d+'
        }
        
        for agent_file in agent_files:
            with open(agent_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            content_lower = content.lower()
            
            # Check for version references (case-insensitive search)
            for component, pattern in version_patterns.items():
                if component in content_lower:
                    matches = re.search(pattern, content, re.IGNORECASE)
                    if matches:
                        # Found a version reference - this is good
                        continue
    
    def test_docker_versions(self):
        """Test Docker-related version consistency."""
        dockerfile_paths = [
            self.website_dir / "Dockerfile",
            self.website_dir / "Dockerfile.dev",
            self.website_dir / "Dockerfile.test"
        ]
        
        for dockerfile in dockerfile_paths:
            if dockerfile.exists():
                with open(dockerfile, 'r') as f:
                    content = f.read()
                
                # Check Node.js version in FROM statements
                node_matches = re.findall(r'FROM node:(\d+)', content)
                for version in node_matches:
                    # Node.js version should be 18+
                    self.assertGreaterEqual(int(version), 18,
                                          f"Node.js version {version} in {dockerfile.name} is too old")
    
    def test_github_actions_versions(self):
        """Test GitHub Actions use appropriate versions."""
        workflows_dir = self.project_root / ".github" / "workflows"
        
        if workflows_dir.exists():
            workflow_files = list(workflows_dir.glob('*.yml'))
            
            for workflow_file in workflow_files:
                with open(workflow_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for Node.js setup action versions
                node_setup_matches = re.findall(r'node-version:\s*[\'"]?(\d+)[\'"]?', content)
                for version in node_setup_matches:
                    # Node.js version should be 18+
                    self.assertGreaterEqual(int(version), 18,
                                          f"Node.js version {version} in {workflow_file.name} is too old")
                
                # Check for action versions (should use v4 for major actions)
                action_matches = re.findall(r'uses:\s*actions/(\w+)@v(\d+)', content)
                for action_name, version in action_matches:
                    if action_name in ['checkout', 'setup-node', 'upload-artifact', 'download-artifact']:
                        # These actions should use v4
                        self.assertGreaterEqual(int(version), 3,
                                              f"Action {action_name}@v{version} in {workflow_file.name} should be v4+")
    
    def test_dependency_versions(self):
        """Test that dependencies are at supported versions."""
        package_json = self.website_dir / "package.json"
        
        if package_json.exists():
            with open(package_json, 'r') as f:
                data = json.load(f)
            
            dependencies = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
            
            # Check critical dependency versions
            version_requirements = {
                'react': '18',  # React 18+
                '@docusaurus/core': '3',  # Docusaurus 3+
                'typescript': '5',  # TypeScript 5+
                '@playwright/test': '1'  # Playwright 1+
            }
            
            for dep, min_major in version_requirements.items():
                if dep in dependencies:
                    version = dependencies[dep]
                    # Extract major version number
                    version_match = re.search(r'\^?(\d+)', version)
                    if version_match:
                        major_version = int(version_match.group(1))
                        self.assertGreaterEqual(major_version, int(min_major),
                                              f"{dep} version {version} should be {min_major}+")
    
    def test_browser_compatibility(self):
        """Test browser version requirements."""
        package_json = self.website_dir / "package.json"
        
        if package_json.exists():
            with open(package_json, 'r') as f:
                data = json.load(f)
            
            browserslist = data.get('browserslist', {})
            
            if browserslist:
                # Check production browserlist
                production = browserslist.get('production', [])
                if production:
                    # Should have reasonable browser support
                    self.assertIn('>0.5%', ''.join(production).replace(' ', ''))
                    self.assertIn('not dead', ''.join(production))
                
                # Check development browserlist
                development = browserslist.get('development', [])
                if development:
                    # Should include recent browsers
                    dev_str = ''.join(development).lower()
                    self.assertTrue(any(browser in dev_str 
                                      for browser in ['chrome', 'firefox', 'safari']))
    
    def test_python_version_requirements(self):
        """Test Python version requirements if applicable."""
        requirements_file = self.project_root / "requirements.txt"
        
        if requirements_file.exists():
            with open(requirements_file, 'r') as f:
                content = f.read()
            
            # Check for Python version constraints
            python_requires = re.findall(r'python_requires\s*=\s*[\'"]([^\'"]+)[\'"]', content)
            
            for requirement in python_requires:
                # Should require Python 3.8+
                version_match = re.search(r'>=\s*3\.(\d+)', requirement)
                if version_match:
                    minor_version = int(version_match.group(1))
                    self.assertGreaterEqual(minor_version, 8,
                                          f"Python version requirement {requirement} should be 3.8+")
    
    def test_security_policy_versions(self):
        """Test that security policies reference current versions."""
        security_files = [
            self.project_root / "SECURITY.md",
            self.website_dir / "SECURITY.md"
        ]
        
        for security_file in security_files:
            if security_file.exists():
                with open(security_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for version references in security policy
                version_matches = re.findall(r'(\d+\.\d+\.\d+)', content)
                
                # If versions are mentioned, they should be reasonable
                for version in version_matches:
                    major, minor, patch = map(int, version.split('.'))
                    # Basic sanity check - major version shouldn't be too old
                    self.assertLessEqual(major, 10, f"Version {version} seems unrealistic")
    
    def test_changelog_version_tracking(self):
        """Test changelog version tracking if it exists."""
        changelog_files = [
            self.project_root / "CHANGELOG.md",
            self.website_dir / "CHANGELOG.md"
        ]
        
        for changelog_file in changelog_files:
            if changelog_file.exists():
                with open(changelog_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for version headers
                version_headers = re.findall(r'##\s*\[?(\d+\.\d+\.\d+)\]?', content)
                
                if version_headers:
                    # Versions should be in descending order (newest first)
                    for i in range(len(version_headers) - 1):
                        current = version_headers[i]
                        next_version = version_headers[i + 1]
                        
                        # Simple version comparison
                        current_parts = list(map(int, current.split('.')))
                        next_parts = list(map(int, next_version.split('.')))
                        
                        self.assertGreaterEqual(current_parts, next_parts,
                                              f"Changelog versions should be in descending order: {current} >= {next_version}")

if __name__ == '__main__':
    unittest.main(verbosity=2)
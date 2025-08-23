#!/usr/bin/env python3
"""
Structure tests for Nephio-O-RAN Claude Agent repository.
Tests file structure and agent organization.
"""

import unittest
import os
from pathlib import Path

class TestStructure(unittest.TestCase):
    """Test repository structure and files."""
    
    def setUp(self):
        """Set up test environment."""
        self.project_root = Path(__file__).parent.parent
        self.agents_dir = self.project_root / "agents"
        self.tests_dir = self.project_root / "tests"
        self.website_dir = self.project_root / "website"
        self.config_dir = self.project_root / "config"
        
    def test_agent_files_exist(self):
        """Test that all agent files exist."""
        agent_files = list(self.agents_dir.glob('*.md'))
        self.assertEqual(len(agent_files), 10, "Expected 10 agent files")
        
        # Check specific agent files
        expected_agents = [
            'nephio-infrastructure-agent.md',
            'configuration-management-agent.md',
            'oran-network-functions-agent.md',
            'nephio-oran-orchestrator-agent.md',
            'monitoring-analytics-agent.md',
            'data-analytics-agent.md',
            'security-compliance-agent.md',
            'performance-optimization-agent.md',
            'oran-nephio-dep-doctor-agent.md',
            'testing-validation-agent.md'
        ]
        
        for agent_name in expected_agents:
            agent_path = self.agents_dir / agent_name
            self.assertTrue(agent_path.exists(), 
                          f"Agent file {agent_name} not found")
            
    def test_config_files_exist(self):
        """Test that configuration files exist."""
        # Config directory was removed during repository cleanup
        # This test is now skipped as config is no longer required
        self.skipTest("Config directory removed during cleanup - using defaults")
        
    def test_test_files_exist(self):
        """Test that test files exist."""
        test_files = [
            'validate_agents.py',
            'test_agent_scenarios.py',
            'test_workflows.py',
            'test_structure.py',
            'token_efficiency_monitor.py'
        ]
        
        for test_file in test_files:
            test_path = self.tests_dir / test_file
            self.assertTrue(test_path.exists(), 
                          f"Test file {test_file} not found")
            
    def test_agent_structure(self):
        """Test that agents have proper structure."""
        agent_files = list(self.agents_dir.glob('*.md'))
        
        for agent_file in agent_files:
            with open(agent_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for YAML frontmatter
            self.assertTrue(content.startswith('---'),
                          f"Agent {agent_file.name} missing YAML frontmatter")
            
            # Check that agent has substantial content (more than just frontmatter)
            self.assertGreater(len(content), 200,
                             f"Agent {agent_file.name} seems too short")

if __name__ == '__main__':
    unittest.main(verbosity=2)

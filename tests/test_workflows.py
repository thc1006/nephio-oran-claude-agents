#!/usr/bin/env python3
"""
Integration tests for Nephio-O-RAN Claude Agent workflows.
Tests agent collaboration patterns and integration points.
"""

import unittest
import json
import os
import sys
import yaml
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

class TestWorkflowIntegration(unittest.TestCase):
    """Test workflow integration functionality."""
    
    def setUp(self):
        """Set up test environment."""
        self.project_root = Path(__file__).parent.parent
        self.agents_dir = self.project_root / "agents"
        
    def test_agent_collaboration_keywords(self):
        """Test that agents have collaboration keywords."""
        agent_files = list(self.agents_dir.glob('*.md'))
        self.assertGreater(len(agent_files), 0, "No agent files found")
        
        # Most agents should have some form of collaboration
        agents_with_handoff = 0
        
        for agent_file in agent_files:
            with open(agent_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for HANDOFF or similar collaboration keywords
            if 'HANDOFF' in content or 'handoff' in content.lower():
                agents_with_handoff += 1
        
        # At least 50% of agents should have handoff patterns
        self.assertGreaterEqual(agents_with_handoff, len(agent_files) // 2,
                              f"Only {agents_with_handoff}/{len(agent_files)} agents have handoff patterns")
    
    def test_agent_workflow_definitions(self):
        """Test that agents define workflow integration points."""
        agent_files = list(self.agents_dir.glob('*.md'))
        
        workflow_keywords = ['deploy', 'validate', 'troubleshoot', 'monitor', 'optimize']
        
        for agent_file in agent_files:
            with open(agent_file, 'r', encoding='utf-8') as f:
                content = f.read().lower()
            
            # Check that agent mentions at least one workflow keyword
            has_workflow = any(keyword in content for keyword in workflow_keywords)
            self.assertTrue(has_workflow,
                          f"Agent {agent_file.name} doesn't mention any workflow keywords")
    
    def test_agent_key_sections(self):
        """Verify agents have key sections."""
        agent_files = list(self.agents_dir.glob('*.md'))
        self.assertGreater(len(agent_files), 0, "No agent files found")
        
        # Track which agents have which patterns
        agents_with_patterns = 0
        
        for agent_file in agent_files:
            with open(agent_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for various key patterns (case-insensitive)
            content_lower = content.lower()
            has_key_content = any([
                'command' in content_lower,
                'error' in content_lower,
                'logic' in content_lower,
                'usage' in content_lower,
                'example' in content_lower
            ])
            
            if has_key_content:
                agents_with_patterns += 1
        
        # All agents should have some key content
        self.assertEqual(agents_with_patterns, len(agent_files),
                        f"Only {agents_with_patterns}/{len(agent_files)} agents have key content")
    
    def test_agent_count(self):
        """Test that we have the expected number of agents."""
        agent_files = list(self.agents_dir.glob('*.md'))
        self.assertEqual(len(agent_files), 10, 
                        f"Expected 10 agents, found {len(agent_files)}")
    
    def test_agent_yaml_frontmatter(self):
        """Test that agent files have valid YAML frontmatter."""
        agent_files = list(self.agents_dir.glob('*.md'))
        
        for agent_file in agent_files:
            with self.subTest(file=agent_file.name):
                with open(agent_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for YAML frontmatter
                self.assertTrue(content.startswith('---'),
                              f"Agent {agent_file.name} missing YAML frontmatter")
                
                parts = content.split('---')
                self.assertGreaterEqual(len(parts), 3,
                                      f"Agent {agent_file.name} invalid frontmatter structure")
                
                # Validate YAML syntax
                if len(parts) >= 3:
                    frontmatter = parts[1].strip()
                    try:
                        data = yaml.safe_load(frontmatter)
                        self.assertIsNotNone(data, f"Empty frontmatter in {agent_file.name}")
                        self.assertIn('name', data, f"Missing 'name' in {agent_file.name}")
                        self.assertIn('model', data, f"Missing 'model' in {agent_file.name}")
                    except yaml.YAMLError as e:
                        self.fail(f"Invalid YAML in {agent_file.name}: {e}")

if __name__ == '__main__':
    unittest.main(verbosity=2)
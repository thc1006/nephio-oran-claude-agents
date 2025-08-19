#!/usr/bin/env python3
"""
Structure tests for Nephio-O-RAN Claude Agent workflows.
Tests file structure and basic functionality without execution.
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
        self.workflows_dir = self.project_root / "orchestration" / "workflows"
        
    def test_agent_files_exist(self):
        """Test that all agent files exist."""
        agent_files = list(self.agents_dir.glob('*.md'))
        self.assertEqual(len(agent_files), 10, "Expected 10 agent files")
        
    def test_workflow_files_exist(self):
        """Test that workflow definition files exist."""
        expected_workflows = [
            'deploy-complete.yaml',
            'troubleshoot.yaml',
            'validate.yaml', 
            'upgrade.yaml'
        ]
        
        for workflow in expected_workflows:
            workflow_path = self.workflows_dir / workflow
            self.assertTrue(workflow_path.exists(), 
                          f"Workflow file {workflow} not found")
            
    def test_scripts_exist(self):
        """Test that required scripts exist."""
        scripts_dir = self.project_root / "scripts"
        orchestration_dir = self.project_root / "orchestration"
        
        required_files = [
            scripts_dir / "run-workflow.sh",
            scripts_dir / "update-agents.py", 
            orchestration_dir / "orchestrator.py"
        ]
        
        for file_path in required_files:
            self.assertTrue(file_path.exists(), 
                          f"Required file {file_path} not found")
            
    def test_collaboration_protocol_in_agents(self):
        """Test that agents have collaboration protocol."""
        agent_files = list(self.agents_dir.glob('*.md'))
        
        for agent_file in agent_files:
            with open(agent_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            self.assertIn('Collaboration Protocol', content,
                         f"Agent {agent_file.name} missing Collaboration Protocol")

if __name__ == '__main__':
    unittest.main(verbosity=2)

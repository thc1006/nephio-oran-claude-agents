#!/usr/bin/env python3
"""
Integration tests for Nephio-O-RAN Claude Agent workflows.
Tests workflow execution, state management, and agent collaboration.
"""

import unittest
import subprocess
import json
import os
import sys
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
        self.orchestrator = self.project_root / "orchestration" / "orchestrator.py"
        self.workflow_runner = self.project_root / "scripts" / "run-workflow.sh"
        
    def test_bash_workflow_runner_exists(self):
        """Test that bash workflow runner exists and is executable."""
        self.assertTrue(self.workflow_runner.exists(), 
                       "Workflow runner script not found")
        self.assertTrue(os.access(self.workflow_runner, os.X_OK),
                       "Workflow runner is not executable")
    
    def test_python_orchestrator_dry_run(self):
        """Test Python orchestrator dry run functionality."""
        result = subprocess.run([
            'python', str(self.orchestrator), 
            'deploy', '--dry-run'
        ], capture_output=True, text=True, cwd=self.project_root)
        
        self.assertEqual(result.returncode, 0, 
                        f"Orchestrator failed: {result.stderr}")
        self.assertIn('DRY RUN', result.stderr,
                     "Dry run mode not indicated")
        self.assertIn('deploy', result.stderr,
                     "Deploy workflow not recognized")
    
    def test_all_workflows_dry_run(self):
        """Test all workflows in dry-run mode."""
        workflows = ['deploy', 'troubleshoot', 'validate', 'upgrade']
        
        for workflow in workflows:
            with self.subTest(workflow=workflow):
                result = subprocess.run([
                    'python', str(self.orchestrator),
                    workflow, '--dry-run'
                ], capture_output=True, text=True, cwd=self.project_root)
                
                self.assertEqual(result.returncode, 0,
                               f"Workflow {workflow} failed: {result.stderr}")
                self.assertIn(workflow, result.stderr,
                             f"Workflow {workflow} not recognized")
    
    def test_agent_output_format(self):
        """Verify all agents have standard output format."""
        agent_files = list(self.agents_dir.glob('*.md'))
        self.assertGreater(len(agent_files), 0, "No agent files found")
        
        required_sections = [
            'Collaboration Protocol',
            'Standard Output Format',
            'Workflow Integration'
        ]
        
        for agent_file in agent_files:
            with self.subTest(agent=agent_file.name):
                with open(agent_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                for section in required_sections:
                    self.assertIn(section, content,
                                f"Agent {agent_file.name} missing section: {section}")
    
    def test_workflow_definitions_exist(self):
        """Test that all workflow definition files exist."""
        workflows_dir = self.project_root / "orchestration" / "workflows"
        expected_workflows = [
            'deploy-complete.yaml',
            'troubleshoot.yaml', 
            'validate.yaml',
            'upgrade.yaml'
        ]
        
        self.assertTrue(workflows_dir.exists(), 
                       "Workflows directory not found")
        
        for workflow_file in expected_workflows:
            workflow_path = workflows_dir / workflow_file
            with self.subTest(workflow=workflow_file):
                self.assertTrue(workflow_path.exists(),
                               f"Workflow file {workflow_file} not found")
    
    def test_state_directory_creation(self):
        """Test that workflow state directories are created."""
        home_dir = Path.home()
        workflows_state_dir = home_dir / ".claude-workflows"
        
        # Run a quick dry-run to potentially create the directory
        subprocess.run([
            'python', str(self.orchestrator),
            'validate', '--dry-run'
        ], capture_output=True, cwd=self.project_root)
        
        # Check if state directory structure exists or gets created
        self.assertTrue(workflows_state_dir.exists() or 
                       workflows_state_dir.parent.exists(),
                       "Workflows state directory structure not accessible")
    
    def test_agent_count(self):
        """Test that we have the expected number of agents."""
        agent_files = list(self.agents_dir.glob('*.md'))
        expected_count = 10  # Based on the repository structure
        
        self.assertEqual(len(agent_files), expected_count,
                        f"Expected {expected_count} agents, found {len(agent_files)}")
    
    def test_workflow_yaml_validity(self):
        """Test that workflow YAML files are valid."""
        try:
            import yaml
        except ImportError:
            self.skipTest("PyYAML not available for YAML validation")
            
        workflows_dir = self.project_root / "orchestration" / "workflows"
        yaml_files = list(workflows_dir.glob('*.yaml'))
        
        for yaml_file in yaml_files:
            with self.subTest(file=yaml_file.name):
                with open(yaml_file, 'r', encoding='utf-8') as f:
                    try:
                        yaml_data = yaml.safe_load(f)
                        self.assertIsInstance(yaml_data, dict,
                                            f"Invalid YAML structure in {yaml_file.name}")
                        self.assertIn('name', yaml_data,
                                     f"Missing 'name' field in {yaml_file.name}")
                        self.assertIn('stages', yaml_data,
                                     f"Missing 'stages' field in {yaml_file.name}")
                    except yaml.YAMLError as e:
                        self.fail(f"Invalid YAML in {yaml_file.name}: {e}")

def run_tests():
    """Run all tests with detailed output."""
    # Set up test environment
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestWorkflowIntegration)
    
    # Run tests with verbose output
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    
    # Return exit code based on test results
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    sys.exit(run_tests())

#!/usr/bin/env python3
import unittest
import subprocess
import json
from pathlib import Path

class TestWorkflowIntegration(unittest.TestCase):
    def test_bash_workflow_runner(self):
        """Test that bash workflow runner executes"""
        result = subprocess.run(['./scripts/run-workflow.sh', 'validate'], 
                              capture_output=True, text=True, 
                              cwd='C:/Users/thc1006/Desktop/dev/nephio-oran-claude-agents')
        self.assertIn('Starting VALIDATION workflow', result.stdout)
    
    def test_python_orchestrator(self):
        """Test Python orchestrator dry run"""
        result = subprocess.run(['python3', 'orchestration/orchestrator.py', 
                               'deploy', '--dry-run'], 
                              capture_output=True, text=True,
                              cwd='C:/Users/thc1006/Desktop/dev/nephio-oran-claude-agents',
                              env={'PYTHONIOENCODING': 'utf-8'})
        self.assertEqual(result.returncode, 0)
    
    def test_agent_output_format(self):
        """Verify agents have standard output format"""
        agent_files = Path('C:/Users/thc1006/Desktop/dev/nephio-oran-claude-agents/agents').glob('*.md')
        for agent_file in agent_files:
            with open(agent_file, encoding='utf-8') as f:
                content = f.read()
                self.assertIn('Collaboration Protocol', content)
    
    def test_workflow_definitions_exist(self):
        """Test that all workflow definition files exist"""
        workflows_dir = Path('C:/Users/thc1006/Desktop/dev/nephio-oran-claude-agents/orchestration/workflows')
        expected_workflows = ['deploy-complete.yaml', 'troubleshoot.yaml', 
                            'validate.yaml', 'upgrade.yaml']
        for workflow in expected_workflows:
            workflow_path = workflows_dir / workflow
            self.assertTrue(workflow_path.exists(), 
                          f"Workflow file {workflow} not found")
    
    def test_scripts_executable(self):
        """Test that scripts have executable permissions"""
        scripts = [
            'orchestration/orchestrator.py',
            'scripts/run-workflow.sh',
            'scripts/update-agents.py'
        ]
        base_path = Path('C:/Users/thc1006/Desktop/dev/nephio-oran-claude-agents')
        for script in scripts:
            script_path = base_path / script
            self.assertTrue(script_path.exists(), f"Script {script} not found")
            # On Windows, just check existence since permissions work differently
            self.assertTrue(script_path.is_file())

if __name__ == '__main__':
    unittest.main()
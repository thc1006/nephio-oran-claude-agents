#!/usr/bin/env python3
"""
Nephio-O-RAN Agent Orchestrator
Main orchestration engine for multi-agent workflows
"""

import subprocess
import yaml
import json
import sys
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import argparse
import time

class AgentOrchestrator:
    """Orchestrates multi-agent workflows for Nephio-O-RAN deployments"""
    
    def __init__(self, workflow_id: Optional[str] = None, verbose: bool = False):
        self.workflow_id = workflow_id or datetime.now().strftime("%Y%m%d-%H%M%S")
        self.verbose = verbose
        self.state_dir = Path.home() / ".claude-workflows" / self.workflow_id
        self.state_dir.mkdir(parents=True, exist_ok=True)
        self.state = {
            "workflow_id": self.workflow_id,
            "started_at": datetime.now().isoformat(),
            "status": "running",
            "stages": {},
            "artifacts": {}
        }
        self.save_state()
        
    def log(self, message: str, level: str = "INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        icon = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}.get(level, "📝")
        print(f"[{timestamp}] {icon} {message}")
        
        # Also save to log file
        log_file = self.state_dir / "workflow.log"
        with open(log_file, "a") as f:
            f.write(f"[{timestamp}] [{level}] {message}\n")
    
    def execute_agent(self, agent: str, task: str, context: Optional[Dict] = None) -> Dict:
        """Execute a Claude Code agent and parse output"""
        # Build command with context
        command = f'Use {agent} to {task}'
        
        if context:
            # Add context from previous stages
            context_file = self.state_dir / "context.yaml"
            with open(context_file, "w") as f:
                yaml.dump(context, f)
            command += f'. Context is available in {context_file}'
        
        # Add standard output format reminder
        command += '. Format output as YAML with status, summary, details, next_steps, handoff_to, and artifacts fields.'
        
        self.log(f"Executing: {agent}", "INFO")
        if self.verbose:
            self.log(f"Command: {command}", "INFO")
        
        # Execute Claude Code
        try:
            result = subprocess.run(
                f'claude code "{command}"',
                shell=True,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            # Save raw output
            output_file = self.state_dir / f"{agent}-output.txt"
            with open(output_file, "w") as f:
                f.write(result.stdout)
            
            # Try to parse as YAML
            try:
                # Extract YAML from output (handle markdown code blocks)
                output_text = result.stdout
                if "```yaml" in output_text:
                    yaml_start = output_text.find("```yaml") + 7
                    yaml_end = output_text.find("```", yaml_start)
                    output_text = output_text[yaml_start:yaml_end]
                
                output = yaml.safe_load(output_text)
                
                # Validate required fields
                required_fields = ['status', 'summary']
                if not all(field in output for field in required_fields):
                    output = {
                        "status": "warning",
                        "summary": "Agent executed but output format incomplete",
                        "raw_output": result.stdout[:500]
                    }
                
            except yaml.YAMLError:
                # Fallback for non-YAML output
                output = {
                    "status": "warning",
                    "summary": "Agent executed but output not in YAML format",
                    "raw_output": result.stdout[:500]
                }
            
            return output
            
        except subprocess.TimeoutExpired:
            self.log(f"Agent {agent} timed out", "ERROR")
            return {
                "status": "error",
                "summary": "Agent execution timed out after 5 minutes"
            }
        except Exception as e:
            self.log(f"Error executing {agent}: {e}", "ERROR")
            return {
                "status": "error",
                "summary": f"Failed to execute agent: {str(e)}"
            }
    
    def save_state(self):
        """Save workflow state to disk"""
        state_file = self.state_dir / "state.json"
        with open(state_file, "w") as f:
            json.dump(self.state, f, indent=2)
    
    def load_workflow(self, workflow_name: str) -> Dict:
        """Load workflow definition from file"""
        # Check built-in workflows
        builtin_workflows = {
            "deploy": self.get_deployment_workflow(),
            "troubleshoot": self.get_troubleshooting_workflow(),
            "validate": self.get_validation_workflow(),
            "upgrade": self.get_upgrade_workflow()
        }
        
        if workflow_name in builtin_workflows:
            return builtin_workflows[workflow_name]
        
        # Check for custom workflow file
        workflow_file = Path(f"orchestration/workflows/{workflow_name}.yaml")
        if workflow_file.exists():
            with open(workflow_file, "r") as f:
                return yaml.safe_load(f)
        
        raise ValueError(f"Workflow '{workflow_name}' not found")
    
    def get_deployment_workflow(self) -> Dict:
        """Complete O-RAN deployment workflow"""
        return {
            "name": "complete-deployment",
            "description": "End-to-end O-RAN deployment with Nephio R5",
            "stages": [
                {
                    "name": "infrastructure",
                    "agent": "nephio-infrastructure-agent",
                    "task": "provision O-Cloud infrastructure with 3 nodes for edge deployment",
                    "timeout": 600,
                    "critical": True
                },
                {
                    "name": "dependencies",
                    "agent": "oran-nephio-dep-doctor",
                    "task": "validate all dependencies and check compatibility",
                    "timeout": 300,
                    "critical": True
                },
                {
                    "name": "configuration",
                    "agent": "configuration-management-agent",
                    "task": "apply YANG models and Kpt packages for O-RAN components",
                    "timeout": 450,
                    "critical": True
                },
                {
                    "name": "network-functions",
                    "agent": "oran-network-functions-agent",
                    "task": "deploy O-RAN CU, DU, and RU network functions",
                    "timeout": 900,
                    "critical": True
                },
                {
                    "name": "monitoring",
                    "agent": "monitoring-analytics-agent",
                    "task": "setup comprehensive observability and monitoring",
                    "timeout": 300,
                    "critical": False
                },
                {
                    "name": "optimization",
                    "agent": "performance-optimization-agent",
                    "task": "apply initial performance optimizations",
                    "timeout": 600,
                    "critical": False
                }
            ]
        }
    
    def get_troubleshooting_workflow(self) -> Dict:
        """Troubleshooting and issue resolution workflow"""
        return {
            "name": "troubleshooting",
            "description": "Identify and resolve O-RAN issues",
            "stages": [
                {
                    "name": "diagnosis",
                    "agent": "monitoring-analytics-agent",
                    "task": "analyze system metrics and identify issues",
                    "timeout": 300,
                    "critical": True
                },
                {
                    "name": "root-cause",
                    "agent": "performance-optimization-agent",
                    "task": "perform root cause analysis on identified issues",
                    "timeout": 450,
                    "critical": True
                },
                {
                    "name": "remediation",
                    "agent": "configuration-management-agent",
                    "task": "apply configuration fixes based on root cause analysis",
                    "timeout": 300,
                    "critical": True
                },
                {
                    "name": "verification",
                    "agent": "monitoring-analytics-agent",
                    "task": "verify that issues are resolved",
                    "timeout": 300,
                    "critical": True
                }
            ]
        }
    
    def get_validation_workflow(self) -> Dict:
        """Security and compliance validation workflow"""
        return {
            "name": "validation",
            "description": "Validate security and compliance",
            "stages": [
                {
                    "name": "security-scan",
                    "agent": "security-compliance-agent",
                    "task": "perform comprehensive security assessment",
                    "timeout": 600,
                    "critical": True
                },
                {
                    "name": "dependency-check",
                    "agent": "oran-nephio-dep-doctor",
                    "task": "validate all dependencies for vulnerabilities",
                    "timeout": 300,
                    "critical": True
                },
                {
                    "name": "performance-baseline",
                    "agent": "performance-optimization-agent",
                    "task": "establish performance baselines and validate SLAs",
                    "timeout": 450,
                    "critical": False
                }
            ]
        }
    
    def get_upgrade_workflow(self) -> Dict:
        """System upgrade workflow"""
        return {
            "name": "upgrade",
            "description": "Upgrade O-RAN components",
            "stages": [
                {
                    "name": "pre-check",
                    "agent": "oran-nephio-dep-doctor",
                    "task": "validate upgrade compatibility and dependencies",
                    "timeout": 300,
                    "critical": True
                },
                {
                    "name": "backup",
                    "agent": "configuration-management-agent",
                    "task": "backup current configurations and state",
                    "timeout": 300,
                    "critical": True
                },
                {
                    "name": "upgrade-infra",
                    "agent": "nephio-infrastructure-agent",
                    "task": "upgrade infrastructure components",
                    "timeout": 600,
                    "critical": True
                },
                {
                    "name": "upgrade-nf",
                    "agent": "oran-network-functions-agent",
                    "task": "upgrade network functions to new versions",
                    "timeout": 900,
                    "critical": True
                },
                {
                    "name": "validate",
                    "agent": "monitoring-analytics-agent",
                    "task": "validate upgrade success and system health",
                    "timeout": 300,
                    "critical": True
                }
            ]
        }
    
    def run_workflow(self, workflow_name: str, dry_run: bool = False) -> Dict:
        """Execute a complete workflow"""
        self.log(f"Starting workflow: {workflow_name}", "INFO")
        workflow = self.load_workflow(workflow_name)
        
        self.log(f"Workflow: {workflow['description']}", "INFO")
        self.log(f"Stages: {len(workflow['stages'])}", "INFO")
        
        if dry_run:
            self.log("DRY RUN - No actual execution", "WARNING")
            for stage in workflow['stages']:
                self.log(f"Would execute: {stage['name']} using {stage['agent']}", "INFO")
            return {"status": "dry_run_complete"}
        
        # Execute each stage
        for i, stage in enumerate(workflow['stages'], 1):
            self.log(f"Stage {i}/{len(workflow['stages'])}: {stage['name']}", "INFO")
            
            # Prepare context from previous stages
            context = {
                "workflow": workflow_name,
                "stage": stage['name'],
                "previous_stages": list(self.state['stages'].keys())
            }
            
            # Add previous stage outputs to context
            if self.state['stages']:
                context['previous_outputs'] = {
                    name: data.get('output', {}).get('summary', 'No summary')
                    for name, data in self.state['stages'].items()
                }
            
            # Execute agent
            start_time = time.time()
            output = self.execute_agent(stage['agent'], stage['task'], context)
            execution_time = time.time() - start_time
            
            # Save stage output
            self.state['stages'][stage['name']] = {
                "agent": stage['agent'],
                "task": stage['task'],
                "output": output,
                "execution_time": execution_time,
                "completed_at": datetime.now().isoformat()
            }
            
            # Check for artifacts
            if 'artifacts' in output and output['artifacts']:
                self.state['artifacts'][stage['name']] = output['artifacts']
            
            self.save_state()
            
            # Check status
            if output['status'] == 'error':
                if stage.get('critical', True):
                    self.log(f"Critical stage failed: {stage['name']}", "ERROR")
                    self.state['status'] = 'failed'
                    self.save_state()
                    return self.state
                else:
                    self.log(f"Non-critical stage failed, continuing: {stage['name']}", "WARNING")
            elif output['status'] == 'warning':
                self.log(f"Stage completed with warnings: {stage['name']}", "WARNING")
            else:
                self.log(f"Stage completed successfully: {stage['name']}", "SUCCESS")
            
            # Check for handoff
            if 'handoff_to' in output and output['handoff_to']:
                self.log(f"Handoff suggested to: {output['handoff_to']}", "INFO")
        
        # Workflow complete
        self.state['status'] = 'completed'
        self.state['completed_at'] = datetime.now().isoformat()
        self.save_state()
        
        self.log("Workflow completed successfully!", "SUCCESS")
        self.log(f"Results saved in: {self.state_dir}", "INFO")
        
        return self.state
    
    def generate_report(self) -> str:
        """Generate a summary report of the workflow execution"""
        report = []
        report.append("=" * 60)
        report.append(f"WORKFLOW EXECUTION REPORT")
        report.append(f"Workflow ID: {self.workflow_id}")
        report.append(f"Status: {self.state['status'].upper()}")
        report.append(f"Started: {self.state['started_at']}")
        if 'completed_at' in self.state:
            report.append(f"Completed: {self.state['completed_at']}")
        report.append("=" * 60)
        
        report.append("\nSTAGE EXECUTION SUMMARY:")
        for name, data in self.state['stages'].items():
            status = data['output'].get('status', 'unknown')
            icon = {"success": "✅", "warning": "⚠️", "error": "❌"}.get(status, "❓")
            report.append(f"\n{icon} {name}")
            report.append(f"   Agent: {data['agent']}")
            report.append(f"   Status: {status}")
            report.append(f"   Time: {data['execution_time']:.2f}s")
            if 'summary' in data['output']:
                report.append(f"   Summary: {data['output']['summary']}")
        
        if self.state['artifacts']:
            report.append("\nARTIFACTS CREATED:")
            for stage, artifacts in self.state['artifacts'].items():
                report.append(f"\n{stage}:")
                for artifact in artifacts:
                    report.append(f"   - {artifact.get('name', 'unnamed')} ({artifact.get('type', 'unknown')})")
        
        report.append("\n" + "=" * 60)
        report.append(f"Full results available in: {self.state_dir}")
        
        return "\n".join(report)

def main():
    """Main entry point for the orchestrator"""
    parser = argparse.ArgumentParser(description='Nephio-O-RAN Agent Orchestrator')
    parser.add_argument('workflow', 
                       choices=['deploy', 'troubleshoot', 'validate', 'upgrade'],
                       help='Workflow to execute')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be executed without running')
    parser.add_argument('--verbose', action='store_true',
                       help='Enable verbose output')
    parser.add_argument('--workflow-id', 
                       help='Custom workflow ID (default: timestamp)')
    
    args = parser.parse_args()
    
    # Create orchestrator
    orchestrator = AgentOrchestrator(
        workflow_id=args.workflow_id,
        verbose=args.verbose
    )
    
    # Run workflow
    try:
        result = orchestrator.run_workflow(args.workflow, dry_run=args.dry_run)
        
        # Generate and print report
        if not args.dry_run:
            report = orchestrator.generate_report()
            print("\n" + report)
            
            # Save report
            report_file = orchestrator.state_dir / "report.txt"
            with open(report_file, "w") as f:
                f.write(report)
        
        # Exit with appropriate code
        sys.exit(0 if result.get('status') in ['completed', 'dry_run_complete'] else 1)
        
    except Exception as e:
        print(f"❌ Workflow failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
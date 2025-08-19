#!/usr/bin/env python3
"""
Workflow Dependency Graph Validator for Nephio-O-RAN Claude Agents
Prevents circular dependencies and validates workflow progression
"""

import json
from typing import Dict, List, Set, Optional
from dataclasses import dataclass

@dataclass
class Agent:
    name: str
    accepts_from: List[str]
    hands_off_to: Optional[str]
    workflow_stage: int

class WorkflowValidator:
    """Validates agent workflow dependencies and prevents circular references"""
    
    def __init__(self):
        # Define the canonical workflow order (prevents circular dependencies)
        self.canonical_workflow = {
            "nephio-infrastructure-agent": 1,
            "oran-nephio-dep-doctor-agent": 2, 
            "configuration-management-agent": 3,
            "oran-network-functions-agent": 4,
            "monitoring-analytics-agent": 5,
            "data-analytics-agent": 6,
            "performance-optimization-agent": 7,
            "testing-validation-agent": 8,
            "security-compliance-agent": 0,  # Can be invoked at any stage
            "oran-nephio-orchestrator-agent": 0  # Meta-agent, can coordinate any stage
        }
        
        # Define valid handoff relationships based on workflow stages
        self.valid_handoffs = {
            "nephio-infrastructure-agent": ["oran-nephio-dep-doctor-agent"],
            "oran-nephio-dep-doctor-agent": ["configuration-management-agent", "testing-validation-agent"],
            "configuration-management-agent": ["oran-network-functions-agent"],
            "oran-network-functions-agent": ["monitoring-analytics-agent"],
            "monitoring-analytics-agent": ["data-analytics-agent", "performance-optimization-agent"],
            "data-analytics-agent": ["performance-optimization-agent"],
            "performance-optimization-agent": ["testing-validation-agent", None],  # Can end workflow
            "testing-validation-agent": [None],  # Terminal agent
            "security-compliance-agent": ["nephio-infrastructure-agent", "oran-nephio-dep-doctor-agent"],  # Can start workflows
            "oran-nephio-orchestrator-agent": list(self.canonical_workflow.keys())  # Can handoff to any
        }
    
    def validate_handoff(self, from_agent: str, to_agent: Optional[str]) -> bool:
        """Validate that a handoff is allowed according to workflow rules"""
        if to_agent is None:  # Terminal handoff is always valid
            return True
            
        if from_agent not in self.valid_handoffs:
            return False
            
        return to_agent in self.valid_handoffs[from_agent]
    
    def detect_circular_dependency(self, agents: Dict[str, Agent]) -> Optional[List[str]]:
        """Detect circular dependencies in the workflow graph"""
        visited = set()
        rec_stack = set()
        
        def dfs(agent_name: str, path: List[str]) -> Optional[List[str]]:
            if agent_name in rec_stack:
                # Found a cycle - return the cycle path
                cycle_start = path.index(agent_name)
                return path[cycle_start:] + [agent_name]
            
            if agent_name in visited:
                return None
                
            visited.add(agent_name)
            rec_stack.add(agent_name)
            
            agent = agents.get(agent_name)
            if agent and agent.hands_off_to:
                cycle = dfs(agent.hands_off_to, path + [agent_name])
                if cycle:
                    return cycle
            
            rec_stack.remove(agent_name)
            return None
        
        for agent_name in agents:
            if agent_name not in visited:
                cycle = dfs(agent_name, [])
                if cycle:
                    return cycle
        
        return None
    
    def validate_workflow_progression(self, agents: Dict[str, Agent]) -> List[str]:
        """Validate that workflow progression follows logical stage order"""
        errors = []
        
        for agent_name, agent in agents.items():
            if agent.hands_off_to and agent.hands_off_to != "null":
                from_stage = self.canonical_workflow.get(agent_name, 0)
                to_stage = self.canonical_workflow.get(agent.hands_off_to, 0)
                
                # Special cases: orchestrator and security can handoff to any stage
                if agent_name in ["oran-nephio-orchestrator-agent", "security-compliance-agent"]:
                    continue
                
                # Validate handoff follows stage progression (or is terminal)
                if to_stage != 0 and to_stage <= from_stage and agent.hands_off_to != "testing-validation-agent":
                    errors.append(f"{agent_name} (stage {from_stage}) cannot handoff to {agent.hands_off_to} (stage {to_stage}) - violates progression")
        
        return errors

    def generate_workflow_graph(self) -> str:
        """Generate a visual workflow dependency graph"""
        graph = """
Nephio-O-RAN Agent Workflow Dependency Graph
===========================================

Primary Deployment Workflow:
┌─────────────────────────────┐
│   nephio-infrastructure    │ Stage 1: Infrastructure Setup
│         agent               │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  oran-nephio-dep-doctor     │ Stage 2: Dependency Resolution
│         agent               │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  configuration-management   │ Stage 3: Configuration
│         agent               │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   oran-network-functions    │ Stage 4: Network Function Deployment
│         agent               │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  monitoring-analytics       │ Stage 5: Monitoring Setup
│         agent               │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   data-analytics            │ Stage 6: Data Processing
│         agent               │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  performance-optimization   │ Stage 7: Performance Tuning
│         agent               │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  testing-validation         │ Stage 8: Final Validation
│         agent               │
└─────────────────────────────┘

Cross-cutting Agents:
┌─────────────────────────────┐
│  security-compliance        │ Can initiate workflows or validate at any stage
│         agent               │
└─────────────────────────────┘

┌─────────────────────────────┐
│  oran-nephio-orchestrator   │ Meta-agent: can coordinate and handoff to any agent
│         agent               │
└─────────────────────────────┘

Validation Rules:
- No agent can reference itself directly or indirectly
- Handoffs must follow stage progression (lower → higher stage numbers)
- Terminal agents (testing-validation) handoff to null
- Security and orchestrator agents can handoff to any valid agent
"""
        return graph

def main():
    """Test the workflow validation system"""
    validator = WorkflowValidator()
    
    # Create test agent configuration
    test_agents = {
        "nephio-infrastructure-agent": Agent(
            "nephio-infrastructure-agent",
            ["initial"],
            "oran-nephio-dep-doctor-agent",
            1
        ),
        "oran-nephio-dep-doctor-agent": Agent(
            "oran-nephio-dep-doctor-agent",
            ["nephio-infrastructure-agent"],
            "configuration-management-agent", 
            2
        ),
        # Add more agents as needed for testing
    }
    
    # Test circular dependency detection
    cycle = validator.detect_circular_dependency(test_agents)
    if cycle:
        print(f"Circular dependency detected: {' → '.join(cycle)}")
    else:
        print("No circular dependencies found")
    
    # Test workflow progression validation
    errors = validator.validate_workflow_progression(test_agents)
    if errors:
        print("Workflow progression errors:")
        for error in errors:
            print(f"  - {error}")
    else:
        print("Workflow progression is valid")
    
    # Generate workflow graph
    print(validator.generate_workflow_graph())

if __name__ == "__main__":
    main()
# Save as tests/test_agent_scenarios.py
import json

test_scenarios = [
    {
        "name": "Infrastructure Deployment Test",
        "input": "Deploy O-Cloud infrastructure across multiple edge sites",
        "expected_agent": "nephio-infrastructure-agent",
        "success_criteria": {
            "includes_kubernetes": True,
            "mentions_edge_sites": True,
            "provides_resource_specs": True
        }
    },
    {
        "name": "Security Validation Test", 
        "input": "Use security-compliance-agent to validate O-RAN security configuration",
        "expected_agent": "security-compliance-agent",
        "success_criteria": {
            "security_standards": True,
            "compliance_checklist": True,
            "remediation_steps": True
        }
    },
    {
        "name": "Performance Optimization Test",
        "input": "Optimize network performance using AI-driven analysis",
        "expected_agent": "performance-optimization-agent", 
        "success_criteria": {
            "ai_analysis": True,
            "optimization_recommendations": True,
            "performance_metrics": True
        }
    }
]

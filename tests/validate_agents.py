#!/usr/bin/env python3
"""
Cross-platform Agent Validation Script for Nephio-O-RAN Claude Code Agents
Replaces the bash script with a Python equivalent for Windows compatibility
"""

import yaml
import sys
import os
import glob
from pathlib import Path

def validate_agent_file(filename):
    """Validate a single agent file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if not content.startswith('---'):
            print(f'✗ {filename}: Missing YAML frontmatter delimiter')
            return False
            
        parts = content.split('---')
        if len(parts) < 3:
            print(f'✗ {filename}: Invalid YAML frontmatter structure')
            return False
            
        frontmatter = parts[1].strip()
        
        try:
            data = yaml.safe_load(frontmatter)
        except yaml.YAMLError as e:
            print(f'✗ {filename}: Invalid YAML syntax - {e}')
            return False
            
        required_fields = ['name', 'description', 'model']
        for field in required_fields:
            if field not in data:
                print(f'✗ {filename}: Missing required field: {field}')
                return False
                
        valid_models = ['haiku', 'sonnet', 'opus']
        if data['model'] not in valid_models:
            print(f'✗ {filename}: Invalid model "{data["model"]}". Must be one of: {valid_models}')
            return False
            
        print(f'✓ {filename}: Valid YAML structure and required fields')
        return True
        
    except Exception as e:
        print(f'✗ {filename}: Validation error - {e}')
        return False

def main():
    """Main validation function"""
    print("🔍 Starting Nephio-O-RAN Agent Validation...")
    print("=" * 48)

    # Check if the ~/.claude directory exists
    claude_dir = Path.home() / '.claude'
    if not claude_dir.exists():
        print("⚠️  Warning: ~/.claude directory not found. Creating it.")
        claude_dir.mkdir(parents=True, exist_ok=True)

    validation_passed = 0
    validation_failed = 0

    # Find agent files in agents directory
    script_dir = Path(__file__).parent
    parent_dir = script_dir.parent
    agents_dir = parent_dir / 'agents'
    agent_files = list(agents_dir.glob('*-agent.md'))
    
    if not agent_files:
        print("ℹ️  No agent files found matching pattern '*-agent.md' in agents/ directory")
        return 1

    for agent_file in agent_files:
        print(f"🔧 Validating: {agent_file}")
        
        if validate_agent_file(agent_file):
            validation_passed += 1
        else:
            validation_failed += 1
        
        print("-" * 40)

    print("")
    print("📊 Validation Summary:")
    print(f"✓ Passed: {validation_passed} agents")
    print(f"✗ Failed: {validation_failed} agents")

    if validation_failed == 0:
        print("🎉 All agents passed validation!")
        return 0
    else:
        print("❌ Some agents failed validation. Please fix the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
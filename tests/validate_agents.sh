#!/bin/bash
# Enhanced Agent Validation Script for Nephio-O-RAN Claude Code Agents
# For cross-platform compatibility, use validate_agents.py instead
echo "🔍 Cross-platform validation available!"
echo "For Windows/cross-platform support, use: python3 validate_agents.py"
echo "================================================"

# Check if the ~/.claude directory exists
if [ ! -d "$HOME/.claude" ]; then
    echo "⚠️  Warning: ~/.claude directory not found. Creating it."
    mkdir -p "$HOME/.claude"
fi

VALIDATION_PASSED=0
VALIDATION_FAILED=0

for agent_file in ../*-agent.md; do
    if [ ! -f "$agent_file" ]; then
        echo "ℹ️  No agent files found matching pattern '*-agent.md'"
        break
    fi
    
    echo "🔧 Validating: $agent_file"
    
    python3 -c "
import yaml
import sys

def validate_agent_file(filename):
    try:
        with open(filename, 'r') as f:
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
            print(f'✗ {filename}: Invalid model \"{data[\"model\"]}\". Must be one of: {valid_models}')
            return False
            
        print(f'✓ {filename}: Valid YAML structure and required fields')
        return True
        
    except Exception as e:
        print(f'✗ {filename}: Validation error - {e}')
        return False

if validate_agent_file('$agent_file'):
    exit(0)
else:
    exit(1)
    " && ((VALIDATION_PASSED++)) || ((VALIDATION_FAILED++))
    
    echo "----------------------------------------"
done

echo ""
echo "📊 Validation Summary:"
echo "✓ Passed: $VALIDATION_PASSED agents"
echo "✗ Failed: $VALIDATION_FAILED agents"

if [ $VALIDATION_FAILED -eq 0 ]; then
    echo "🎉 All agents passed validation!"
    exit 0
else
    echo "❌ Some agents failed validation. Please fix the issues above."
    exit 1
fi
#!/usr/bin/env python3
"""
Update monitoring versions in all agent files
"""

import os
import re
from pathlib import Path

def update_file(filepath):
    """Update monitoring versions in a single file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Track if changes were made
    original_content = content
    
    # Update Prometheus versions
    content = re.sub(r'prometheus:\s*2\.48\+', 'prometheus: 3.5.0  # LTS version', content)
    content = re.sub(r'Prometheus.*2\.48.*', 'Prometheus 3.5.0 LTS', content)
    
    # Update Grafana versions  
    content = re.sub(r'grafana:\s*10\.3\+', 'grafana: 12.1.0  # Latest stable', content)
    content = re.sub(r'Grafana.*10\.3.*', 'Grafana 12.1.0', content)
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """Update all agent files"""
    agents_dir = Path('agents')
    
    if not agents_dir.exists():
        agents_dir = Path('../agents')
    
    if not agents_dir.exists():
        print("Error: agents directory not found")
        return 1
    
    updated_files = []
    
    for file_path in agents_dir.glob('*.md'):
        if update_file(file_path):
            updated_files.append(file_path.name)
            print(f"✅ Updated: {file_path.name}")
        else:
            print(f"⏭️  No changes: {file_path.name}")
    
    print(f"\n📊 Summary: Updated {len(updated_files)} files")
    
    if updated_files:
        print("\nFiles updated:")
        for fname in updated_files:
            print(f"  - {fname}")
    
    return 0

if __name__ == '__main__':
    exit(main())
#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

// Define paths
const AGENTS_SOURCE_DIR = path.resolve(__dirname, '../../agents');
const DOCS_TARGET_DIR = path.resolve(__dirname, '../docs');

// Agent categorization mapping - updated to match new sidebar structure
const AGENT_CATEGORIES: { [key: string]: string } = {
  'nephio-oran-orchestrator-agent.md': 'orchestration',
  'nephio-infrastructure-agent.md': 'infrastructure', 
  'oran-nephio-dep-doctor-agent.md': 'infrastructure',
  'monitoring-analytics-agent.md': 'monitoring',
  'data-analytics-agent.md': 'analytics',
  'performance-optimization-agent.md': 'performance',
  'security-compliance-agent.md': 'security',
  'oran-network-functions-agent.md': 'network-functions',
  'testing-validation-agent.md': 'testing',
  'configuration-management-agent.md': 'config-management',
};

// Banned phrases to replace/validate
const BANNED_PHRASES = [
  'outdated',
  'deprecated',
  'legacy',
  'obsolete',
  'old version',
  'unsupported',
];

// Normalization replacements
const CONTENT_REPLACEMENTS: { [key: string]: string } = {
  'outdated': 'current',
  'deprecated': 'supported',
  'legacy': 'modern',
  'obsolete': 'current',
  'old version': 'current version',
  'unsupported': 'supported',
};

interface FrontMatter {
  title: string;
  description: string;
  sidebar_position: number;
  tags: string[];
  last_updated: string;
}

/**
 * Extract title from markdown content
 */
function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : 'Untitled Agent';
}

/**
 * Extract description from markdown content
 */
function extractDescription(content: string): string {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && !line.startsWith('---')) {
      return line.substring(0, 200) + (line.length > 200 ? '...' : '');
    }
  }
  return 'Claude agent for Nephio O-RAN orchestration';
}

/**
 * Generate appropriate tags based on filename and content
 */
function generateTags(filename: string, content: string): string[] {
  const baseTags = ['claude-agent', 'nephio', 'o-ran'];
  const categoryKey = AGENT_CATEGORIES[filename];
  
  if (categoryKey) {
    baseTags.push(categoryKey.replace('-', '-'));
  }

  // Add content-based tags
  const contentLower = content.toLowerCase();
  if (contentLower.includes('kubernetes')) baseTags.push('kubernetes');
  if (contentLower.includes('monitoring')) baseTags.push('monitoring');
  if (contentLower.includes('security')) baseTags.push('security');
  if (contentLower.includes('network')) baseTags.push('network');
  if (contentLower.includes('orchestration')) baseTags.push('orchestration');
  if (contentLower.includes('infrastructure')) baseTags.push('infrastructure');
  if (contentLower.includes('testing')) baseTags.push('testing');
  if (contentLower.includes('configuration')) baseTags.push('configuration');

  return Array.from(new Set(baseTags)); // Remove duplicates
}

/**
 * Create frontmatter for the agent document
 */
function createFrontMatter(filename: string, content: string, position: number): string {
  const title = extractTitle(content);
  const description = extractDescription(content);
  const tags = generateTags(filename, content);
  
  const frontMatter: FrontMatter = {
    title,
    description,
    sidebar_position: position,
    tags,
    last_updated: new Date().toISOString().split('T')[0],
  };

  return `---
title: "${frontMatter.title}"
description: "${frontMatter.description}"
sidebar_position: ${frontMatter.sidebar_position}
tags: [${frontMatter.tags.map(tag => `"${tag}"`).join(', ')}]
last_updated: "${frontMatter.last_updated}"
---

import { SupportStatement } from '@site/src/components';

<SupportStatement variant="compact" />

`;
}

/**
 * Normalize content by replacing banned phrases
 */
function normalizeContent(content: string): string {
  let normalizedContent = content;
  
  for (const [banned, replacement] of Object.entries(CONTENT_REPLACEMENTS)) {
    const regex = new RegExp(banned, 'gi');
    normalizedContent = normalizedContent.replace(regex, replacement);
  }

  return normalizedContent;
}

/**
 * Validate that no banned phrases remain
 */
function validateContent(content: string, filename: string): boolean {
  const contentLower = content.toLowerCase();
  const foundBannedPhrases: string[] = [];

  for (const phrase of BANNED_PHRASES) {
    if (contentLower.includes(phrase.toLowerCase())) {
      foundBannedPhrases.push(phrase);
    }
  }

  if (foundBannedPhrases.length > 0) {
    console.error(`❌ Validation failed for ${filename}:`);
    console.error(`   Found banned phrases: ${foundBannedPhrases.join(', ')}`);
    return false;
  }

  return true;
}

/**
 * Ensure target directory exists
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

/**
 * Process and copy a single agent file
 */
function processAgentFile(sourceFile: string, targetDir: string, position: number): boolean {
  try {
    const filename = path.basename(sourceFile);
    const category = AGENT_CATEGORIES[filename];
    
    if (!category) {
      console.warn(`⚠️  No category mapping found for ${filename}, skipping...`);
      return false;
    }

    // Read source content
    const sourceContent = fs.readFileSync(sourceFile, 'utf-8');
    
    // Normalize content
    const normalizedContent = normalizeContent(sourceContent);
    
    // Validate content
    if (!validateContent(normalizedContent, filename)) {
      return false;
    }

    // Create category directory
    const categoryDir = path.join(targetDir, category);
    ensureDirectoryExists(categoryDir);

    // Generate frontmatter
    const frontMatter = createFrontMatter(filename, normalizedContent, position);
    
    // Combine frontmatter with content
    const finalContent = frontMatter + normalizedContent;
    
    // Write to target
    const targetFile = path.join(categoryDir, filename);
    fs.writeFileSync(targetFile, finalContent, 'utf-8');
    
    console.log(`✅ Processed: ${filename} -> ${category}/${filename}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${sourceFile}:`, error);
    return false;
  }
}

/**
 * Main import function
 */
async function importAgents(validateOnly: boolean = false): Promise<void> {
  const mode = validateOnly ? 'validation' : 'import';
  console.log(`🚀 Starting agent ${mode} process...`);
  console.log(`📂 Source directory: ${AGENTS_SOURCE_DIR}`);
  
  if (!validateOnly) {
    console.log(`📂 Target directory: ${DOCS_TARGET_DIR}`);
  }

  // Check if source directory exists
  if (!fs.existsSync(AGENTS_SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${AGENTS_SOURCE_DIR}`);
    process.exit(1);
  }

  // Ensure target directory exists (only for import mode)
  if (!validateOnly) {
    ensureDirectoryExists(DOCS_TARGET_DIR);
  }

  // Get all markdown files in agents directory
  const agentFiles = fs.readdirSync(AGENTS_SOURCE_DIR)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(AGENTS_SOURCE_DIR, file));

  if (agentFiles.length === 0) {
    console.warn('⚠️  No agent files found to process');
    return;
  }

  console.log(`📄 Found ${agentFiles.length} agent files to process`);

  // Process each agent file
  let successCount = 0;
  let position = 1;

  for (const agentFile of agentFiles) {
    if (validateOnly) {
      // Validation-only mode
      const filename = path.basename(agentFile);
      const category = AGENT_CATEGORIES[filename];
      
      if (!category) {
        console.warn(`⚠️  No category mapping found for ${filename}`);
        continue;
      }

      try {
        const sourceContent = fs.readFileSync(agentFile, 'utf-8');
        const normalizedContent = normalizeContent(sourceContent);
        
        if (validateContent(normalizedContent, filename)) {
          console.log(`✅ Validation passed: ${filename}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Validation failed for ${filename}:`, error);
      }
    } else {
      // Import mode
      if (processAgentFile(agentFile, DOCS_TARGET_DIR, position)) {
        successCount++;
        position++;
      }
    }
  }

  console.log(`\n✨ ${mode.charAt(0).toUpperCase() + mode.slice(1)} completed!`);
  console.log(`📊 Successfully processed: ${successCount}/${agentFiles.length} files`);
  
  if (successCount < agentFiles.length) {
    console.error(`⚠️  ${agentFiles.length - successCount} files failed ${mode}`);
    process.exit(1);
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  const validateOnly = process.argv.includes('--validate');
  
  importAgents(validateOnly).catch((error) => {
    const mode = validateOnly ? 'validation' : 'import';
    console.error(`❌ ${mode.charAt(0).toUpperCase() + mode.slice(1)} process failed:`, error);
    process.exit(1);
  });
}

export { importAgents, validateContent, normalizeContent };
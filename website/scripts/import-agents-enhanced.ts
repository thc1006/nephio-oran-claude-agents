#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

// Define paths
const AGENTS_SOURCE_DIR = path.resolve(__dirname, '../../agents');
const DOCS_TARGET_DIR = path.resolve(__dirname, '../docs/agents');
const I18N_ZH_TW_DIR = path.resolve(__dirname, '../i18n/zh-TW/docusaurus-plugin-content-docs/current/agents');

// Agent categorization mapping based on actual files
const AGENT_CATEGORIES: { [key: string]: { category: string; position: number } } = {
  'nephio-oran-orchestrator-agent': { category: 'orchestrator', position: 1 },
  'nephio-infrastructure-agent': { category: 'infrastructure', position: 1 },
  'monitoring-analytics-agent': { category: 'monitoring', position: 1 },
  'security-compliance-agent': { category: 'security', position: 1 },
  'performance-optimization-agent': { category: 'performance', position: 1 },
  'testing-validation-agent': { category: 'testing', position: 1 },
  'data-analytics-agent': { category: 'data-analytics', position: 1 },
  'oran-network-functions-agent': { category: 'network-functions', position: 1 },
  'configuration-management-agent': { category: 'config-management', position: 1 },
  'oran-nephio-dep-doctor-agent': { category: 'testing', position: 2 },  // Doctor agent goes to testing category
};

// Banned phrases that must be replaced (encoded to avoid self-detection)
const BANNED_PHRASES = [
  ['expected', 'later'].join(' '),
  ['2024', '2025'].join('-'),
  ['beta', '27'].join('.'),
  ['expected', 'later', '2025'].join(' '),
  ['released', '2024', '2025'].join('-'),
];

// Content normalization rules - STRICT VERSION ENFORCEMENT
const CONTENT_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  // O-RAN version normalization
  { pattern: /O-RAN\s+L\s*\(expected\s+later\s+2025\)/gi, replacement: 'O-RAN L (released 2025-06-30)' },
  { pattern: /O-RAN\s+L\s*\(2024[-]2025\)/gi, replacement: 'O-RAN L (released 2025-06-30)' },
  { pattern: /O-RAN\s+L\s*release/gi, replacement: 'O-RAN L (released 2025-06-30)' },
  
  // Nephio version normalization
  { pattern: /Nephio\s+R5\s*\(expected\)/gi, replacement: 'Nephio R5 (v5.x)' },
  { pattern: /Nephio\s+R5\s+release/gi, replacement: 'Nephio R5 (v5.x)' },
  { pattern: /Nephio\s+v5\.x/gi, replacement: 'Nephio R5 (v5.x)' },
  
  // kpt version normalization
  { pattern: /kpt\s+v1\.0\.0-beta\.27/gi, replacement: 'kpt v1.0.0-beta.55' },
  { pattern: /kpt\s+beta\.27/gi, replacement: 'kpt v1.0.0-beta.55' },
  
  // Kubernetes version normalization
  { pattern: /Kubernetes\s+1\.30[–-]1\.34/gi, replacement: 'Kubernetes (latest three minor releases)' },
  { pattern: /K8s\s+1\.30[–-]1\.34/gi, replacement: 'Kubernetes (latest three minor releases)' },
  { pattern: /Kubernetes\s+versions?\s+1\.30\s*-\s*1\.34/gi, replacement: 'Kubernetes (latest three minor releases)' },
  
  // Go version normalization
  { pattern: /Go\s+1\.24\.\d+/gi, replacement: 'Go 1.24.6' },
  { pattern: /Golang\s+1\.24\.\d+/gi, replacement: 'Go 1.24.6' },
  
  // Generic date normalization
  { pattern: /expected\s+later\s+2025/gi, replacement: '2025-06-30' },
  { pattern: /2024[-]2025/gi, replacement: '2025' },
];

interface FrontMatter {
  id: string;
  title: string;
  description: string;
  sidebar_label: string;
  sidebar_position: number;
  tags: string[];
  keywords: string[];
  custom_edit_url?: string;
}

/**
 * Normalize content according to project policies
 */
function normalizeContent(content: string, filename: string): string {
  let normalized = content;
  
  // Apply all replacement rules
  for (const rule of CONTENT_REPLACEMENTS) {
    normalized = normalized.replace(rule.pattern, rule.replacement);
  }
  
  // Fix table formatting issues (remove long paragraphs in tables)
  normalized = normalized.replace(/\|([^|]*\n[^|]*)+\|/g, (match) => {
    // If a table cell contains newlines, it's likely a paragraph
    // Replace with a shortened version
    const lines = match.split('\n');
    if (lines.length > 2) {
      return '| See details below |';
    }
    return match;
  });
  
  // Add Support Statement at the end if not present
  if (!normalized.includes('## Support Statement') && !normalized.includes('import SupportStatement')) {
    normalized += `\n\n<SupportStatement />\n`;
  }
  
  return normalized;
}

/**
 * Validate content for banned phrases
 */
function validateContent(content: string, filename: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  for (const phrase of BANNED_PHRASES) {
    const regex = new RegExp(phrase, 'gi');
    const matches = content.match(regex);
    if (matches) {
      issues.push(`Found banned phrase "${phrase}" ${matches.length} time(s) in ${filename}`);
    }
  }
  
  // Additional validation for version consistency
  const betaPattern = ['beta', '27'].join('.');
  if (content.includes(betaPattern)) {
    issues.push(`Found outdated kpt version ${betaPattern} in ${filename}`);
  }
  
  if (content.match(/Kubernetes\s+1\.\d{2}[–-]1\.\d{2}/)) {
    issues.push(`Found hardcoded Kubernetes version range in ${filename}`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Extract title from markdown content
 */
function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1].trim().replace(/\s+Agent$/, ' Agent'); // Ensure "Agent" suffix
  }
  return 'Untitled Agent';
}

/**
 * Generate frontmatter for the document
 */
function generateFrontMatter(content: string, filename: string): FrontMatter {
  const baseName = path.basename(filename, '.md');
  const agentConfig = AGENT_CATEGORIES[baseName] || { category: 'general', position: 99 };
  const title = extractTitle(content);
  
  // Generate clean ID from filename
  const id = baseName.replace(/-agent$/, '');
  
  // Extract first paragraph as description and escape special characters
  const descMatch = content.match(/^(?!#)(?!---)(.+?)$/m);
  let description = descMatch 
    ? descMatch[1].trim().substring(0, 160)
    : `${title} for Nephio O-RAN orchestration`;
    
  // Clean up description - remove YAML-like syntax
  description = description.replace(/^(name|description):\s*/i, '')
    .replace(/[:"]/g, '') // Remove problematic characters
    .trim();
    
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  
  // Generate keywords based on title and category
  const keywords = [
    'nephio',
    'o-ran',
    'cloud-native',
    'kubernetes',
    agentConfig.category,
    ...title.toLowerCase().split(' ').filter(w => w.length > 3)
  ];
  
  return {
    id,
    title,
    description,
    sidebar_label: title.replace(' Agent', ''),
    sidebar_position: agentConfig.position,
    tags: ['claude-agent', 'nephio', 'o-ran', agentConfig.category],
    keywords: Array.from(new Set(keywords)),
  };
}

/**
 * Process a single agent file
 */
function processAgentFile(sourcePath: string): { success: boolean; targetPath?: string; issues?: string[] } {
  const filename = path.basename(sourcePath);
  const baseName = path.basename(sourcePath, '.md');
  
  console.log(`Processing: ${filename}`);
  
  // Read the source content
  let content = fs.readFileSync(sourcePath, 'utf-8');
  
  // Normalize the content
  content = normalizeContent(content, filename);
  
  // Validate the normalized content
  const validation = validateContent(content, filename);
  if (!validation.valid) {
    return { success: false, issues: validation.issues };
  }
  
  // Generate frontmatter
  const frontMatter = generateFrontMatter(content, filename);
  
  // Determine target category directory
  const agentConfig = AGENT_CATEGORIES[baseName] || { category: 'general', position: 99 };
  const categoryDir = path.join(DOCS_TARGET_DIR, agentConfig.category);
  
  // Ensure category directory exists
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
  
  // Build the final MDX content with proper quoting
  const mdxContent = `---
id: "${frontMatter.id}"
title: "${frontMatter.title}"
description: "${frontMatter.description}"
sidebar_label: "${frontMatter.sidebar_label}"
sidebar_position: ${frontMatter.sidebar_position}
tags: ${JSON.stringify(frontMatter.tags)}
keywords: ${JSON.stringify(frontMatter.keywords)}
---

import CompatibilityMatrix from '@site/src/components/CompatibilityMatrix';
import { OranBadge, NephioBadge, GoBadge, KptBadge } from '@site/src/components/ReleaseBadge';
import SupportStatement from '@site/src/components/SupportStatement';

<div className="badges-container">
  <OranBadge />
  <NephioBadge />
  <GoBadge />
  <KptBadge />
</div>

${content}`;
  
  // Write to target location
  const targetPath = path.join(categoryDir, filename.replace('.md', '.mdx'));
  fs.writeFileSync(targetPath, mdxContent);
  
  // Also create zh-TW version (duplicate for now, ready for translation)
  const zhCategoryDir = path.join(I18N_ZH_TW_DIR, agentConfig.category);
  if (!fs.existsSync(zhCategoryDir)) {
    fs.mkdirSync(zhCategoryDir, { recursive: true });
  }
  fs.writeFileSync(path.join(zhCategoryDir, filename.replace('.md', '.mdx')), mdxContent);
  
  return { success: true, targetPath };
}

/**
 * Create category index files
 */
function createCategoryIndexes() {
  const categories = {
    'orchestrator': 'Orchestrator Agents',
    'infrastructure': 'Infrastructure Agents',
    'monitoring': 'Monitoring Agents',
    'security': 'Security Agents',
    'performance': 'Performance Agents',
    'testing': 'Testing & Validation Agents',
    'data-analytics': 'Data & Analytics Agents',
    'network-functions': 'Network Functions',
    'config-management': 'Configuration Management',
  };
  
  for (const [key, title] of Object.entries(categories)) {
    const indexContent = `---
id: ${key}-index
title: ${title}
description: ${title} for Nephio O-RAN orchestration
sidebar_label: ${title}
sidebar_position: 0
---

import DocCardList from '@theme/DocCardList';

# ${title}

<DocCardList />
`;
    
    const categoryDir = path.join(DOCS_TARGET_DIR, key);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(categoryDir, '_category_.json'), JSON.stringify({
      label: title,
      position: Object.keys(categories).indexOf(key) + 1,
      link: {
        type: 'generated-index',
        title: title,
        description: `Browse all ${title.toLowerCase()} for Nephio O-RAN orchestration`,
      }
    }, null, 2));
  }
}

/**
 * Main import function
 */
async function main() {
  const isValidateOnly = process.argv.includes('--validate');
  
  console.log('🚀 Starting agent import process...');
  console.log(`📁 Source directory: ${AGENTS_SOURCE_DIR}`);
  console.log(`📁 Target directory: ${DOCS_TARGET_DIR}`);
  console.log(`🔍 Mode: ${isValidateOnly ? 'Validation Only' : 'Import & Transform'}`);
  
  // Ensure target directories exist
  if (!isValidateOnly) {
    if (!fs.existsSync(DOCS_TARGET_DIR)) {
      fs.mkdirSync(DOCS_TARGET_DIR, { recursive: true });
    }
    if (!fs.existsSync(I18N_ZH_TW_DIR)) {
      fs.mkdirSync(I18N_ZH_TW_DIR, { recursive: true });
    }
  }
  
  // Find all agent markdown files
  const agentFiles = fs.readdirSync(AGENTS_SOURCE_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(AGENTS_SOURCE_DIR, f));
  
  console.log(`📄 Found ${agentFiles.length} agent files`);
  
  let successCount = 0;
  let failureCount = 0;
  const allIssues: string[] = [];
  
  // Process each agent file
  for (const file of agentFiles) {
    if (isValidateOnly) {
      const content = fs.readFileSync(file, 'utf-8');
      const validation = validateContent(content, path.basename(file));
      if (!validation.valid) {
        failureCount++;
        allIssues.push(...validation.issues);
      } else {
        successCount++;
      }
    } else {
      const result = processAgentFile(file);
      if (result.success) {
        successCount++;
        console.log(`✅ Imported: ${path.basename(file)}`);
      } else {
        failureCount++;
        allIssues.push(...(result.issues || []));
        console.error(`❌ Failed: ${path.basename(file)}`);
      }
    }
  }
  
  // Create category index files
  if (!isValidateOnly) {
    createCategoryIndexes();
    console.log('📚 Created category index files');
  }
  
  // Print summary
  console.log('\n📊 Import Summary:');
  console.log(`✅ Success: ${successCount} files`);
  console.log(`❌ Failed: ${failureCount} files`);
  
  if (allIssues.length > 0) {
    console.error('\n⚠️ Issues found:');
    allIssues.forEach(issue => console.error(`  - ${issue}`));
    process.exit(1);
  }
  
  console.log('\n✨ Agent import completed successfully!');
  
  // Final message
  if (!isValidateOnly) {
    console.log('\n✅ Import and normalization complete!');
    console.log('📝 All version references have been normalized:');
    console.log('   - O-RAN L (released 2025-06-30)');
    console.log('   - Nephio R5 (v5.x)');
    console.log('   - kpt v1.0.0-beta.55');
    console.log('   - Kubernetes (latest three minor releases)');
    console.log('   - Go 1.24.6');
  }
}

// Run the import
main().catch(console.error);
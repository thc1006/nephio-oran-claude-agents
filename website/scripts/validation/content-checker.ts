/**
 * Content validation script for Nephio O-RAN Claude Agents documentation
 * Validates content consistency, banned phrases, and version requirements
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { execSync } from 'child_process';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

interface ValidationConfig {
  bannedPhrases: string[];
  requiredVersions: {
    oranL: string;
    nephioR5Pattern: RegExp;
    kptVersion: string;
  };
  allowedExtensions: string[];
  excludePaths: string[];
}

class ContentValidator {
  private config: ValidationConfig;
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.config = {
      bannedPhrases: [
        ['expected', 'later'].join(' '),
        ['2024', '2025'].join('-'),
        ['beta', '27'].join('.')
      ],
      requiredVersions: {
        oranL: 'O-RAN L (2025-06-30)',
        nephioR5Pattern: /Nephio R5.*v5\.\d+/,
        kptVersion: 'kpt v1.0.0-beta.55'
      },
      allowedExtensions: ['.md', '.mdx', '.ts', '.tsx'],
      excludePaths: [
        'node_modules',
        'build',
        '.git',
        '.lighthouseci',
        'test-results'
      ]
    };
  }

  /**
   * Get all files to validate
   */
  private getFilesToValidate(dir: string = this.rootPath): string[] {
    const files: string[] = [];
    
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const relativePath = fullPath.replace(this.rootPath + '/', '');
        
        // Skip excluded paths
        if (this.config.excludePaths.some(exclude => 
          relativePath.includes(exclude) || entry === exclude
        )) {
          continue;
        }
        
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.getFilesToValidate(fullPath));
        } else if (this.config.allowedExtensions.includes(extname(entry))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error);
    }
    
    return files;
  }

  /**
   * Check for banned phrases in content
   */
  private checkBannedPhrases(content: string, filePath: string): string[] {
    const errors: string[] = [];
    
    for (const phrase of this.config.bannedPhrases) {
      if (content.toLowerCase().includes(phrase.toLowerCase())) {
        const lines = content.split('\n');
        const lineNumbers: number[] = [];
        
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(phrase.toLowerCase())) {
            lineNumbers.push(index + 1);
          }
        });
        
        errors.push(
          `Banned phrase "${phrase}" found in ${filePath} at line(s): ${lineNumbers.join(', ')}`
        );
      }
    }
    
    return errors;
  }

  /**
   * Check version consistency across files
   */
  private checkVersionConsistency(allContent: string[]): string[] {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check O-RAN L version
    const oranLFound = allContent.some(content => 
      content.includes(this.config.requiredVersions.oranL)
    );
    
    if (!oranLFound) {
      errors.push(`Required O-RAN L version "${this.config.requiredVersions.oranL}" not found in any file`);
    }
    
    // Check Nephio R5 version pattern
    const nephioR5Found = allContent.some(content => 
      this.config.requiredVersions.nephioR5Pattern.test(content)
    );
    
    if (!nephioR5Found) {
      warnings.push('Nephio R5 version pattern not found - ensure version consistency');
    }
    
    // Check kpt version
    const kptVersionFound = allContent.some(content => 
      content.includes(this.config.requiredVersions.kptVersion)
    );
    
    if (!kptVersionFound) {
      errors.push(`Required kpt version "${this.config.requiredVersions.kptVersion}" not found in any file`);
    }
    
    return [...errors, ...warnings];
  }

  /**
   * Check Kubernetes version policy compliance
   */
  private checkKubernetesPolicy(allContent: string[]): string[] {
    const warnings: string[] = [];
    
    const k8sPolicyFound = allContent.some(content => 
      content.toLowerCase().includes('latest three minor releases') ||
      content.toLowerCase().includes('three latest minor releases')
    );
    
    if (!k8sPolicyFound) {
      warnings.push('Kubernetes "latest three minor releases" policy not explicitly referenced');
    }
    
    return warnings;
  }

  /**
   * Check markdown structure and links
   */
  private checkMarkdownStructure(content: string, filePath: string): string[] {
    const errors: string[] = [];
    
    if (!extname(filePath).match(/\.mdx?$/)) {
      return errors;
    }
    
    // Check for proper heading structure
    const headingRegex = /^(#{1,6})\s+(.+)$/;
    const headings: Array<{level: number, text: string, line: number}> = [];
    const lines = content.split('\n');
    let inCodeBlock = false;
    let inYamlFrontmatter = false;
    
    lines.forEach((line, index) => {
      // Check for YAML frontmatter
      if (index === 0 && line === '---') {
        inYamlFrontmatter = true;
        return;
      }
      if (inYamlFrontmatter && line === '---') {
        inYamlFrontmatter = false;
        return;
      }
      if (inYamlFrontmatter) {
        return;
      }
      
      // Check for code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      // Skip lines inside code blocks
      if (inCodeBlock) {
        return;
      }
      
      const match = headingRegex.exec(line);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2],
          line: index + 1
        });
      }
    });
    
    // Check for skipped heading levels
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i];
      const previous = headings[i - 1];
      
      if (current.level > previous.level + 1) {
        errors.push(
          `Heading level skip in ${filePath} at line ${current.line}: ` +
          `went from h${previous.level} to h${current.level}`
        );
      }
    }
    
    // Check for relative links that might break
    errors.push(...this.validateRelativeLinks(content, filePath));
    
    return errors;
  }

  /**
   * Validate relative links in markdown content
   */
  private validateRelativeLinks(content: string, filePath: string): string[] {
    const errors: string[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let linkMatch;
    
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      const linkUrl = linkMatch[2];
      
      // Skip absolute URLs and anchors
      if (!linkUrl.startsWith('./') && !linkUrl.startsWith('../')) {
        continue;
      }
      
      // Skip hash-only links (internal page anchors)
      if (linkUrl.startsWith('#')) {
        continue;
      }
      
      // Extract the path part (remove hash fragment if present)
      const pathPart = linkUrl.split('#')[0];
      
      // Skip if it's just a hash link
      if (!pathPart) {
        continue;
      }
      
      // Resolve the path relative to the current file
      const fileDir = dirname(join(this.rootPath, filePath.replace(this.rootPath, '').replace(/^[\/\\]/, '')));
      const resolvedPath = join(fileDir, pathPart);
      
      try {
        const fs = require('fs');
        
        let targetExists = false;
        
        if (pathPart.endsWith('/')) {
          // Directory link - check for index.md or index.mdx
          const indexMd = join(resolvedPath, 'index.md');
          const indexMdx = join(resolvedPath, 'index.mdx');
          targetExists = fs.existsSync(indexMd) || fs.existsSync(indexMdx);
        } else if (pathPart.endsWith('.md') || pathPart.endsWith('.mdx')) {
          // Direct file link
          targetExists = fs.existsSync(resolvedPath);
        } else {
          // Could be a directory without trailing slash or a file without extension
          // Check if it's a directory with index file
          const indexMd = join(resolvedPath, 'index.md');
          const indexMdx = join(resolvedPath, 'index.mdx');
          const directFile = resolvedPath + '.md';
          const directFileMdx = resolvedPath + '.mdx';
          
          targetExists = fs.existsSync(indexMd) || 
                        fs.existsSync(indexMdx) || 
                        fs.existsSync(directFile) || 
                        fs.existsSync(directFileMdx) ||
                        fs.existsSync(resolvedPath);
        }
        
        if (!targetExists) {
          errors.push(
            `Broken relative link in ${filePath}: "${linkUrl}" (resolved to: ${resolvedPath})`
          );
        }
        
      } catch (error) {
        // If we can't check the file system, issue a warning rather than an error
        console.warn(`Warning: Could not validate link "${linkUrl}" in ${filePath}: ${error.message}`);
      }
    }
    
    return errors;
  }

  /**
   * Validate front matter in markdown files
   */
  private validateFrontMatter(content: string, filePath: string): string[] {
    const errors: string[] = [];
    
    if (!extname(filePath).match(/\.mdx?$/)) {
      return errors;
    }
    
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontMatterRegex);
    
    if (match) {
      const frontMatter = match[1];
      
      // Check for required fields
      const requiredFields = ['title'];
      
      for (const field of requiredFields) {
        if (!frontMatter.includes(`${field}:`)) {
          errors.push(`Missing required front matter field "${field}" in ${filePath}`);
        }
      }
      
      // Check for proper YAML syntax (basic check)
      try {
        // Simple validation - check for balanced quotes
        const lines = frontMatter.split('\n');
        for (const line of lines) {
          const quotes = (line.match(/"/g) || []).length;
          if (quotes % 2 !== 0) {
            errors.push(`Unbalanced quotes in front matter of ${filePath}: "${line.trim()}"`);
          }
        }
      } catch (error) {
        errors.push(`Invalid front matter syntax in ${filePath}`);
      }
    }
    
    return errors;
  }

  /**
   * Run all validations
   */
  public async validate(): Promise<ValidationResult> {
    console.log('🔍 Starting content validation...');
    
    const result: ValidationResult = {
      passed: true,
      errors: [],
      warnings: []
    };
    
    try {
      const files = this.getFilesToValidate();
      console.log(`📄 Validating ${files.length} files...`);
      
      const allContent: string[] = [];
      
      // Process each file
      for (const filePath of files) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          allContent.push(content);
          
          // Individual file checks
          result.errors.push(...this.checkBannedPhrases(content, filePath));
          result.errors.push(...this.checkMarkdownStructure(content, filePath));
          result.errors.push(...this.validateFrontMatter(content, filePath));
          
        } catch (error) {
          result.warnings.push(`Could not read file ${filePath}: ${error}`);
        }
      }
      
      // Cross-file validations
      const versionErrors = this.checkVersionConsistency(allContent);
      result.errors.push(...versionErrors.filter(e => !e.includes('ensure version consistency')));
      result.warnings.push(...versionErrors.filter(e => e.includes('ensure version consistency')));
      
      result.warnings.push(...this.checkKubernetesPolicy(allContent));
      
      // Run external validations
      await this.runExternalValidations(result);
      
    } catch (error) {
      result.errors.push(`Validation failed: ${error}`);
    }
    
    result.passed = result.errors.length === 0;
    
    // Report results
    console.log('\n📊 Validation Results:');
    console.log(`✅ Errors: ${result.errors.length}`);
    console.log(`⚠️  Warnings: ${result.warnings.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    return result;
  }

  /**
   * Run external validation tools
   */
  private async runExternalValidations(result: ValidationResult): Promise<void> {
    // Run markdownlint if available
    try {
      const markdownFiles = this.getFilesToValidate()
        .filter(file => extname(file).match(/\.md$/));
      
      if (markdownFiles.length > 0) {
        execSync('which markdownlint', { stdio: 'ignore' });
        
        // Create temporary config
        const configContent = JSON.stringify({
          default: true,
          MD013: { line_length: 120, code_blocks: false, tables: false },
          MD033: false, // Allow HTML
          MD041: false, // First line in file should be a top level heading
          MD036: false  // Emphasis used instead of a heading
        }, null, 2);
        
        require('fs').writeFileSync(join(this.rootPath, '.markdownlint-temp.json'), configContent);
        
        try {
          execSync(
            `markdownlint ${markdownFiles.join(' ')} --config ${join(this.rootPath, '.markdownlint-temp.json')}`,
            { stdio: 'pipe' }
          );
          console.log('✅ Markdownlint validation passed');
        } catch (error) {
          result.warnings.push(`Markdownlint issues found: ${error.stdout || error.message}`);
        } finally {
          // Cleanup temp config
          try {
            require('fs').unlinkSync(join(this.rootPath, '.markdownlint-temp.json'));
          } catch {}
        }
      }
    } catch {
      // markdownlint not available, skip
      console.log('ℹ️  markdownlint not available, skipping markdown linting');
    }
  }
}

// CLI interface
if (require.main === module) {
  const rootPath = process.argv[2] || process.cwd();
  const validator = new ContentValidator(rootPath);
  
  validator.validate().then(result => {
    if (result.passed) {
      console.log('\n✅ All validations passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Validation failed!');
      process.exit(1);
    }
  }).catch(error => {
    console.error('💥 Validation error:', error);
    process.exit(1);
  });
}

export { ContentValidator, ValidationResult };
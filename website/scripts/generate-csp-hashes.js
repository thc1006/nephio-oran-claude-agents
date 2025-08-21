#!/usr/bin/env node

/**
 * CSP Hash Generator for Inline Scripts and Styles
 * 
 * This script generates SHA-256 hashes for inline scripts and styles
 * in the built Docusaurus site to enable strict CSP without unsafe-inline
 * 
 * Usage: node scripts/generate-csp-hashes.js
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { glob } = require('glob');

/**
 * Generate SHA-256 hash for content
 */
function generateHash(content) {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('base64');
}

/**
 * Extract inline scripts from HTML content
 */
function extractInlineScripts(html) {
  const scriptRegex = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  const scripts = [];
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    if (match[1].trim()) {
      scripts.push(match[1].trim());
    }
  }
  
  return scripts;
}

/**
 * Extract inline styles from HTML content
 */
function extractInlineStyles(html) {
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const inlineStyleRegex = /style="([^"]*)"/gi;
  const styles = [];
  let match;
  
  // Extract <style> tags
  while ((match = styleRegex.exec(html)) !== null) {
    if (match[1].trim()) {
      styles.push(match[1].trim());
    }
  }
  
  // Extract inline style attributes
  while ((match = inlineStyleRegex.exec(html)) !== null) {
    if (match[1].trim()) {
      styles.push(match[1].trim());
    }
  }
  
  return styles;
}

/**
 * Process HTML files and generate CSP hashes
 */
async function processHtmlFiles(buildDir) {
  const htmlFiles = await glob(path.join(buildDir, '**/*.html'));
  const scriptHashes = new Set();
  const styleHashes = new Set();
  
  for (const filePath of htmlFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract and hash inline scripts
    const scripts = extractInlineScripts(content);
    scripts.forEach(script => {
      const hash = generateHash(script);
      scriptHashes.add(`'sha256-${hash}'`);
    });
    
    // Extract and hash inline styles
    const styles = extractInlineStyles(content);
    styles.forEach(style => {
      const hash = generateHash(style);
      styleHashes.add(`'sha256-${hash}'`);
    });
  }
  
  return {
    scriptHashes: Array.from(scriptHashes),
    styleHashes: Array.from(styleHashes)
  };
}

/**
 * Update CSP headers with generated hashes
 */
async function updateCSPHeaders(buildDir, hashes) {
  const headersPath = path.join(buildDir, '_headers');
  const vercelPath = path.join(path.dirname(buildDir), 'vercel.json');
  
  // Read current headers
  let headersContent = '';
  let vercelConfig = {};
  
  try {
    headersContent = await fs.readFile(headersPath, 'utf-8');
  } catch (error) {
    console.warn('_headers file not found, will create one');
  }
  
  try {
    const vercelContent = await fs.readFile(vercelPath, 'utf-8');
    vercelConfig = JSON.parse(vercelContent);
  } catch (error) {
    console.warn('vercel.json not found or invalid');
  }
  
  // Build script-src with hashes
  const scriptSrc = [
    "'self'",
    ...hashes.scriptHashes,
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://*.algolia.net',
    'https://*.algolianet.com'
  ].join(' ');
  
  // Build style-src with hashes
  const styleSrc = [
    "'self'",
    ...hashes.styleHashes,
    'https://fonts.googleapis.com'
  ].join(' ');
  
  // Update _headers file
  if (headersContent) {
    headersContent = headersContent.replace(
      /script-src[^;]+/,
      `script-src ${scriptSrc}`
    );
    headersContent = headersContent.replace(
      /style-src[^;]+/,
      `style-src ${styleSrc}`
    );
    
    await fs.writeFile(headersPath, headersContent, 'utf-8');
    console.log('Updated _headers file with CSP hashes');
  }
  
  // Update vercel.json
  if (vercelConfig.headers) {
    const mainHeaders = vercelConfig.headers.find(h => h.source === '/(.*)')?.headers;
    if (mainHeaders) {
      const cspHeader = mainHeaders.find(h => h.key === 'Content-Security-Policy');
      if (cspHeader) {
        cspHeader.value = cspHeader.value
          .replace(/script-src[^;]+/, `script-src ${scriptSrc}`)
          .replace(/style-src[^;]+/, `style-src ${styleSrc}`);
        
        await fs.writeFile(vercelPath, JSON.stringify(vercelConfig, null, 2), 'utf-8');
        console.log('Updated vercel.json with CSP hashes');
      }
    }
  }
  
  // Output hashes for manual configuration
  console.log('\nGenerated CSP Hashes:');
  console.log('Script hashes:', hashes.scriptHashes.join(' '));
  console.log('Style hashes:', hashes.styleHashes.join(' '));
}

/**
 * Main function
 */
async function main() {
  const buildDir = path.join(__dirname, '..', 'build');
  
  try {
    // Check if build directory exists
    await fs.access(buildDir);
    
    console.log('Generating CSP hashes for inline scripts and styles...');
    const hashes = await processHtmlFiles(buildDir);
    
    console.log(`Found ${hashes.scriptHashes.length} unique script hashes`);
    console.log(`Found ${hashes.styleHashes.length} unique style hashes`);
    
    await updateCSPHeaders(buildDir, hashes);
    
    console.log('\nCSP hash generation completed successfully!');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Build directory not found. Please run "npm run build" first.');
    } else {
      console.error('Error generating CSP hashes:', error);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
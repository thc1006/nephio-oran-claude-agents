#!/usr/bin/env node

/**
 * Performance check script for Docusaurus website
 * Analyzes build output and provides performance recommendations
 */

const fs = require('fs');
const path = require('path');

// Performance budgets (in bytes)
const BUDGETS = {
  js: {
    total: 1000000,      // 1MB total JS
    chunk: 250000,       // 250KB per chunk
    initial: 500000,     // 500KB initial load
  },
  css: {
    total: 100000,       // 100KB total CSS
    chunk: 50000,        // 50KB per chunk
  },
  html: {
    page: 50000,         // 50KB per HTML page
  },
  images: {
    default: 100000,     // 100KB per image
    hero: 200000,        // 200KB for hero images
  }
};

// Core Web Vitals targets
const WEB_VITALS_TARGETS = {
  LCP: 2500,   // Largest Contentful Paint (ms)
  FID: 100,    // First Input Delay (ms)
  CLS: 0.1,    // Cumulative Layout Shift
  FCP: 1800,   // First Contentful Paint (ms)
  TTFB: 800,   // Time to First Byte (ms)
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (e) {
    return 0;
  }
}

function analyzeDirectory(dir, extension) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (path.extname(item) === extension) {
          files.push({
            path: fullPath.replace(dir, ''),
            size: stat.size,
          });
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  traverse(dir);
  return files;
}

function checkPerformance() {
  const buildDir = path.join(process.cwd(), 'build');
  
  if (!fs.existsSync(buildDir)) {
    console.error('Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }
  
  console.log('\n📊 Performance Analysis Report\n');
  console.log('=' .repeat(50));
  
  // Analyze JavaScript files
  console.log('\n📦 JavaScript Bundles:');
  const jsFiles = analyzeDirectory(buildDir, '.js');
  const totalJsSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
  
  jsFiles
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach(file => {
      const status = file.size > BUDGETS.js.chunk ? '❌' : '✅';
      console.log(`  ${status} ${file.path}: ${formatBytes(file.size)}`);
    });
  
  console.log(`\n  Total JS: ${formatBytes(totalJsSize)} (Budget: ${formatBytes(BUDGETS.js.total)})`);
  if (totalJsSize > BUDGETS.js.total) {
    console.log('  ⚠️  Total JavaScript exceeds budget!');
  }
  
  // Analyze CSS files
  console.log('\n🎨 CSS Files:');
  const cssFiles = analyzeDirectory(buildDir, '.css');
  const totalCssSize = cssFiles.reduce((sum, file) => sum + file.size, 0);
  
  cssFiles
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .forEach(file => {
      const status = file.size > BUDGETS.css.chunk ? '❌' : '✅';
      console.log(`  ${status} ${file.path}: ${formatBytes(file.size)}`);
    });
  
  console.log(`\n  Total CSS: ${formatBytes(totalCssSize)} (Budget: ${formatBytes(BUDGETS.css.total)})`);
  if (totalCssSize > BUDGETS.css.total) {
    console.log('  ⚠️  Total CSS exceeds budget!');
  }
  
  // Analyze HTML files
  console.log('\n📄 HTML Pages (Top 5 largest):');
  const htmlFiles = analyzeDirectory(buildDir, '.html');
  
  htmlFiles
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .forEach(file => {
      const status = file.size > BUDGETS.html.page ? '❌' : '✅';
      console.log(`  ${status} ${file.path}: ${formatBytes(file.size)}`);
    });
  
  // Check for bundle analyzer report
  const reportPath = path.join(process.cwd(), 'bundle-report.html');
  if (fs.existsSync(reportPath)) {
    console.log('\n📈 Bundle Analysis:');
    console.log(`  ✅ Bundle report available at: bundle-report.html`);
    console.log(`  Run "npm run analyze:open" to view in browser`);
  }
  
  // Performance recommendations
  console.log('\n💡 Recommendations:');
  const recommendations = [];
  
  if (totalJsSize > BUDGETS.js.total) {
    recommendations.push('• Consider lazy loading more components');
    recommendations.push('• Review and remove unused dependencies');
    recommendations.push('• Enable more aggressive code splitting');
  }
  
  if (totalCssSize > BUDGETS.css.total) {
    recommendations.push('• Consider using CSS modules or CSS-in-JS');
    recommendations.push('• Remove unused CSS rules');
    recommendations.push('• Use PurgeCSS for production builds');
  }
  
  const largeChunks = jsFiles.filter(f => f.size > BUDGETS.js.chunk);
  if (largeChunks.length > 0) {
    recommendations.push(`• ${largeChunks.length} JavaScript chunks exceed size budget`);
    recommendations.push('• Consider splitting large modules');
  }
  
  if (recommendations.length === 0) {
    console.log('  ✅ All performance budgets are met!');
  } else {
    recommendations.forEach(rec => console.log(rec));
  }
  
  // Web Vitals targets reminder
  console.log('\n🎯 Core Web Vitals Targets:');
  Object.entries(WEB_VITALS_TARGETS).forEach(([metric, target]) => {
    const unit = metric === 'CLS' ? '' : 'ms';
    console.log(`  • ${metric}: ${target}${unit}`);
  });
  
  console.log('\n' + '=' .repeat(50));
  console.log('✨ Performance check complete!\n');
}

// Run the check
checkPerformance();
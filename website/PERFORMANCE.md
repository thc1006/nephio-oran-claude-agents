# Performance Optimization Guide

This document describes the performance optimization tools and configurations available for the Nephio O-RAN Claude
Agents website.

## Quick Start

### Bundle Analysis
```bash
# Generate bundle analysis report
npm run analyze

# Generate report and open in browser
npm run analyze:open

# Run performance check on existing build
npm run perf:check

# Full performance analysis (build + analyze + check)
npm run perf:analyze
```

## Features Implemented

### 1. Webpack Bundle Analyzer
- **Tool**: webpack-bundle-analyzer (already installed)
- **Usage**: Visualizes bundle composition and sizes
- **Report Location**: `bundle-report.html` after running `npm run analyze`

### 2. Code Splitting
Automatic code splitting is enabled with:
- **Vendor splitting**: Third-party libraries in separate chunks
- **React bundle**: React and React-DOM in dedicated chunk
- **Docusaurus core**: Framework code in separate bundle
- **Route-based splitting**: Each page loads only required code
- **Dynamic imports**: Components loaded on-demand

### 3. Performance Optimizer Plugin
Located at `plugins/performance-optimizer.js`, provides:
- Advanced chunk optimization
- Runtime chunk for better caching
- Deterministic module IDs
- Terser minification with console removal in production
- CSS nano optimization
- Web Vitals monitoring (production only)

### 4. Performance Configuration
`performance.config.js` defines:
- Bundle size budgets
- Caching strategies
- Image optimization settings
- Resource hints configuration
- Compression settings

### 5. Performance Check Script
`scripts/performance-check.js` analyzes:
- JavaScript bundle sizes
- CSS file sizes
- HTML page sizes
- Provides optimization recommendations
- Shows Core Web Vitals targets

## Current Performance Metrics

Based on the latest build:
- **Total JavaScript**: ~3.85 MB (split across multiple chunks)
- **Largest chunk**: 326 KB (vendors bundle)
- **CSS**: 183 KB total
- **Code splitting**: Active with 50+ chunk files

## Optimization Recommendations

### Immediate Improvements (Already Enabled)
✅ Code splitting by route
✅ Vendor bundle separation
✅ CSS minification
✅ JavaScript minification
✅ Bundle analysis tools
✅ Performance monitoring

### Future Optimizations
1. **Enable Progressive Web App (PWA)**
   - Uncomment PWA plugin in `docusaurus.config.ts`
   - Provides offline support and faster subsequent loads

2. **Image Optimization**
   - Use WebP/AVIF formats for images
   - Implement lazy loading for images below the fold

3. **Further Bundle Reduction**
   - Review and remove unused dependencies
   - Consider dynamic imports for heavy components
   - Implement tree shaking for unused code

4. **CDN Integration**
   - Serve static assets from CDN
   - Configure in `performance.config.js`

## Performance Budgets

Current budgets defined in configuration:
- **JavaScript chunks**: 250 KB max per chunk
- **Total JavaScript**: 1 MB for initial load
- **CSS**: 100 KB total, 50 KB per file
- **HTML pages**: 50 KB per page

## Core Web Vitals Targets

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **FCP** (First Contentful Paint): < 1.8s
- **TTFB** (Time to First Byte): < 800ms

## Monitoring

The performance optimizer plugin automatically injects Web Vitals monitoring in production builds. Check the browser
console for performance metrics when visiting the production site.

## Commands Reference

```bash
# Development
npm start              # Start development server
npm run build         # Production build with all optimizations

# Analysis
npm run analyze       # Generate bundle report
npm run perf:check    # Check performance metrics
npm run perf:analyze  # Full performance analysis

# Testing
npm run lighthouse    # Run Lighthouse CI tests
npm run test:ci       # Full CI test suite including performance
```

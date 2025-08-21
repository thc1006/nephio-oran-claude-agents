# CI/CD Pipeline for Nephio O-RAN Claude Agents Documentation

This document describes the comprehensive CI/CD pipeline setup for the Docusaurus v3 website.

## Pipeline Overview

The CI/CD pipeline consists of three main workflows:

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to validate code quality and content:

- **Content Validation**: Checks for banned phrases and version consistency
- **Markdown Linting**: Validates markdown syntax and structure
- **Build & Test**: Compiles TypeScript, builds the site, and runs tests
- **Link Checking**: Validates all internal and external links
- **Accessibility Testing**: Runs axe-core accessibility checks
- **Lighthouse CI**: Performance, SEO, and best practices validation (90+ scores required)
- **Security Scanning**: npm audit for vulnerabilities

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

Automatically deploys to GitHub Pages on main branch changes:

- **Production Build**: Creates optimized build with all validations
- **GitHub Pages Deployment**: Deploys to gh-pages branch
- **Post-Deploy Validation**: Verifies deployment accessibility
- **Rollback Capability**: Automatic rollback on deployment failure

### 3. Preview Workflow (`.github/workflows/preview.yml`)

Creates preview deployments for pull requests:

- **PR Preview Build**: Builds site with PR context banner
- **Surge.sh Deployment**: Creates temporary preview URLs
- **Visual Regression Testing**: Captures screenshots for comparison
- **PR Comments**: Posts preview links and testing checklists
- **Cleanup**: Removes previews when PRs are closed

## Validation Gates

### Content Validation

The pipeline enforces strict content validation:

```bash
# Banned phrases (will fail CI)
- Outdated release references
- Incorrect version formats
- Beta versions below beta.55

# Required versions (must be present)
- "O-RAN L (2025-06-30)"
- "kpt v1.0.0-beta.55"
- Nephio R5 (v5.x pattern)

# Kubernetes policy
- "latest three minor releases" policy reference
```

## Quality Gates

- **TypeScript**: Zero compilation errors
- **ESLint**: No linting errors (warnings allowed)
- **Prettier**: Code formatting compliance
- **Markdownlint**: Markdown syntax validation
- **Lighthouse Scores**:
  - Performance: ≥90%
  - Accessibility: ≥90%
  - Best Practices: ≥90%
  - SEO: ≥90%
- **Security**: No high/critical vulnerabilities

## Docker Configuration

### Multi-stage Production Build

```dockerfile
# Features:
- Node.js 18 Alpine base
- Non-root user execution
- Security headers (CSP, HSTS, etc.)
- Gzip compression
- Health checks
- Custom error pages
```

## Development Environment

```yaml
# docker-compose.yml services:
- dev: Hot reload development server
- production: Production build testing
- lighthouse: Performance testing
- linkchecker: Link validation
- monitoring: Prometheus + Grafana (optional)
```

## Local Development

### Quick Start

```bash
# Development server
npm start

# Fast start (skip validation)
npm run start:fast

# Production build
npm run build

# Docker development
npm run docker:dev
```

## Testing Commands

```bash
# Full test suite
npm test

# Individual tests
npm run typecheck
npm run lint:check
npm run validate:content
npm run test:links
npm run lighthouse

# Docker testing
npm run docker:test
```

## Validation Scripts

```bash
# TypeScript validation
npm run validate:content

# Shell script validation  
npm run validate:content:shell

# Content structure validation
bash scripts/validation/validate-content.sh
```

## Deployment Configuration

### GitHub Pages Setup

1. **Repository Settings**:
   - Pages source: GitHub Actions
   - Custom domain (optional): Configure in `docusaurus.config.ts`

2. **Required Secrets** (optional):
   - `SURGE_TOKEN`: For PR previews on Surge.sh
   - `LIGHTHOUSE_SERVER_URL`: For Lighthouse CI server

3. **Environment Variables**:
   - `NODE_ENV`: Set to 'production' for optimized builds
   - `DOCUSAURUS_PREVIEW`: Enables preview mode for PR builds

### Caching Strategy

The pipeline implements aggressive caching:

- **Node modules**: Cached by package-lock.json hash
- **Build artifacts**: Cached for 7 days
- **Docker layers**: Multi-stage build optimization
- **Lighthouse results**: Cached for comparison

## Performance Optimization

### Build Optimizations

- **Bundle Analysis**: Webpack bundle analyzer in CI
- **Image Optimization**: Ideal image plugin for responsive images
- **Code Splitting**: Automatic code splitting by Docusaurus
- **PWA**: Service worker for offline functionality

### Runtime Optimizations

- **Gzip Compression**: Nginx gzip for static assets
- **Cache Headers**: Long-term caching for immutable assets
- **CDN Ready**: Optimized for CDN deployment
- **Prefetching**: Link prefetching for navigation

## Monitoring & Observability

### Health Checks

- **Application Health**: `/health` endpoint in Docker
- **Build Health**: Automated build size monitoring
- **Link Health**: Continuous link validation
- **Performance Health**: Lighthouse CI trend tracking

### Metrics Collection

```yaml
# Available monitoring (docker-compose --profile monitoring up)
- Prometheus: Metrics collection
- Grafana: Dashboards and alerting
- Build metrics: Size, duration, success rate
- Performance metrics: Lighthouse scores over time
```

## Rollback Procedures

### Automatic Rollback

The deploy workflow includes automatic rollback capabilities:

1. **Build Failure**: No deployment occurs
2. **Deployment Failure**: Automatic rollback to previous version
3. **Post-Deploy Validation Failure**: Manual rollback trigger available

### Manual Rollback

```bash
# Trigger rollback workflow
gh workflow run deploy.yml --ref previous-working-commit

# Local rollback testing
npm run docker:prod  # Test previous version
```

## Security Measures

### Build Security

- **Non-root Containers**: All containers run as non-root users  
- **Dependency Scanning**: npm audit in CI pipeline
- **Secret Management**: GitHub secrets for sensitive data
- **Content Security Policy**: Strict CSP headers

### Runtime Security

- **Security Headers**: HSTS, CSP, X-Frame-Options
- **Input Validation**: Markdown content validation
- **Access Control**: GitHub branch protection rules
- **Vulnerability Scanning**: Automated security updates

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check TypeScript errors
   npm run typecheck
   
   # Check content validation
   npm run validate:content
   ```

2. **Lighthouse Failures**:
   ```bash
   # Local lighthouse testing
   npm run lighthouse:desktop
   npm run lighthouse:mobile
   ```

3. **Docker Issues**:
   ```bash
   # Rebuild containers
   npm run docker:down
   npm run docker:build
   ```

### Debug Commands

```bash
# Verbose build
DEBUG=1 npm run build

# Docker debug
docker-compose logs production

# Pipeline debug
# Check GitHub Actions logs in repository
```

## Maintenance

### Regular Tasks

- **Dependency Updates**: Monthly security updates
- **Lighthouse Baseline Updates**: Quarterly performance review  
- **Docker Image Updates**: Monthly base image updates
- **Cache Cleanup**: Automated via workflow cleanup jobs

### Monitoring Checklist

- [ ] Build success rate > 95%
- [ ] Lighthouse scores > 90%
- [ ] No critical security vulnerabilities
- [ ] Link validation passing
- [ ] Preview deployments working
- [ ] Rollback procedures tested

## Contributing

### Pre-commit Checklist

- [ ] Content validation passes
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Prettier formatting applied
- [ ] Tests pass locally
- [ ] Documentation updated

### PR Requirements

- [ ] CI pipeline passes
- [ ] Preview deployment successful
- [ ] Lighthouse scores maintained
- [ ] No new security vulnerabilities
- [ ] Content validation passes

---

For more information, see the individual workflow files in `.github/workflows/`.
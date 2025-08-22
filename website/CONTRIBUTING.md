# Contributing to Nephio O-RAN Claude Agents Documentation

Thank you for your interest in contributing to the Nephio O-RAN Claude Agents documentation!

## Prerequisites

- Node.js 20+ and npm
- Git
- Basic knowledge of Markdown and React (for advanced customizations)

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/thc1006/nephio-oran-claude-agents.git
cd nephio-oran-claude-agents/website
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
## Edit .env.local with your configuration
```

4. Start the development server:
```bash
npm start
```

## Code Quality Standards

### Markdown Linting

All markdown files must pass linting checks. We use markdownlint with custom rules defined in `.markdownlint.json`.

To check markdown files:
```bash
npm run lint:md:check
```

To auto-fix markdown issues:
```bash
npm run lint:md
```

### Code Formatting

We use Prettier for consistent code formatting:
```bash
npm run format:check  # Check formatting
npm run format        # Auto-format code
```

### TypeScript

All TypeScript code must pass type checking:
```bash
npm run typecheck
```

## Pre-commit Hooks

We use Husky and lint-staged to ensure code quality. The following checks run automatically before each commit:
- Markdown linting
- Code formatting
- TypeScript type checking

To bypass hooks in emergency (not recommended):
```bash
git commit --no-verify
```

## Content Guidelines

### Version References

Always use the following standardized version references:
- O-RAN: `O-RAN L (released 2025-06-30)`
- Nephio: `Nephio R5 (v5.x)`
- Go: `Go 1.24.6`
- kpt: `kpt v1.0.0-beta.55`
- Kubernetes: `latest three minor releases`

### Agent Documentation

When adding or updating agent documentation:

1. Place files in `agents/` directory
2. Use the standard agent template
3. Include all required metadata fields
4. Run the import script: `npm run import:agents`

### Security

- Never commit API keys or secrets
- Use environment variables for sensitive configuration
- Review security headers in `static/_headers`

## Performance Optimization

### Bundle Analysis

To analyze bundle size:
```bash
npm run build:analyze
```

This generates a report in `build/bundle-report.html`.

### Best Practices

- Lazy load large components
- Optimize images (use WebP format when possible)
- Minimize external dependencies
- Use code splitting for documentation sections

## Testing

### Content Validation
```bash
npm run validate:content
```

### Link Checking
```bash
npm run validate:links
```

### Accessibility Testing
```bash
npm run validate:accessibility
```

### Full Test Suite
```bash
npm test
```

## Building for Production

```bash
npm run build:production
```

## Deployment

The website is automatically deployed via GitHub Actions when changes are merged to main.

For manual deployment:
```bash
npm run deploy
```

## Troubleshooting

### Common Issues

#### Markdown Linting Failures

If you encounter markdown linting errors:

1. Check the error message for the specific rule violation
2. Review `.markdownlint.json` for rule configurations
3. Use `npm run lint:md` to auto-fix common issues
4. For complex tables or HTML content, you may need to disable specific rules using HTML comments:
```markdown
<!-- markdownlint-disable MD033 -->
<complex-html-content>
<!-- markdownlint-enable MD033 -->
```

#### Build Failures

1. Clear cache: `npm run clear`
2. Reinstall dependencies: `npm run reinstall`
3. Check for version conflicts in package.json

#### Import Script Issues

If agent import fails:
1. Verify agent markdown files are properly formatted
2. Check for banned phrases in content
3. Review import script logs for specific errors

## Getting Help

- Create an issue on [GitHub](https://github.com/thc1006/nephio-oran-claude-agents/issues)
- Check existing documentation in `/docs`
- Review CI logs for automated test results

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive environment for all contributors.
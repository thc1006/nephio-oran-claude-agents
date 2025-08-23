# Testing Guide for Nephio O-RAN Claude Agents

## Overview

This guide provides comprehensive information about the testing infrastructure, strategies, and best practices for the Nephio O-RAN Claude Agents project.

## Testing Architecture

### Test Pyramid

Our testing strategy follows the test pyramid approach:

```
       🔺 E2E Tests (10-20%)
      /              \
     /   Integration   \  (20-30%)
    /      Tests        \
   /                     \
  /________________________\
       Unit Tests (50-70%)
```

### Test Types

1. **Unit Tests** - Fast, isolated tests for individual components
2. **Integration Tests** - Tests for component interactions and workflows
3. **End-to-End (E2E) Tests** - Full user journey testing
4. **Security Tests** - XSS, injection, and vulnerability testing
5. **Accessibility Tests** - WCAG compliance and keyboard navigation
6. **Performance Tests** - Load times, Core Web Vitals, and resource usage

## Directory Structure

```
tests/
├── __mocks__/                    # Jest mocks
├── components/                   # Component unit tests
├── data/                        # Data validation tests
├── e2e/                         # Playwright E2E tests
├── factories/                   # Test data factories
├── integration/                 # Integration tests
├── security/                    # Security-focused tests
├── setup/                       # Test setup and utilities
└── README.md                    # Test documentation
```

## Running Tests

### Local Development

```bash
# Run all unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:unit:coverage

# Run unit tests in watch mode
npm run test:unit:watch

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific E2E test suite
npm run test:e2e:routing

# Run all tests
npm run test:all
```

### CI/CD Pipeline

The comprehensive testing pipeline runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Daily schedule at 2 AM UTC
- Manual workflow dispatch

#### Manual Test Execution

```bash
# Trigger specific test suite
gh workflow run comprehensive-testing.yml -f test_suite=unit
gh workflow run comprehensive-testing.yml -f test_suite=e2e
gh workflow run comprehensive-testing.yml -f test_suite=security
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 50,
      statements: 50,
    },
  },
};
```

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

## Writing Tests

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentSelector } from '../AgentSelector';

describe('AgentSelector', () => {
  it('should render agent options', () => {
    render(<AgentSelector />);
    
    expect(screen.getByText('Configuration Management Agent')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure Agent')).toBeInTheDocument();
  });

  it('should handle agent selection', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    
    render(<AgentSelector onSelect={onSelect} />);
    
    await user.click(screen.getByText('Configuration Management Agent'));
    
    expect(onSelect).toHaveBeenCalledWith('configuration-management-agent');
  });
});
```

### Integration Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentWorkflow } from '../AgentWorkflow';

describe('AgentWorkflow Integration', () => {
  it('should complete agent selection to documentation flow', async () => {
    const user = userEvent.setup();
    render(<AgentWorkflow />);

    // Select agent
    await user.click(screen.getByTestId('select-agent'));
    
    // Wait for agent details to load
    await waitFor(() => {
      expect(screen.getByTestId('agent-details')).toBeInTheDocument();
    });

    // Verify agent capabilities are displayed
    expect(screen.getByText(/capabilities/i)).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('agent discovery workflow', async ({ page }) => {
  await page.goto('/');
  
  // Navigate to agents
  await page.click('a[href*="agents"]');
  
  // Select specific agent
  await page.click('text=Configuration Management Agent');
  
  // Verify agent page loads
  await expect(page.locator('h1')).toContainText('Configuration Management');
  
  // Check for key sections
  await expect(page.locator('text=Capabilities')).toBeVisible();
  await expect(page.locator('text=Examples')).toBeVisible();
});
```

### Security Tests

```typescript
import { URLSanitizer } from '../../src/theme/Root';

describe('Security Tests', () => {
  it('should prevent XSS attacks', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    
    expect(URLSanitizer.isDangerous(maliciousInput)).toBe(true);
    expect(URLSanitizer.sanitize(maliciousInput)).not.toContain('<script>');
  });

  it('should handle SQL injection attempts', () => {
    const sqlInjection = "'; DROP TABLE users; --";
    
    expect(URLSanitizer.isDangerous(sqlInjection)).toBe(true);
  });
});
```

## Test Data Management

### Using Test Data Factory

```typescript
import { TestDataFactory } from '../factories/test-data-factory';

describe('Agent Tests', () => {
  beforeEach(() => {
    // Reset to consistent seed for reproducible tests
    TestDataFactory.seed(12345);
  });

  it('should handle agent data', () => {
    const agent = TestDataFactory.createAgent({
      name: 'Test Agent',
      model: 'sonnet'
    });

    expect(agent.name).toBe('Test Agent');
    expect(agent.model).toBe('sonnet');
    expect(agent.capabilities).toBeDefined();
  });
});
```

### Mock Strategies

```typescript
import { MockConfigurations } from '../setup/mock-strategies';

describe('API Integration Tests', () => {
  let mockManager;

  beforeEach(() => {
    mockManager = MockConfigurations.integration();
    mockManager.setupAll();
  });

  afterEach(() => {
    mockManager.teardownAll();
  });

  it('should handle API calls', async () => {
    const response = await fetch('/api/agents');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(3);
  });
});
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Statements**: 50%
- **Branches**: 50%  
- **Functions**: 60%
- **Lines**: 50%

### Coverage Exclusions

Files excluded from coverage requirements:
- Type definition files (`*.d.ts`)
- Test files (`*.test.ts`, `*.spec.ts`)
- Configuration files
- Build artifacts

### Improving Coverage

1. **Identify uncovered code**:
   ```bash
   npm run test:unit:coverage
   open coverage/lcov-report/index.html
   ```

2. **Focus on critical paths**:
   - User interaction flows
   - Error handling
   - Security-sensitive code
   - Business logic

3. **Write targeted tests**:
   - Edge cases and boundary conditions
   - Error scenarios
   - Integration points

## Performance Testing

### Lighthouse Integration

Performance tests use Lighthouse CI with the following thresholds:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.85}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["warn", {"minScore": 0.8}],
        "categories:seo": ["warn", {"minScore": 0.8}]
      }
    }
  }
}
```

### Core Web Vitals

Monitor and test for:
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

## Accessibility Testing

### Automated Testing

- **axe-core**: WCAG 2.1 AA compliance
- **pa11y**: Additional accessibility checks
- **Lighthouse**: Accessibility audit

### Manual Testing Checklist

- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announcements are appropriate
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible
- [ ] Form labels are properly associated
- [ ] Heading hierarchy is logical

## Security Testing

### Automated Security Checks

1. **Dependency Auditing**:
   ```bash
   npm audit --omit=dev --audit-level moderate
   ```

2. **XSS Protection**:
   - URL sanitization tests
   - Content Security Policy validation
   - Input validation checks

3. **Security Headers**:
   - X-Content-Type-Options
   - X-Frame-Options  
   - Content-Security-Policy

### Security Test Categories

- **Input Validation**: XSS, SQL injection, path traversal
- **Authentication**: Session management, access controls
- **Data Protection**: Sensitive data handling, encryption
- **Infrastructure**: Security headers, HTTPS enforcement

## Continuous Integration

### GitHub Actions Workflow

The comprehensive testing pipeline includes:

1. **Build & Cache**: Dependencies and build artifacts
2. **Unit Tests**: With coverage reporting
3. **Integration Tests**: Component interaction testing
4. **E2E Tests**: Cross-browser user journey testing
5. **Performance Tests**: Lighthouse CI analysis
6. **Security Tests**: Vulnerability scanning and security tests
7. **Accessibility Tests**: WCAG compliance verification
8. **Test Summary**: Consolidated reporting

### Quality Gates

**Required Tests** (must pass):
- Unit tests
- Integration tests
- E2E tests (Chromium)
- Security tests

**Optional Tests** (warnings only):
- Performance tests
- Accessibility tests
- E2E tests (Firefox, WebKit)

### Artifact Management

Test results and artifacts are retained for:
- **Test Reports**: 7 days
- **Coverage Reports**: 7 days
- **Screenshots/Videos**: 7 days
- **Performance Reports**: 7 days
- **Test Summary**: 30 days

## Debugging Tests

### Local Debugging

```bash
# Debug failing tests
npm run test:unit -- --verbose --no-cache

# Debug E2E tests with UI
npm run test:e2e:ui

# Debug specific test
npm run test:unit -- --testNamePattern="should handle agent selection"
```

### CI Debugging

1. **Download artifacts** from GitHub Actions
2. **Check test reports** in HTML format  
3. **Review screenshots/videos** for E2E failures
4. **Analyze coverage reports** for missing tests

### Common Issues

1. **Flaky Tests**:
   - Use `waitFor` for async operations
   - Mock time-dependent functionality
   - Avoid hard-coded timeouts

2. **Memory Leaks**:
   - Clean up event listeners in tests
   - Use `cleanup` functions properly
   - Reset mocks between tests

3. **Browser Compatibility**:
   - Test across multiple browsers
   - Handle browser-specific APIs gracefully
   - Use feature detection

## Best Practices

### Test Organization

1. **Arrange-Act-Assert Pattern**:
   ```typescript
   it('should update counter', () => {
     // Arrange
     const initialCount = 0;
     
     // Act
     const newCount = increment(initialCount);
     
     // Assert
     expect(newCount).toBe(1);
   });
   ```

2. **Descriptive Test Names**:
   - Use "should" statements
   - Describe expected behavior
   - Include context when needed

3. **Test Independence**:
   - Each test should run in isolation
   - Reset state between tests
   - Avoid test dependencies

### Performance

1. **Optimize Test Speed**:
   - Use shallow rendering when possible
   - Mock external dependencies
   - Parallelize test execution

2. **Resource Management**:
   - Clean up after tests
   - Avoid memory leaks
   - Use appropriate timeouts

### Maintenance

1. **Keep Tests Updated**:
   - Update tests with code changes
   - Remove obsolete tests
   - Refactor test utilities

2. **Documentation**:
   - Document complex test scenarios
   - Explain non-obvious assertions
   - Update this guide regularly

## Troubleshooting

### Common Error Messages

1. **"Test suite failed to run"**:
   - Check Jest configuration
   - Verify imports and modules
   - Review TypeScript compilation errors

2. **"Element not found"**:
   - Use `waitFor` for async elements
   - Check selectors and test IDs
   - Verify component rendering

3. **"Timeout exceeded"**:
   - Increase timeout values
   - Check for infinite loops
   - Verify async operations complete

### Getting Help

1. **Check test logs** for detailed error messages
2. **Review similar tests** in the codebase
3. **Consult documentation** for testing libraries
4. **Ask team members** for assistance

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Tools
- [Jest](https://jestjs.io/) - JavaScript testing framework
- [React Testing Library](https://testing-library.com/) - React testing utilities
- [Playwright](https://playwright.dev/) - E2E testing framework
- [axe-core](https://github.com/dequelabs/axe-core) - Accessibility testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing

---

For questions or improvements to this guide, please open an issue or submit a pull request.
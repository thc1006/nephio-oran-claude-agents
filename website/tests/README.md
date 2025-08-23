# Nephio O-RAN Website Test Suite

This directory contains comprehensive tests for the Nephio O-RAN Claude Agents website, covering routing, internationalization, accessibility, and performance.

## Test Structure

```
tests/
├── components/           # Component unit tests
├── integration/         # Integration tests
│   └── documentation.test.tsx  # Comprehensive routing & locale tests
├── e2e/                # End-to-end tests
│   ├── routing-and-locale.spec.ts  # E2E routing tests
│   ├── routing.config.ts           # Routing test configuration
│   ├── global-setup.ts            # E2E test setup
│   └── global-teardown.ts         # E2E test cleanup
└── setup/              # Test configuration and mocks
```

## Test Categories

### 1. Unit Tests
Tests for individual React components and utilities.

```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Watch mode for development
npm run test:unit:watch
```

### 2. Integration Tests
Tests for routing, locale functionality, and page interactions.

```bash
# Integration tests are part of unit test suite
npm run test:unit
```

#### Key Integration Test Coverage:
- ✅ Locale routing (en and zh-TW)
- ✅ Documentation page accessibility
- ✅ Redirect functionality (`/docs/` → `/docs/intro`)
- ✅ 404 page handling  
- ✅ Navigation between locales
- ✅ Double locale path prevention (`/zh-TW/zh-TW` blocked)
- ✅ Search functionality
- ✅ Keyboard navigation
- ✅ Security validation

### 3. End-to-End Tests
Real browser tests for complete user workflows.

```bash
# Run all E2E tests
npm run test:e2e

# Run routing-specific E2E tests
npm run test:e2e:routing

# Run with UI for debugging
npm run test:e2e:routing:ui

# Run in headed mode
npm run test:e2e:headed
```

#### E2E Test Coverage:
- ✅ Homepage loading
- ✅ Documentation redirects
- ✅ Locale switching
- ✅ Mobile responsiveness
- ✅ Navigation state persistence
- ✅ Error handling
- ✅ Performance benchmarks
- ✅ Accessibility compliance

### 4. Accessibility Tests
Automated accessibility testing.

```bash
npm run test:a11y
```

### 5. Performance Tests
Lighthouse performance audits.

```bash
npm run test:performance
npm run lighthouse
```

### 6. Security Tests
Security header and vulnerability testing.

```bash
npm run test:security
```

## Running All Tests

```bash
# Run complete test suite
npm run test:all

# Run only routing-related tests
npm run test:routing

# Run CI test suite
npm run test:ci
```

## Test Configuration

### Jest Configuration
- **File**: `jest.config.js`
- **Environment**: jsdom
- **Coverage threshold**: 70%
- **Modules**: Supports TypeScript, CSS modules, and Docusaurus imports

### Playwright Configuration
- **File**: `playwright.config.ts` (general) and `tests/e2e/routing.config.ts` (routing-specific)
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Viewports**: Desktop and mobile
- **Timeouts**: Optimized for CI/CD

## CI/CD Integration

The test suite is integrated with GitHub Actions:

### Workflow File
`.github/workflows/website-routing-tests.yml`

### Test Matrix
- **Triggers**: Push to main, PRs, daily schedule
- **Environments**: Ubuntu (primary), Windows, macOS
- **Browsers**: Chromium, Firefox, Safari (macOS), Edge (Windows)
- **Node.js**: Version 18+

### Test Artifacts
- Test results (JSON/JUnit)
- Coverage reports
- Screenshots on failure
- Video recordings on failure
- Accessibility reports
- Performance reports

## Writing New Tests

### Unit/Integration Tests
Create `.test.tsx` files in appropriate directories:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### E2E Tests
Create `.spec.ts` files in `tests/e2e/`:

```typescript
import { test, expect } from '@playwright/test';

test('should navigate correctly', async ({ page }) => {
  await page.goto('/docs/intro');
  await expect(page.locator('h1')).toBeVisible();
});
```

## Test Best Practices

### 1. Test Pyramid
- **Many unit tests**: Fast, isolated, focused
- **Fewer integration tests**: Component interactions
- **Minimal E2E tests**: Critical user journeys

### 2. Arrange-Act-Assert Pattern
```typescript
// Arrange
const user = userEvent.setup();
render(<Component />);

// Act
await user.click(screen.getByRole('button'));

// Assert
expect(screen.getByText('Expected result')).toBeVisible();
```

### 3. Deterministic Tests
- No reliance on external services
- Use mocks for dependencies
- Avoid timing-dependent assertions

### 4. Accessibility First
- Test with screen readers in mind
- Verify keyboard navigation
- Check ARIA labels and roles

### 5. Performance Awareness
- Keep E2E tests lean
- Use appropriate timeouts
- Clean up resources

## Debugging Tests

### Jest/Integration Tests
```bash
# Debug specific test
npm run test:unit -- --testNamePattern="should handle locale switching"

# Debug with VS Code
# Add breakpoints and use "Debug Jest Tests" configuration
```

### Playwright/E2E Tests
```bash
# Run with UI for visual debugging
npm run test:e2e:routing:ui

# Run in headed mode
npm run test:e2e:headed

# Generate trace for failed tests
npx playwright test --trace=on
```

### Common Issues

1. **Test timeouts**: Increase timeout values in configs
2. **Flaky tests**: Add proper wait conditions
3. **Mock issues**: Verify mock implementations match real APIs
4. **CI failures**: Check environment-specific configurations

## Coverage Requirements

- **Minimum coverage**: 70% (lines, branches, functions, statements)
- **Critical paths**: 90%+ coverage required
- **Accessibility**: All interactive elements must be tested
- **Routing**: All routes and redirects must be covered

## Continuous Improvement

- Monitor test execution times
- Update browser versions regularly
- Review and update accessibility standards
- Optimize test parallelization
- Keep dependencies updated

## Contact

For questions about the test suite, please:
- Open an issue in the repository
- Reference the main project documentation
- Check CI/CD logs for detailed error information
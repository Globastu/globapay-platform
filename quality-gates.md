# Quality Gates Configuration

This document outlines the quality gates and failure conditions implemented in the Globapay Platform CI/CD pipeline.

## Overview

Quality gates ensure code quality, test coverage, and build integrity before code can be merged into protected branches. All gates must pass for the CI pipeline to succeed.

## Quality Gate Matrix

| Gate | Threshold | Scope | Failure Condition |
|------|-----------|-------|-------------------|
| **Linting** | Zero violations | All TS/JS files | ESLint errors or warnings |
| **Type Checking** | Zero errors | All TypeScript | Compilation failures |
| **Unit Tests** | 100% pass rate | All test suites | Any test failure |
| **Coverage (Global)** | 80% minimum | Lines, branches, functions, statements | Below threshold |
| **Coverage (Business Logic)** | 85% minimum | `/modules/`, `/services/` directories | Below threshold |
| **Build** | Success required | All workspace packages | Compilation or build errors |
| **Pre-commit Tests** | 100% pass rate | Modified files only | Unit test failures for touched code |

## Implementation Details

### 1. Linting Gate (`pnpm -w lint`)
```bash
# Runs ESLint across all workspace packages
pnpm -w lint
```
**Failure Conditions:**
- Any ESLint error or warning
- Code style violations
- Import/export issues

### 2. Type Checking Gate (`pnpm -w typecheck`)
```bash
# Runs TypeScript compiler without emitting files
pnpm -w typecheck
```
**Failure Conditions:**
- Type errors in any file
- Missing type definitions
- Invalid TypeScript syntax

### 3. Test Gate (`pnpm -w test`)
```bash
# Runs all tests with coverage reporting
pnpm -w test --coverage
```
**Failure Conditions:**
- Any test failure
- Test timeouts
- Unhandled promise rejections

### 4. Coverage Gate (`pnpm -w test:coverage-check`)
```bash
# Custom coverage threshold validation
pnpm -w test:coverage-check
```
**Failure Conditions:**
- Global coverage below 80% (lines, branches, functions, statements)
- Business logic coverage below 85%
- Missing coverage data

### 5. Build Gate (`pnpm -w build`)
```bash
# Builds all packages in dependency order
pnpm -w build
```
**Failure Conditions:**
- TypeScript compilation errors
- Missing dependencies
- Build script failures

### 6. Pre-commit Gate (Local Development)
```bash
# Runs on staged files only
pnpm lint-staged
```
**Failure Conditions:**
- Linting errors in staged files
- Unit test failures for modified packages
- Formatting violations

## Coverage Configuration

### Global Thresholds (80%)
```javascript
// apps/api/vitest.config.ts
thresholds: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  }
}
```

### Business Logic Thresholds (85%)
```javascript
// Higher thresholds for critical business logic
'src/modules/*/': {
  branches: 85,
  functions: 85,
  lines: 85,
  statements: 85,
},
'src/services/*/': {
  branches: 85,
  functions: 85,
  lines: 85,
  statements: 85,
}
```

## Quality Gate Enforcement

### Branch Protection Rules
- **Main branch**: All gates must pass
- **Develop branch**: Core gates (lint, typecheck, test)
- **Feature branches**: No restrictions, but CI runs

### CI Pipeline Structure
```yaml
jobs:
  lint:          # ✅ Must pass
  typecheck:     # ✅ Must pass
  test:          # ✅ Must pass + coverage thresholds
  build:         # ✅ Must pass (depends on lint + typecheck)
  ci-success:    # ✅ Gates all previous jobs
```

### Failure Handling
1. **Immediate Failure**: Pipeline stops on first failure
2. **Error Reporting**: Detailed error messages and logs
3. **Coverage Reports**: Visual coverage reports uploaded to Codecov
4. **Blocking**: Pull requests cannot be merged until all gates pass

## Local Development

### Pre-commit Hooks
Automatically run quality checks on staged files:
```bash
# Configured in .lintstagedrc
{
  "apps/api/**/*.{ts,js}": [
    "eslint --fix",
    "prettier --write",
    "pnpm --filter @globapay/api test:unit --run"
  ]
}
```

### Manual Quality Checks
Developers can run quality checks locally:
```bash
# Run all quality gates
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# Run coverage check
pnpm test:coverage-check

# Format code
pnpm format
```

## Monitoring and Alerts

### CI Badge Status
- ✅ Green: All gates passing
- ❌ Red: One or more gates failing
- 🟡 Yellow: Pipeline in progress

### Coverage Trends
- **Codecov Integration**: Track coverage changes over time
- **Pull Request Coverage**: Coverage diff on every PR
- **Coverage Reports**: HTML reports generated for detailed analysis

### Quality Metrics
Track quality trends via:
- GitHub Actions build history
- Codecov coverage graphs
- SonarCloud quality scores (if configured)

## Troubleshooting

### Common Gate Failures

1. **Linting Failures**
   ```bash
   # Fix automatically where possible
   pnpm lint --fix
   
   # Check specific rules
   pnpm lint --debug
   ```

2. **Type Errors**
   ```bash
   # Check specific errors
   pnpm typecheck --noEmit --pretty
   
   # Generate types if needed
   pnpm -F @globapay/sdk generate
   ```

3. **Test Failures**
   ```bash
   # Run tests in watch mode
   pnpm test --watch
   
   # Run specific test file
   pnpm test src/path/to/test.ts
   ```

4. **Coverage Failures**
   ```bash
   # Generate coverage report
   pnpm test:coverage
   
   # View HTML report
   open coverage/index.html
   ```

5. **Build Failures**
   ```bash
   # Clean and rebuild
   pnpm clean && pnpm build
   
   # Check specific package
   pnpm -F @globapay/api build
   ```

## Quality Gate Exemptions

### Emergency Hotfixes
For critical production issues:
1. Create hotfix branch from main
2. Bypass protection with admin override
3. Create follow-up PR to fix quality issues

### Infrastructure Changes
For CI/build configuration changes:
1. Test in feature branch first
2. Gradual rollout via feature flags
3. Monitor for regressions

This ensures high code quality while maintaining development velocity.
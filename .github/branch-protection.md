# Branch Protection Rules

This document outlines the recommended branch protection rules for the Globapay Platform repository to enforce quality gates.

## Main Branch Protection

Configure the following rules for the `main` branch:

### Required Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- Required checks:
  - `lint` (🧹 Lint)
  - `typecheck` (🏷 TypeScript)
  - `test` (🧪 Tests)
  - `build` (🏗 Build)
  - `ci-success` (✅ CI Success)

### Pull Request Requirements
- ✅ **Require a pull request before merging**
- ✅ **Require approvals: 1**
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require review from code owners**

### Additional Restrictions
- ✅ **Restrict pushes that create files larger than 100 MB**
- ✅ **Do not allow bypassing the above settings**
- ✅ **Apply rules to repository admins**

### Linear History
- ✅ **Require linear history** (enforce rebase/merge commits)

## Development Branch Protection

Configure similar rules for the `develop` branch with slightly relaxed requirements:

### Required Status Checks
- ✅ **Require status checks to pass before merging**
- Required checks:
  - `lint`
  - `typecheck`
  - `test`

### Pull Request Requirements
- ✅ **Require a pull request before merging**
- ✅ **Require approvals: 1**

## Quality Gate Enforcement

The CI pipeline enforces these quality gates:

### Code Quality
- **ESLint**: No linting errors allowed
- **TypeScript**: All type checks must pass
- **Prettier**: Code formatting must be consistent

### Test Coverage
- **Global Coverage**: Minimum 80% across all metrics
- **Business Logic**: Minimum 85% for `/modules/` and `/services/`
- **Coverage Check**: Custom script validates thresholds

### Build Integrity
- **Compilation**: All TypeScript must compile successfully
- **Dependencies**: All workspace dependencies must resolve
- **Production Build**: Must build without errors

## Implementation via GitHub CLI

```bash
# Enable branch protection for main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint","typecheck","test","build","ci-success"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null

# Enable branch protection for develop branch
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint","typecheck","test"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

## Failure Conditions

The CI pipeline will fail and block merging if:

1. **Linting Errors**: Any ESLint violations
2. **Type Errors**: Any TypeScript compilation errors
3. **Test Failures**: Any test suite failures
4. **Coverage Thresholds**: Below minimum coverage requirements
5. **Build Failures**: Compilation or build process errors
6. **Pre-commit Hook Failures**: Local quality checks fail

## Quality Monitoring

Monitor quality metrics via:
- **GitHub Actions**: CI pipeline status
- **Codecov**: Coverage trends and reports
- **SonarCloud**: Code quality analysis
- **Branch Protection Status**: Merge protection enforcement

This ensures consistent code quality and prevents regression in the codebase.
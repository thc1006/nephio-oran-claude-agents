# GitHub Actions Workflows - Add These Later

Due to OAuth permission restrictions, these workflow files need to be added manually or with proper workflow permissions.

## Instructions

1. Create these files in `.github/workflows/` directory after the PR is merged
2. Or commit them directly via GitHub web interface
3. Or use a personal access token with workflow scope

## Files to Add:

### 1. `.github/workflows/ci.yml`
Copy the content from the local `.github/workflows/ci.yml` file

### 2. `.github/workflows/deploy.yml`
Copy the content from the local `.github/workflows/deploy.yml` file

### 3. `.github/workflows/preview.yml`
Copy the content from the local `.github/workflows/preview.yml` file

These workflows provide:
- Continuous Integration with build, test, and validation
- Automated deployment to GitHub Pages
- PR preview deployments with Surge.sh
- Content validation and link checking
- Lighthouse CI for performance testing
- Accessibility testing with axe

Once added, the CI/CD pipeline will be fully operational.
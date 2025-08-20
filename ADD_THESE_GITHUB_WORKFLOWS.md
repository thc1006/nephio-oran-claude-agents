# GitHub Actions Workflows to Add

These workflow files provide complete CI/CD automation for the Docusaurus website. They need to be added manually due to OAuth permission restrictions.

## How to Add These Workflows

### Option 1: Via GitHub Web Interface (Recommended)
1. Go to your repository on GitHub
2. Click "Create new file" 
3. Name it `.github/workflows/[filename].yml`
4. Copy and paste the content for each workflow
5. Commit directly to main or create a PR

### Option 2: With Personal Access Token
1. Create a personal access token with `workflow` scope
2. Clone the repo with the token
3. Add the files to `.github/workflows/`
4. Push to the repository

### Option 3: After PR is Merged
1. Merge the current PR first
2. Create a new branch
3. Add these workflow files
4. Create a new PR

## Workflow Files

### 1. CI Workflow (`.github/workflows/ci.yml`)

This workflow runs on every push and PR to validate, test, and build the website.

**Features:**
- Content validation (banned phrases, version consistency)
- Markdown linting
- Build and test
- Link checking
- Accessibility testing (axe)
- Lighthouse CI (90+ scores)
- Security scanning

**Location:** `.github/workflows/ci.yml`

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

This workflow deploys the website to GitHub Pages when changes are pushed to main.

**Features:**
- Automatic deployment to GitHub Pages
- Build validation
- Post-deployment testing
- Rollback capability
- Artifact cleanup
- Deployment summary

**Location:** `.github/workflows/deploy.yml`

### 3. Preview Workflow (`.github/workflows/preview.yml`)

This workflow creates preview deployments for pull requests.

**Features:**
- PR preview deployments
- Surge.sh integration
- Preview banner injection
- Lighthouse testing on previews
- PR comments with preview links
- Visual regression testing

**Location:** `.github/workflows/preview.yml`

## Required Secrets

To fully enable all features, add these secrets to your repository:

1. **SURGE_TOKEN** (Optional)
   - For PR preview deployments
   - Get from: https://surge.sh/account

## Required Repository Settings

1. **GitHub Pages**
   - Go to Settings → Pages
   - Source: GitHub Actions
   - Branch: Not needed (using actions)

2. **Workflow Permissions**
   - Settings → Actions → General
   - Workflow permissions: Read and write permissions
   - Allow GitHub Actions to create and approve pull requests: ✓

## File Contents

The complete workflow files are available in your local repository at:
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/preview.yml`

Copy these files exactly as they are to maintain proper formatting and functionality.

## After Adding Workflows

Once the workflows are added:

1. **CI Workflow** will run automatically on the next push/PR
2. **Deploy Workflow** will deploy to GitHub Pages on push to main
3. **Preview Workflow** will create previews for new PRs

## Validation Checklist

After adding the workflows, verify:
- [ ] Workflows appear in Actions tab
- [ ] CI runs on new commits
- [ ] Deploy workflow has Pages permissions
- [ ] Preview workflow can comment on PRs

## Support

If you encounter issues:
1. Check the Actions tab for workflow run logs
2. Verify all required permissions are set
3. Ensure secrets are properly configured
4. Check that file paths match exactly

---

**Note:** These workflows are production-ready and follow GitHub Actions best practices for security, performance, and reliability.
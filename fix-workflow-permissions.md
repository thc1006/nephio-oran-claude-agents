# Fix for GitHub Actions DAG Documentation Permission Error

## Problem
The `agent-dag-check.yml` workflow is failing with a 403 permission error when trying to push DAG documentation updates back to the repository:

```
remote: Permission to thc1006/nephio-oran-claude-agents.git denied to github-actions[bot].
fatal: unable to access 'https://github.com/thc1006/nephio-oran-claude-agents/': The requested URL returned error: 403
```

## Solution

You need to manually apply these changes to fix the workflow permissions:

### 1. Update `.github/workflows/agent-dag-check.yml`

Add permissions to the `update-docs` job (around line 117-123):

```yaml
  update-docs:
    name: Update DAG Documentation
    runs-on: ubuntu-latest
    needs: validate-dag
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    permissions:
      contents: write  # Need write permission to push changes
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Update the git config in the same workflow (around line 137-140):

Change from:
```yaml
    - name: Commit documentation
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
```

To:
```yaml
    - name: Commit documentation
      run: |
        git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
        git config --local user.name "github-actions[bot]"
```

### 3. Alternative: Use a Personal Access Token (PAT)

If the above doesn't work, you can create a Personal Access Token:

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Create a new token with `repo` and `workflow` scopes
3. Add it as a repository secret named `WORKFLOW_TOKEN`
4. Update the workflow to use it:

```yaml
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        token: ${{ secrets.WORKFLOW_TOKEN }}
```

### 4. Alternative: Disable automatic DAG updates

If you don't need automatic DAG updates, you can remove the `update-docs` job entirely and just rely on the artifact upload and PR comments.

## Complete Fixed Workflow Section

Here's the complete corrected `update-docs` job:

```yaml
  update-docs:
    name: Update DAG Documentation
    runs-on: ubuntu-latest
    needs: validate-dag
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    permissions:
      contents: write  # Need write permission to push changes
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        
    - name: Download artifacts
      uses: actions/download-artifact@v4
      with:
        name: dag-report
        path: docs/agents/
        
    - name: Commit documentation
      run: |
        git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
        git config --local user.name "github-actions[bot]"
        
        if [ -n "$(git status --porcelain docs/agents/)" ]; then
          git add docs/agents/
          git commit -m "docs: Update agent DAG report and visualization [skip ci]"
          git push
          echo "✅ Updated DAG documentation"
        else
          echo "ℹ️ No changes to commit"
        fi
```

## Also Update Go Version

While you're editing the workflows, update the Go version in both workflows:

In `.github/workflows/agent-dag-check.yml` and `.github/workflows/test-coverage.yml`:

```yaml
    - name: Set up Go
      uses: actions/setup-go@v5
      with:
        go-version: '1.24.6'
        check-latest: false
```

## How to Apply

Since Claude Code cannot push workflow changes due to OAuth restrictions, you need to:

1. Go to the GitHub web interface
2. Navigate to `.github/workflows/agent-dag-check.yml`
3. Click the edit button (pencil icon)
4. Make the changes above
5. Commit directly to main branch with message: "fix: resolve GitHub Actions permission issues for DAG documentation updates"

Or, if you have local git access with proper permissions:

```bash
# Switch back to main branch
git checkout main

# Apply the changes manually to the workflow files
# Then commit and push
git add .github/workflows/agent-dag-check.yml .github/workflows/test-coverage.yml
git commit -m "fix: resolve GitHub Actions permission issues for DAG documentation updates"
git push origin main
```
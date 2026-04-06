# GitHub Actions Workflows

## CI Workflow (ci.yml)

Runs on every push and pull request to `main` branch.

### What it does:
1. ✅ Runs linter
2. ✅ Runs tests
3. ✅ Builds project
4. ✅ Checks dependencies for vulnerabilities
5. ✅ Detects duplicate code
6. ✅ Checks accessibility
7. ✅ Analyzes CSS quality
8. ✅ Checks performance
9. ✅ Validates skills format
10. ✅ Uploads all reports as artifacts
11. ✅ Comments on PRs with summary

### Artifacts:
- All quality reports saved for 30 days
- Download from Actions tab → Artifacts

### PR Comments:
Automatically adds quality check summary to pull requests.

## Local Testing

Run the same checks locally:
```bash
npm run lint
npm test
npm run build
npm run deps:dry-run
npm run detect:duplicates
npm run a11y:check
npm run maintain:dry-run
```

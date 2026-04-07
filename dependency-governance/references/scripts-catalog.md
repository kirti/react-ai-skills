# Automation Scripts Catalog

All scripts live in `scripts/` at the repo root. Each accepts `--help` for full usage.

---

## validate-audit-fix.js

Compares `npm audit fix --dry-run` output against Excel policy.

```bash
node scripts/validate-audit-fix.js \
  --audit audit-fix-preview.json \
  --policy dependency-policy.xlsx \
  --output validation-result.json
```

**Output:**
```json
{
  "approved": [{ "package": "express", "from": "4.17.1", "to": "4.18.2" }],
  "blocked": [{ "package": "lodash", "reason": "BLOCKED_VERSION" }],
  "needs_review": [{ "package": "webpack", "reason": "MAJOR_UPGRADE" }]
}
```

---

## detect-drift.js

Compares installed versions (`package.json`) against Excel approved versions.

```bash
node scripts/detect-drift.js \
  --package package.json \
  --policy dependency-policy.xlsx \
  --output drift-report.json
```

---

## generate-upgrade-plan.js

Produces a prioritized upgrade plan from drift report + policy.

```bash
node scripts/generate-upgrade-plan.js \
  --policy dependency-policy.xlsx \
  --output upgrade-plan.json \
  [--filter-severity HIGH,CRITICAL]
```

Output sorted by: severity DESC, update_type (patch first), due_date ASC.

---

## execute-upgrades.js

Executes approved upgrades for a given risk tier.

```bash
node scripts/execute-upgrades.js \
  --plan upgrade-plan.json \
  --tier patch|minor|major \
  [--dry-run]
```

For `major` tier, requires `--impact-report <path>` and `--approval-token <token>`.

---

## code-impact-analyzer.js

Static analysis for major version upgrades.

```bash
node scripts/code-impact-analyzer.js \
  --package <pkg-name> \
  --from <current-version> \
  --to <target-version> \
  --src ./src \
  --output impact-report.json
```

**Output schema:**
```json
{
  "package": "webpack",
  "from": "4.46.0",
  "to": "5.88.0",
  "impacted_files": ["webpack.config.js", "src/utils/bundler.ts"],
  "suggested_changes": [
    { "file": "webpack.config.js", "line": 12, "change": "Replace node: {} with resolve.fallback: {}" }
  ],
  "migration_complexity_score": 7,
  "estimated_effort_hours": 8,
  "risk_classification": "HIGH"
}
```

---

## validate-lock-file.js

Full lock file governance validation.

```bash
node scripts/validate-lock-file.js \
  [--strict]   # fail on any transitive drift
```

Checks: existence, consistency with package.json, integrity hashes, transitive duplicates, reproducible `npm ci`.

---

## generate-summary.js

Produces PR-ready remediation summary.

```bash
node scripts/generate-summary.js \
  --package <pkg> \
  --cve CVE-XXXX-YYYY \
  --from <old-version> \
  --to <new-version> \
  --output pr-body.md
```

---

## check-duplicate-prs.js

Queries GitHub API to detect existing open PRs for the same package.

```bash
node scripts/check-duplicate-prs.js \
  --package <pkg> \
  --repo owner/repo \
  --token $GITHUB_TOKEN
```

Returns exit code 1 if duplicate found.

---

## generate-rollback-manifest.js

Captures rollback artifacts before a PR.

```bash
node scripts/generate-rollback-manifest.js \
  --package <pkg> \
  --from <old-version> \
  --output rollback-manifest.json
```

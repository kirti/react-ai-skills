---
name: dependency-governance
description: >
  Enterprise-grade dependency governance and vulnerability remediation automation framework for Node.js repositories.
  Use this skill whenever the user wants to: audit or fix npm vulnerabilities, enforce package version policies from an Excel matrix,
  automate dependency upgrades with GitHub PR workflows, validate package-lock.json integrity, analyze code impact of major version upgrades,
  generate dependency compliance reports or leadership dashboards, implement rollback strategies for package updates,
  or manage multi-repository dependency lifecycle at scale. Trigger this skill for any request involving npm audit, CVE remediation,
  package policy enforcement, lock file governance, or dependency modernization — even if the user just says "fix my vulnerabilities"
  or "keep my packages up to date."
---

# Dependency Governance & Vulnerability Remediation Automation Framework

This skill guides implementation of a policy-driven, enterprise dependency upgrade platform for Node.js repositories.

**Core principle: Excel policy first → safe package updates → lock file integrity always.**

---

## Quick Reference: Which Workflow?

| Trigger | Use |
|---|---|
| CVE / vulnerability report | [Workflow A — Security Remediation](#workflow-a--security-remediation) |
| Version drift / modernization | [Workflow B — Dependency Modernization](#workflow-b--dependency-modernization) |
| Major version upgrade | [Major Upgrade Path](#major-upgrade-path) |
| Lock file validation | [Lock File Governance](#lock-file-governance) |
| Reporting / dashboards | [Reporting & Metrics](#reporting--metrics) |

---

## 1. Input Collection

Before any action, gather all inputs:

```bash
# Capture current state
npm audit --json > audit-report.json
npm ls --json > dependency-tree.json
cat package.json
cat package-lock.json | head -20   # never delete this file
```

**Excel policy columns required** (treat as source of truth):
- `package_name` | `current_approved_version` | `target_approved_version`
- `minimum_secure_version` | `blocked_versions` | `severity`
- `owner_team` | `testing_scope` | `migration_notes`
- `rollback_version` | `due_date`

Load Excel policy:
```javascript
// Node.js — read policy matrix
const xlsx = require('xlsx');
const wb = xlsx.readFile('dependency-policy.xlsx');
const policy = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
```

---

## 2. Policy & Decision Engine

**Run these checks before every update:**

```javascript
function canUpdate(pkg, proposedVersion, policy) {
  const rule = policy.find(r => r.package_name === pkg);
  if (!rule) return { allowed: false, reason: 'NOT_IN_POLICY' };
  if (rule.blocked_versions?.split(',').includes(proposedVersion))
    return { allowed: false, reason: 'BLOCKED_VERSION' };
  if (!semver.gte(proposedVersion, rule.minimum_secure_version))
    return { allowed: false, reason: 'BELOW_MINIMUM_SECURE' };
  return { allowed: true, type: classifyUpdate(rule.current_approved_version, proposedVersion) };
}

function classifyUpdate(from, to) {
  const diff = semver.diff(from, to);
  if (['premajor','major'].includes(diff)) return 'MAJOR';
  if (['preminor','minor'].includes(diff)) return 'MINOR';
  return 'PATCH';
}
```

**Decision matrix:**

| Update Type | Auto-Approve | Requires |
|---|---|---|
| PATCH | ✅ | Policy check + lock validation |
| MINOR | ✅ | Policy check + test suite + lock validation |
| MAJOR | ❌ | Code impact analysis + manual approval |
| BLOCKED | ❌ | Policy override |
| NOT_IN_POLICY | ❌ | Policy entry first |

---

## Workflow A — Security Remediation

For fixing reported CVEs/vulnerabilities.

```bash
# Step 1: Identify vulnerabilities
npm audit --json | jq '.vulnerabilities | to_entries[] | {pkg: .key, severity: .value.severity, fixAvailable: .value.fixAvailable}'

# Step 2: Dry-run to preview changes (never apply blindly)
npm audit fix --dry-run --json > audit-fix-preview.json

# Step 3: Compare proposed vs Excel policy
node scripts/validate-audit-fix.js audit-fix-preview.json dependency-policy.xlsx

# Step 4: Apply only policy-approved fixes
node scripts/apply-approved-fixes.js --audit audit-fix-preview.json --policy dependency-policy.xlsx
```

**Priority order:** patch > minor > major (escalate majors to Workflow B + code impact analysis)

After applying:
```bash
npm audit  # confirm vulnerability closure
npm ci     # validate deterministic install
```

---

## Workflow B — Dependency Modernization

For aligning repos to Excel-approved versions.

```bash
# Step 1: Detect drift between installed vs approved
node scripts/detect-drift.js package.json dependency-policy.xlsx

# Step 2: Generate upgrade plan sorted by risk
node scripts/generate-upgrade-plan.js --policy dependency-policy.xlsx --output upgrade-plan.json

# Step 3: Execute upgrades by risk tier (patch first)
node scripts/execute-upgrades.js --plan upgrade-plan.json --tier patch
node scripts/execute-upgrades.js --plan upgrade-plan.json --tier minor
# Major upgrades: go to Major Upgrade Path below
```

---

## Major Upgrade Path

**Required for any major version bump. Do not skip.**

### 1. Code Impact Analysis

```bash
# Run static analysis
node scripts/code-impact-analyzer.js --package <pkg> --from <v1> --to <v2> --src ./src

# What it checks:
# - import/require usage across codebase
# - deprecated API calls
# - config schema changes
# - TypeScript type breaks
# - Jest/test adapter compatibility
# - webpack/vite bundler compatibility
# - peer dependency conflicts
```

Output: `impact-report.json` containing:
- `impacted_files[]`
- `suggested_changes[]`
- `migration_complexity_score` (1–10)
- `estimated_effort_hours`
- `risk_classification` (LOW / MEDIUM / HIGH / CRITICAL)

### 2. Migration checklist

- [ ] Read package changelog / migration guide
- [ ] Review `migration_notes` in Excel policy
- [ ] Apply suggested code changes from impact report
- [ ] Update test adapters if needed
- [ ] Validate TypeScript types compile
- [ ] Full test suite passes

---

## 3. Execution Engine

**Standard upgrade execution — run in this exact order:**

```bash
# 1. Branch
git checkout -b fix/dependency-<pkg>-<version>

# 2. Update package.json
npm install <pkg>@<approved-version> --save-exact

# 3. Validate install
npm ci

# 4. Smoke test
npm run start --if-present

# 5. Full test suite
npm test

# 6. Audit check
npm audit

# 7. Dependency tree validation
npm ls <pkg>

# 8. Generate remediation summary
node scripts/generate-summary.js

# 9. Commit
git add package.json package-lock.json
git commit -m "fix(deps): upgrade <pkg> from <old> to <new> [CVE-XXXX]"

# 10. Push and raise PR
git push origin fix/dependency-<pkg>-<version>
gh pr create --title "..." --body "$(cat pr-template.md)"
```

---

## Lock File Governance

**`package-lock.json` MUST NEVER be deleted. This is non-negotiable.**

### Validation script

```javascript
async function validateLockFile() {
  // 1. Lock file exists
  if (!fs.existsSync('package-lock.json')) throw new Error('LOCK_FILE_MISSING');

  // 2. Consistent with package.json
  execSync('npm ci --dry-run');  // fails if inconsistent

  // 3. No duplicate vulnerable transitive versions
  const tree = JSON.parse(execSync('npm ls --json').toString());
  checkTransitiveDuplicates(tree);

  // 4. Integrity hashes present
  const lock = JSON.parse(fs.readFileSync('package-lock.json'));
  validateIntegrityHashes(lock);

  // 5. Reproducible install
  execSync('npm ci');
  console.log('✅ Lock file valid and reproducible');
}
```

---

## GitHub PR Template

Every PR must include:

```markdown
## Dependency Update: <package>

| Field | Value |
|---|---|
| Vulnerable Package | `<pkg>` |
| CVE / Report ID | CVE-XXXX-YYYY |
| Current Version | `x.y.z` |
| Fixed Version | `a.b.c` |
| Excel Approved Version | `a.b.c` |
| Severity | HIGH |
| Dependency Type | direct / transitive |

### Impacted Files
- `src/server.js` (line 12 — import updated)

### Test Evidence
```
npm test — 142 passed, 0 failed
npm audit — 0 vulnerabilities
```

### Rollback Plan
```bash
npm install <pkg>@<rollback-version>
git revert <commit-sha>
```
Previous lock file checksum: `sha256:<hash>`
```

---

## Rollback Strategy

Every PR branch must produce rollback artifacts:

```javascript
const rollbackManifest = {
  previous_versions: { [pkg]: oldVersion },
  lock_file_checksum: computeSha256('package-lock.json'),
  revert_commit: execSync('git rev-parse HEAD').toString().trim(),
  rollback_commands: [
    `npm install ${pkg}@${oldVersion}`,
    `git revert HEAD`,
    `npm ci`
  ],
  deployment_fallback_tag: `rollback/${pkg}-${Date.now()}`
};
fs.writeFileSync('rollback-manifest.json', JSON.stringify(rollbackManifest, null, 2));
```

---

## Reporting & Metrics

Track these KPIs and surface them on leadership dashboards:

**Operational KPIs:**
- Vulnerabilities fixed per week
- MTTR (mean time to remediation)
- Failed upgrade rate
- Rollback rate
- Auto-remediation % (target: >80% for patch/minor)
- Major upgrades pending
- Repos out of policy
- Stale lock file count
- PR approval lead time

**Dashboard dimensions:**
- Business unit / team ownership
- Repo risk score (0–100)
- SLA breach status
- Aging vulnerabilities (>30 / >60 / >90 days)

See `references/reporting-schema.md` for dashboard data structures and SQL/JSON query templates.

---

## Reference Files

- `references/excel-policy-schema.md` — Full Excel column specs + validation rules
- `references/scripts-catalog.md` — All automation script specs + CLI interfaces
- `references/reporting-schema.md` — KPI data structures + dashboard queries
- `references/risk-controls.md` — Risk register + mitigation controls

---

## Common Failure Modes & Controls

| Risk | Control |
|---|---|
| Unsafe major upgrade breaks prod | Code impact analyzer + manual approval gate |
| Transitive vulnerability persists | `npm ls` deep scan + transitive override workflow |
| Peer dependency conflict | Pre-install compatibility check in decision engine |
| Duplicate PRs | PR dedup check via GitHub API before branch creation |
| Lock file drift | `npm ci` validation after every install |
| Broken CI after update | `npm run start` + `npm test` gates before PR |

# Excel Policy Schema Reference

## Required Columns

| Column | Type | Description | Example |
|---|---|---|---|
| `package_name` | string | Exact npm package name | `express` |
| `current_approved_version` | semver | Currently approved version | `4.18.2` |
| `target_approved_version` | semver | Target version to migrate to | `4.19.0` |
| `minimum_secure_version` | semver | Lowest version considered secure | `4.17.3` |
| `blocked_versions` | csv | Comma-separated versions to never use | `4.17.0,4.17.1` |
| `severity` | enum | CRITICAL / HIGH / MEDIUM / LOW / NONE | `HIGH` |
| `owner_team` | string | Team responsible for this package | `platform-infra` |
| `testing_scope` | enum | FULL / INTEGRATION / SMOKE / NONE | `FULL` |
| `migration_notes` | text | Free-text guidance for upgrades | `Update config.json schema` |
| `rollback_version` | semver | Safe rollback target | `4.18.2` |
| `due_date` | date | ISO 8601 remediation deadline | `2025-09-30` |

## Optional Columns

| Column | Type | Description |
|---|---|---|
| `cve_ids` | csv | Associated CVE identifiers |
| `breaking_change_notes` | text | Known breaking changes |
| `peer_dependencies` | json | Required peer dep versions |
| `auto_approve` | boolean | Allow auto-merge for this package |
| `jira_ticket` | string | Linked Jira issue key |

## Validation Rules

- `target_approved_version` must be ≥ `minimum_secure_version`
- `rollback_version` must not be in `blocked_versions`
- `due_date` must be a future date for open items
- `blocked_versions` must not include `current_approved_version`
- `severity` = CRITICAL requires `due_date` within 7 days

## Loading the Policy (Node.js)

```javascript
const xlsx = require('xlsx');
const semver = require('semver');

function loadPolicy(filePath) {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws);

  return rows.map(row => ({
    ...row,
    blocked_versions: row.blocked_versions
      ? row.blocked_versions.split(',').map(v => v.trim())
      : [],
    cve_ids: row.cve_ids
      ? row.cve_ids.split(',').map(v => v.trim())
      : [],
  }));
}

function validatePolicy(policy) {
  for (const rule of policy) {
    if (!semver.valid(rule.target_approved_version))
      throw new Error(`Invalid semver for ${rule.package_name}: ${rule.target_approved_version}`);
    if (semver.lt(rule.target_approved_version, rule.minimum_secure_version))
      throw new Error(`${rule.package_name}: target is below minimum_secure_version`);
    if (rule.blocked_versions.includes(rule.current_approved_version))
      throw new Error(`${rule.package_name}: current_approved_version is blocked`);
  }
  return true;
}
```

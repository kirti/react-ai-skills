# Reporting Schema & Dashboard Queries

## Operational KPI Data Structure

```json
{
  "snapshot_date": "2025-09-01T00:00:00Z",
  "repo": "my-org/my-repo",
  "business_unit": "platform",
  "owner_team": "platform-infra",
  "kpis": {
    "vulnerabilities_fixed_this_week": 12,
    "mttr_days": 4.2,
    "failed_upgrade_rate_pct": 3.1,
    "rollback_rate_pct": 1.0,
    "auto_remediation_pct": 82.0,
    "major_upgrades_pending": 3,
    "out_of_policy_count": 5,
    "stale_lock_file": false,
    "pr_approval_lead_time_hours": 18.5
  },
  "repo_risk_score": 67,
  "sla_breaches": [
    { "package": "lodash", "cve": "CVE-2021-23337", "due_date": "2025-08-15", "days_overdue": 17 }
  ],
  "aging_vulnerabilities": {
    "over_30_days": 2,
    "over_60_days": 1,
    "over_90_days": 0
  }
}
```

## Risk Score Formula

```
repo_risk_score = (
  (critical_vulns * 40) +
  (high_vulns * 20) +
  (medium_vulns * 5) +
  (sla_breaches * 15) +
  (out_of_policy_count * 3) +
  (stale_lock_file ? 10 : 0)
) capped at 100
```

## Leadership Dashboard Dimensions

### Business Unit View
Aggregates risk scores by business unit.

```json
{
  "business_unit": "platform",
  "repos": 12,
  "avg_risk_score": 43,
  "critical_sla_breaches": 1,
  "auto_remediation_pct": 79
}
```

### Repo Risk Table (sorted by risk score desc)

| repo | risk_score | critical | high | sla_breaches | owner_team |
|---|---|---|---|---|---|
| api-gateway | 87 | 2 | 4 | 1 | platform-infra |
| auth-service | 54 | 0 | 3 | 0 | identity |

### SLA Breach Report

Filter: `due_date < today AND status != RESOLVED`

```sql
SELECT package_name, cve_ids, severity, due_date, 
       DATEDIFF(NOW(), due_date) AS days_overdue, owner_team
FROM vulnerability_tracking
WHERE due_date < NOW() AND status != 'RESOLVED'
ORDER BY days_overdue DESC;
```

## Metric Collection Points

Emit metrics at these automation lifecycle events:

| Event | Metric emitted |
|---|---|
| Vulnerability identified | `vuln.detected` |
| PR created | `remediation.started` |
| PR merged | `remediation.completed`, `mttr` computed |
| PR reverted | `rollback.triggered` |
| Upgrade failed (test/audit) | `upgrade.failed` |
| Policy violation blocked | `policy.blocked` |

# Risk Register & Mitigation Controls

## Risk Matrix

| Risk ID | Risk | Likelihood | Impact | Control |
|---|---|---|---|---|
| R01 | Unsafe major upgrade breaks production | MEDIUM | HIGH | Code impact analyzer + manual approval gate |
| R02 | Hidden transitive vulnerability persists after fix | MEDIUM | HIGH | `npm ls` deep scan + transitive override workflow |
| R03 | Peer dependency conflict after upgrade | MEDIUM | MEDIUM | Pre-install compatibility check in decision engine |
| R04 | Duplicate PRs for same package | LOW | LOW | GitHub API dedup check before branch creation |
| R05 | Lock file drift across environments | LOW | HIGH | `npm ci` validation + lock file checksum monitoring |
| R06 | Broken CI/CD workflow post-upgrade | MEDIUM | HIGH | `npm run start` + full `npm test` gates before PR |
| R07 | Policy violation slips through | LOW | HIGH | Decision engine mandatory check before every update |
| R08 | Rollback fails due to missing artifacts | LOW | CRITICAL | Rollback manifest generated and stored for every PR |

---

## Control Implementations

### R01 — Major Upgrade Safety Gate

```javascript
if (updateType === 'MAJOR') {
  const impact = await runCodeImpactAnalyzer(pkg, fromVersion, toVersion);
  if (impact.risk_classification === 'CRITICAL') {
    throw new Error('MANUAL_APPROVAL_REQUIRED: Critical risk major upgrade');
  }
  if (impact.migration_complexity_score > 7) {
    await requestManualApproval({ pkg, impact, requester: ownerTeam });
    return; // halt automation, await human approval
  }
}
```

### R02 — Transitive Vulnerability Scan

```bash
# After applying fix, scan the full dependency tree
npm ls --all --json | node scripts/scan-transitive-vulns.js \
  --known-cves cve-database.json \
  --output transitive-scan-result.json
```

Fail the pipeline if any transitive path still resolves to a vulnerable version.

### R05 — Lock File Checksum Monitoring

Store checksum before and after every operation:

```bash
sha256sum package-lock.json > .lock-checksum-before
# ... run npm install ...
sha256sum package-lock.json > .lock-checksum-after
diff .lock-checksum-before .lock-checksum-after
```

Alert on unexpected checksum changes in unrelated packages.

### R08 — Rollback Readiness Verification

Before closing any PR, verify rollback manifest is reachable:

```bash
# Verify rollback is possible
git show $(cat rollback-manifest.json | jq -r '.revert_commit') > /dev/null
npm install $(cat rollback-manifest.json | jq -r '.rollback_commands[0]' | sed 's/npm install //') --dry-run
```

---

## Incident Response Runbook

### If production breaks post-merge

1. **Immediately** trigger rollback:
   ```bash
   cat rollback-manifest.json  # get rollback commands
   git revert <revert_commit>
   npm ci
   npm run start
   ```
2. Open Sev1 incident ticket with PR reference and CVE IDs
3. Run post-mortem to identify which control failed
4. Update Excel policy with `blocked_versions` entry

### If lock file is found deleted

1. Restore from git: `git checkout HEAD -- package-lock.json`
2. Run `npm ci` to verify integrity
3. Audit who deleted it via `git log --all --full-history -- package-lock.json`
4. Block the PR that caused deletion

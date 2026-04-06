# Reports Directory

All automation scripts save their reports here.

## 📊 Generated Reports

When you run the automation scripts, reports are automatically generated in this folder:

### Dependency Management
- **dependency-report.json** - Complete dependency analysis with vulnerabilities
- **dependency-report.md** - Human-readable markdown version

### Code Quality
- **duplication-report.json** - Duplicate code blocks found
- **accessibility-report.json** - Accessibility issues and fixes
- **css-analysis-report.json** - CSS quality analysis
- **performance-report.json** - Performance issues detected

### Comprehensive
- **maintenance-report.json** - Summary of all checks run by `npm run maintain`

### Additional
- **unused-css-report.json** - Unused CSS classes
- **unused-imports-report.json** - Unused imports

---

## 🔍 Viewing Reports

### View in Terminal

```bash
# Markdown reports
cat reports/dependency-report.md

# JSON reports with formatting
cat reports/duplication-report.json | jq

# List all reports
ls -lh reports/
```

### View in VS Code

```bash
code reports/dependency-report.md
```

### View in Browser

For JSON reports, use online viewers:
- https://jsonviewer.stack.hu/
- https://jsonformatter.org/

---

## 📈 Report Contents

### dependency-report.json

```json
{
  "vulnerabilities": {
    "total": 5,
    "high": 4,
    "moderate": 1
  },
  "outdated": [
    {
      "package": "eslint",
      "current": "9.39.4",
      "wanted": "9.39.5",
      "latest": "10.2.0"
    }
  ]
}
```

### duplication-report.json

```json
{
  "totalDuplicates": 5,
  "summary": {
    "filesAffected": 3,
    "linesOfDuplication": 47
  },
  "duplicateBlocks": [...]
}
```

### accessibility-report.json

```json
{
  "totalIssues": 12,
  "summary": {
    "critical": 2,
    "high": 6,
    "medium": 4
  },
  "issues": [...]
}
```

---

## 🤖 CI/CD Integration

These reports are uploaded as artifacts in GitHub Actions:

1. Go to Actions tab in GitHub
2. Click on latest workflow run
3. Download **quality-reports** artifact
4. Extract and view reports

---

## 🧹 Cleaning Reports

Reports are gitignored by default. To clean old reports:

```bash
# Remove all reports
rm reports/*.json reports/*.md

# Keep only .gitkeep
find reports -type f ! -name '.gitkeep' ! -name 'README.md' -delete
```

---

## 📅 Report Retention

- **Local:** Reports remain until manually deleted
- **GitHub Actions:** 30 days retention
- **Best Practice:** Review and clean weekly

---

## 🔄 Regenerating Reports

Simply run the commands again:

```bash
npm run deps:dry-run        # Regenerates dependency reports
npm run detect:duplicates   # Regenerates duplication report
npm run a11y:check          # Regenerates accessibility report
npm run maintain:dry-run    # Regenerates all reports
```

Reports are automatically overwritten with latest data.

---

## 💡 Tips

- Review reports after major changes
- Use reports in code reviews
- Track improvements over time
- Share reports with team
- Automate with CI/CD

---

**All reports are generated automatically - no manual work needed!** 🎉

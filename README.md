# React AI Skills - Demo Installation

[![GitHub](https://img.shields.io/badge/GitHub-kirti%2Freact--ai--skills-blue)](https://github.com/kirti/react-ai-skills)
[![npm](https://img.shields.io/badge/npm-%40kirti%2Freact--ai--skills-red)](https://www.npmjs.com/package/@kirti/react-ai-skills)

Demo repository showing how to use `@kirti/react-ai-skills` package locally. This is a working React application with all automation scripts and AI agent skills integrated.

---

## 🚀 Quick Start

### Clone and Install

```bash
git clone https://github.com/kirti/react-ai-skills.git
cd react-ai-skills
npm install
```

### Run Development Server

```bash
npm run dev
# Open http://localhost:5173
```

### Test the Automation Scripts

```bash
# Check dependencies (with beautiful colored output!)
npm run deps:dry-run

# Detect duplicate code
npm run detect:duplicates

# Check accessibility
npm run a11y:check

# Run comprehensive maintenance
npm run maintain:dry-run
```

---

## 📦 What's Included

### ✅ 19 Automation Scripts

Located in `scripts/` folder:

| Category | Scripts |
|----------|---------|
| **Dependencies** | dependency-manager.cjs |
| **Code Quality** | detect-duplicates.cjs, detect-unused-imports.cjs |
| **Accessibility** | check-accessibility.cjs (with auto-fix!) |
| **CSS Analysis** | analyze-css.cjs, detect-unused-css.cjs |
| **Performance** | detect-slow-components.cjs |
| **Maintenance** | auto-maintain.cjs (runs all checks) |
| **TestCafe** | detect-untested-components.cjs |
| And 11 more... | See `scripts/` folder |

### ✅ 4 AI Agent Skills

Located in `skills/` folder:

- **testcafe-automation/** - E2E test generation
- **duplicate-code-detection/** - DRY refactoring
- **css-style-fixes/** - CSS optimization
- **react-node-automation/** - Comprehensive automation

Compatible with: Cursor IDE, Claude Code, GitHub Copilot, Continue

### ✅ Working React App

- Vite + React setup
- Component examples
- TestCafe E2E tests
- Vitest unit tests

### ✅ GitHub Actions CI

Workflow runs on every push:
- Lint check
- Tests
- Dependency scan
- Duplicate detection
- Accessibility check
- Uploads reports as artifacts

---

## 🧪 Testing All Features

### 1. Dependency Management

```bash
npm run deps:dry-run
```

**Output:**
```
⚡ Scanning for vulnerabilities...

🔒 SECURITY VULNERABILITIES
  Total: 5
  High: 4        ← RED TEXT
  Moderate: 1    ← YELLOW TEXT

⚡ AUTO-UPDATED PACKAGES
  📋 dotenv: 17.4.0 → 17.4.1
```

### 2. Duplicate Code Detection

```bash
npm run detect:duplicates
```

**Output:**
```
📊 DUPLICATE CODE REPORT

📈 Summary
  Total Duplicate Blocks: 5
  Files Affected: 3
  Potential Lines Saved: 47
```

### 3. Accessibility Check

```bash
npm run a11y:check
```

**Output:**
```
♿ ACCESSIBILITY REPORT

📊 Summary
  Total Issues: 12
  Critical: 2
  High: 6
  Auto-fixable: 8

💡 Tip: Run with --auto-fix to automatically fix 8 issues
```

### 4. Auto-Fix Accessibility

```bash
npm run a11y:fix
```

Automatically fixes:
- Missing alt text on images
- Missing aria-labels on buttons
- Missing form labels
- Interactive divs without roles

### 5. Comprehensive Maintenance

```bash
npm run maintain:dry-run
```

Runs ALL checks together:
1. ✅ Dependency scan
2. ✅ Duplicate detection
3. ✅ Accessibility check
4. ✅ Validation

---

## 📊 Reports

All automation scripts generate reports in `reports/` folder:

```bash
ls reports/

# Output:
# dependency-report.json
# dependency-report.md
# duplication-report.json
# accessibility-report.json
# maintenance-report.json
# css-analysis-report.json
# performance-report.json
```

View reports:

```bash
# View dependency report
cat reports/dependency-report.md

# View JSON with formatting
cat reports/duplication-report.json | jq
```

---

## 🤖 AI Agent Skills

### Install for Your AI Tool

```bash
cd skills
./install-skills.sh
```

Choose your tool:
1. Cursor IDE
2. Claude Code
3. Continue (VS Code)
4. Other

Skills will be copied to the appropriate directory.

### What Skills Do

Once installed, your AI assistant can:
- Generate TestCafe E2E tests automatically
- Detect and refactor duplicate code
- Optimize CSS and fix inconsistencies
- Suggest performance improvements
- Fix accessibility issues

---

## 📚 Complete Command Reference

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm test             # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Coverage report
```

### Code Quality
```bash
npm run lint         # Check code
npm run lint:fix     # Fix linting issues
npm run format       # Format code
```

### Dependency Management
```bash
npm run deps:check      # Full scan with updates
npm run deps:dry-run    # Preview without changes
npm run deps:audit      # Security audit only
```

### Duplicate Code
```bash
npm run detect:duplicates        # Find duplicates
npm run detect:unused-imports    # Find unused imports
npm run detect:unused-css        # Find unused CSS
```

### Accessibility
```bash
npm run a11y:check   # Check issues
npm run a11y:fix     # Auto-fix issues
```

### CSS & Styles
```bash
npm run css:analyze  # Analyze quality
npm run css:fix      # Fix issues
```

### Performance
```bash
npm run perf:analyze   # Check performance
npm run perf:optimize  # Suggest optimizations
```

### TestCafe E2E
```bash
npm run testcafe:coverage  # Check E2E coverage
npm run testcafe:run       # Run E2E tests
```

### Comprehensive
```bash
npm run maintain          # Run all checks with fixes
npm run maintain:dry-run  # Preview all checks
npm run validate:skills   # Validate skill format
```

---

## 🎯 Project Structure

```
react-ai-skills/
├── src/                    # React application
│   ├── App.jsx
│   ├── components/
│   └── assets/
├── scripts/                # 19 automation scripts
│   ├── dependency-manager.cjs
│   ├── detect-duplicates.cjs
│   ├── check-accessibility.cjs
│   └── ... (16 more)
├── skills/                 # 4 AI agent skills
│   ├── testcafe-automation/
│   ├── duplicate-code-detection/
│   ├── css-style-fixes/
│   └── react-node-automation/
├── testcafe/               # E2E tests
│   ├── app.testcafe.js
│   └── testapp.e2e.js
├── reports/                # Generated reports
│   └── .gitkeep
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔧 Configuration Files

### Vite Config (`vite.config.js`)
Standard Vite + React setup with HMR

### ESLint Config (`eslint.config.js`)
ESLint 9 flat config with React plugin

### Vitest Setup (`vitest.setup.js`)
Testing library setup with jsdom

---

## 🤝 Contributing

This is a demo repository. For contributions, see the main package:
- [kirti/skills](https://github.com/kirti/skills) - NPM package source

---

## 📄 License

MIT © Kirti Kaushal

---

## 🔗 Links

- **NPM Package:** [@kirti/react-ai-skills](https://www.npmjs.com/package/@kirti/react-ai-skills)
- **Source Code:** [kirti/skills](https://github.com/kirti/skills)
- **Issues:** [Report bugs](https://github.com/kirti/skills/issues)

---

## ⭐ Show Your Support

If this demo helped you understand how to use React AI Skills, give it a star!

---

## 📝 Next Steps

1. ✅ Explore the scripts in `scripts/` folder
2. ✅ Try running different commands
3. ✅ Check the generated reports in `reports/`
4. ✅ Install skills for your AI tool
5. ✅ Customize for your project

**Ready to use in your own project?**

```bash
npm install @kirti/react-ai-skills --save-dev
```

See the [NPM package documentation](https://www.npmjs.com/package/@kirti/react-ai-skills) for installation in your own projects.

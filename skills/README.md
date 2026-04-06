# AI Agent Skills for React Development

This directory contains AI agent skills compatible with Cursor, Claude Code, GitHub Copilot, and other AI coding assistants.

## Available Skills

### 1. TestCafe Automation
**Location:** `testcafe-automation/SKILL.md`

Automates E2E test generation with TestCafe. Creates test files, detects coverage gaps, and generates test scaffolds.

### 2. Duplicate Code Detection  
**Location:** `duplicate-code-detection/SKILL.md`

Finds and refactors duplicate code blocks. Identifies repeated patterns and suggests DRY improvements.

### 3. CSS Style Fixes
**Location:** `css-style-fixes/SKILL.md`

Analyzes and improves CSS quality. Detects inconsistencies, unused styles, and optimization opportunities.

### 4. React Node Automation
**Location:** `react-node-automation/SKILL.md`

Comprehensive automation suite for React projects. Includes TypeScript validation, unused code detection, performance analysis, and accessibility checks.

## Installation

### For Cursor IDE
```bash
cp -r skills/* .cursor/skills/
```

### For Claude Code
```bash
cp -r skills/* ~/.claude/skills/
```

### For Continue (VS Code)
```bash
cp -r skills/* ~/.continue/skills/
```

### Using the Installer
```bash
cd skills
./install-skills.sh
```

Follow the prompts to choose your AI tool.

## Usage

Once installed, your AI assistant will automatically use these skills when:

- Creating or modifying React components
- Writing tests
- Analyzing code quality
- Fixing accessibility issues
- Optimizing CSS
- Managing dependencies

## Skill Format

Each skill contains:
- **Trigger conditions** - When to activate
- **Best practices** - Recommended approaches
- **Code examples** - Real-world patterns
- **Common patterns** - Frequently used solutions

## Contributing

To add a new skill:

1. Create a folder: `skills/skill-name/`
2. Add `SKILL.md` with documentation
3. Follow the existing skill structure
4. Test with your AI tool

## Compatibility

✅ Cursor IDE  
✅ Claude Code  
✅ GitHub Copilot  
✅ Continue (VS Code)  
✅ Windsurf  
✅ Other AI coding assistants supporting markdown skills

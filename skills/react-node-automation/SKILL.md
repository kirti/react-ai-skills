---
name: react-node-automation
description: Comprehensive automation suite for React/Node projects including TypeScript validation, unused code detection, performance optimization, accessibility checks, and commit automation
version: 1.0.0
tags: [react, node, typescript, performance, accessibility, automation, code-quality]
---

# React + Node Comprehensive Automation

## When to Use This Skill
- Automating code quality checks
- Ensuring TypeScript/PropTypes accuracy
- Detecting and removing dead code
- Optimizing component performance
- Enforcing accessibility standards
- Automating commit workflows
- Comprehensive project maintenance

This skill combines multiple automation capabilities into a unified workflow.

---

## 1. Automatic PropType/TypeScript Validation

### Auto-Generate PropTypes from Usage

```javascript
// scripts/generate-proptypes.js
import fs from 'fs';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

class PropTypeGenerator {
  constructor() {
    this.components = new Map();
  }

  async analyzeComponent(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    const propUsages = new Set();

    traverse(ast, {
      // Find function components
      FunctionDeclaration(path) {
        const params = path.node.params;
        if (params.length > 0 && params[0].type === 'ObjectPattern') {
          // Extract destructured props
          params[0].properties.forEach(prop => {
            if (prop.key) {
              propUsages.add(prop.key.name);
            }
          });
        }
      },
      
      // Find props accessed as props.something
      MemberExpression(path) {
        if (path.node.object.name === 'props') {
          propUsages.add(path.node.property.name);
        }
      }
    });

    return this.inferPropTypes(propUsages, ast);
  }

  inferPropTypes(propNames, ast) {
    const propTypes = {};

    propNames.forEach(propName => {
      // Infer type from usage
      const type = this.inferType(propName, ast);
      propTypes[propName] = type;
    });

    return propTypes;
  }

  inferType(propName, ast) {
    let inferredType = 'any';

    traverse(ast, {
      // Check how prop is used
      MemberExpression(path) {
        if (path.node.property.name === propName) {
          const parent = path.parent;
          
          // If used as function: propName()
          if (parent.type === 'CallExpression') {
            inferredType = 'func';
          }
          
          // If used with .map(): propName.map()
          if (parent.type === 'MemberExpression' && 
              parent.property.name === 'map') {
            inferredType = 'arrayOf(any)';
          }
          
          // If used with .length
          if (parent.type === 'MemberExpression' && 
              parent.property.name === 'length') {
            inferredType = 'string or array';
          }
        }
      },
      
      // Check default values
      AssignmentPattern(path) {
        if (path.node.left.name === propName) {
          const defaultValue = path.node.right;
          
          if (defaultValue.type === 'StringLiteral') {
            inferredType = 'string';
          } else if (defaultValue.type === 'NumericLiteral') {
            inferredType = 'number';
          } else if (defaultValue.type === 'BooleanLiteral') {
            inferredType = 'bool';
          } else if (defaultValue.type === 'ArrayExpression') {
            inferredType = 'array';
          } else if (defaultValue.type === 'ObjectExpression') {
            inferredType = 'object';
          }
        }
      }
    });

    return inferredType;
  }

  generatePropTypesCode(propTypes) {
    const imports = `import PropTypes from 'prop-types';\n\n`;
    
    const propTypesObj = Object.entries(propTypes)
      .map(([name, type]) => `  ${name}: PropTypes.${type}`)
      .join(',\n');

    return `${imports}ComponentName.propTypes = {\n${propTypesObj}\n};\n`;
  }
}

// Usage
const generator = new PropTypeGenerator();
const propTypes = await generator.analyzeComponent('./src/Button.jsx');
const code = generator.generatePropTypesCode(propTypes);

console.log('Generated PropTypes:\n');
console.log(code);
```

### Auto-Generate TypeScript Interfaces

```typescript
// scripts/generate-typescript-interfaces.ts
import fs from 'fs';
import * as ts from 'typescript';

class TypeScriptGenerator {
  analyzeComponent(filePath: string): Record<string, string> {
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const propTypes: Record<string, string> = {};

    const visit = (node: ts.Node) => {
      // Find function components
      if (ts.isFunctionDeclaration(node) || 
          ts.isArrowFunction(node)) {
        
        node.parameters.forEach(param => {
          if (ts.isObjectBindingPattern(param.name)) {
            param.name.elements.forEach(element => {
              const name = element.name.getText();
              const type = this.inferTypeFromUsage(name, sourceFile);
              propTypes[name] = type;
            });
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return propTypes;
  }

  inferTypeFromUsage(propName: string, sourceFile: ts.SourceFile): string {
    // Simplified type inference
    return 'string'; // Would be more sophisticated in production
  }

  generateInterface(componentName: string, props: Record<string, string>): string {
    const propsString = Object.entries(props)
      .map(([name, type]) => `  ${name}: ${type};`)
      .join('\n');

    return `
interface ${componentName}Props {
${propsString}
}

const ${componentName}: React.FC<${componentName}Props> = ({ ${Object.keys(props).join(', ')} }) => {
  // Component implementation
};
`;
  }
}
```

---

## 2. Unused Code Detection

### Detect Unused Imports

```javascript
// scripts/detect-unused-imports.js
import fs from 'fs';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

class UnusedImportDetector {
  detectUnused(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    const imports = new Set();
    const used = new Set();

    // Collect all imports
    traverse(ast, {
      ImportDeclaration(path) {
        path.node.specifiers.forEach(spec => {
          if (spec.local) {
            imports.add(spec.local.name);
          }
        });
      }
    });

    // Collect all usages
    traverse(ast, {
      Identifier(path) {
        // Skip import declarations themselves
        if (path.parent.type !== 'ImportSpecifier' &&
            path.parent.type !== 'ImportDefaultSpecifier') {
          used.add(path.node.name);
        }
      }
    });

    // Find unused
    const unused = Array.from(imports).filter(name => !used.has(name));

    return {
      file: filePath,
      totalImports: imports.size,
      unusedImports: unused
    };
  }

  async scanProject(dir) {
    const files = this.getAllJSFiles(dir);
    const results = [];

    files.forEach(file => {
      const result = this.detectUnused(file);
      if (result.unusedImports.length > 0) {
        results.push(result);
      }
    });

    return results;
  }

  getAllJSFiles(dir) {
    // Implementation similar to previous examples
    return [];
  }

  async removeUnusedImports(filePath, unused) {
    const content = fs.readFileSync(filePath, 'utf8');
    let updated = content;

    unused.forEach(name => {
      // Remove import statement
      const importRegex = new RegExp(
        `import\\s+{[^}]*\\b${name}\\b[^}]*}\\s+from\\s+['"]['"];?\\s*`,
        'g'
      );
      updated = updated.replace(importRegex, '');
    });

    fs.writeFileSync(filePath, updated);
  }
}

// Usage
const detector = new UnusedImportDetector();
const results = await detector.scanProject('./src');

console.log('📊 Unused Imports Report\n');
results.forEach(result => {
  console.log(`📄 ${result.file}`);
  console.log(`   Unused: ${result.unusedImports.join(', ')}\n`);
});
```

### Detect Unused CSS

```javascript
// scripts/detect-unused-css.js
import fs from 'fs';
import postcss from 'postcss';

class UnusedCSSDetector {
  async detect(cssPath, srcDir) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const ast = postcss.parse(cssContent);

    const definedClasses = new Set();
    const usedClasses = new Set();

    // Extract all class definitions
    ast.walkRules(rule => {
      const classes = rule.selector.match(/\.[a-zA-Z_-][a-zA-Z0-9_-]*/g);
      if (classes) {
        classes.forEach(cls => definedClasses.add(cls.slice(1)));
      }
    });

    // Find usage in JS/JSX files
    const jsFiles = this.getAllJSFiles(srcDir);
    jsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      definedClasses.forEach(cls => {
        if (content.includes(cls)) {
          usedClasses.add(cls);
        }
      });
    });

    const unused = Array.from(definedClasses).filter(
      cls => !usedClasses.has(cls)
    );

    return {
      totalClasses: definedClasses.size,
      usedClasses: usedClasses.size,
      unusedClasses: unused
    };
  }

  getAllJSFiles(dir) {
    // Implementation
    return [];
  }
}
```

---

## 3. Performance Optimization

### Detect Slow Components

```javascript
// scripts/detect-slow-components.js
class PerformanceAnalyzer {
  detectSlowPatterns(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Pattern 1: Missing React.memo
    if (this.isFunctionalComponent(content) && 
        !content.includes('React.memo') &&
        !content.includes('memo(')) {
      issues.push({
        type: 'missing-memo',
        severity: 'medium',
        suggestion: 'Consider wrapping with React.memo to prevent unnecessary re-renders'
      });
    }

    // Pattern 2: Inline function definitions
    const inlineFunctions = content.match(/onClick={\(\) =>/g);
    if (inlineFunctions && inlineFunctions.length > 2) {
      issues.push({
        type: 'inline-functions',
        count: inlineFunctions.length,
        severity: 'high',
        suggestion: 'Use useCallback to memoize event handlers'
      });
    }

    // Pattern 3: Missing key prop in lists
    if (content.includes('.map(') && !content.includes('key=')) {
      issues.push({
        type: 'missing-keys',
        severity: 'critical',
        suggestion: 'Add unique key prop to list items'
      });
    }

    // Pattern 4: Large inline objects/arrays
    const inlineObjects = content.match(/=\s*{[^}]{50,}}/g);
    if (inlineObjects && inlineObjects.length > 0) {
      issues.push({
        type: 'inline-objects',
        count: inlineObjects.length,
        severity: 'medium',
        suggestion: 'Move objects outside component or use useMemo'
      });
    }

    return issues;
  }

  isFunctionalComponent(content) {
    return /function\s+\w+\s*\([^)]*\)\s*{[\s\S]*return\s+</m.test(content) ||
           /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*return\s+</m.test(content);
  }

  generateOptimizations(issues) {
    const optimizations = [];

    issues.forEach(issue => {
      switch (issue.type) {
        case 'missing-memo':
          optimizations.push({
            code: `export default React.memo(ComponentName);`,
            explanation: 'Prevents re-renders when props haven\'t changed'
          });
          break;

        case 'inline-functions':
          optimizations.push({
            code: `const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);`,
            explanation: 'Memoizes function to prevent recreation on each render'
          });
          break;

        case 'missing-keys':
          optimizations.push({
            code: `items.map(item => <div key={item.id}>...</div>)`,
            explanation: 'Helps React identify which items changed'
          });
          break;

        case 'inline-objects':
          optimizations.push({
            code: `const config = useMemo(() => ({
  // object properties
}), [dependencies]);`,
            explanation: 'Prevents object recreation on each render'
          });
          break;
      }
    });

    return optimizations;
  }
}
```

### Detect Inefficient Loops

```javascript
// Detect nested loops and suggest optimization
class LoopOptimizer {
  detectInefficient Loops(content) {
    const issues = [];

    // Nested loops
    const nestedLoops = content.match(/for\s*\([^)]+\)\s*{[^}]*for\s*\(/g);
    if (nestedLoops) {
      issues.push({
        type: 'nested-loops',
        count: nestedLoops.length,
        suggestion: 'Consider using Map/Set for O(1) lookups instead of O(n²)'
      });
    }

    // Array methods in loops
    const arrayMethodsInLoops = content.match(/for[^{]*{[^}]*\.(find|filter|includes)/g);
    if (arrayMethodsInLoops) {
      issues.push({
        type: 'expensive-operations-in-loop',
        suggestion: 'Move array operations outside loop or use Set for lookups'
      });
    }

    return issues;
  }

  suggestOptimization(issue) {
    if (issue.type === 'nested-loops') {
      return `
// ❌ Before (O(n²))
for (const item of items) {
  for (const other of otherItems) {
    if (item.id === other.id) { /* ... */ }
  }
}

// ✅ After (O(n))
const otherMap = new Map(otherItems.map(item => [item.id, item]));
for (const item of items) {
  const match = otherMap.get(item.id);
  if (match) { /* ... */ }
}
`;
    }
  }
}
```

---

## 4. Accessibility Checks

### Auto-Detect Missing ARIA Attributes

```javascript
// scripts/check-accessibility.js
class AccessibilityChecker {
  checkComponent(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Check for images without alt text
    const imgRegex = /<img[^>]*>/g;
    const images = content.match(imgRegex) || [];
    
    images.forEach((img, index) => {
      if (!img.includes('alt=')) {
        issues.push({
          type: 'missing-alt-text',
          line: this.getLineNumber(content, img),
          element: img,
          fix: img.replace('<img', '<img alt="Description"'),
          severity: 'high'
        });
      }
    });

    // Check for buttons without aria-label
    const buttonRegex = /<button[^>]*>[^<]*<\/button>/g;
    const buttons = content.match(buttonRegex) || [];
    
    buttons.forEach(button => {
      const hasText = /<button[^>]*>([^<]+)<\/button>/.test(button);
      const hasAriaLabel = button.includes('aria-label');
      
      if (!hasText && !hasAriaLabel) {
        issues.push({
          type: 'button-no-label',
          element: button,
          severity: 'critical',
          suggestion: 'Add aria-label or visible text content'
        });
      }
    });

    // Check for form inputs without labels
    const inputRegex = /<input[^>]*>/g;
    const inputs = content.match(inputRegex) || [];
    
    inputs.forEach(input => {
      const hasId = /id="([^"]+)"/.exec(input);
      if (hasId) {
        const id = hasId[1];
        const hasLabel = content.includes(`htmlFor="${id}"`);
        const hasAriaLabel = input.includes('aria-label');
        
        if (!hasLabel && !hasAriaLabel) {
          issues.push({
            type: 'input-no-label',
            element: input,
            severity: 'high',
            suggestion: `Add <label htmlFor="${id}">Label Text</label>`
          });
        }
      }
    });

    // Check for interactive elements without role
    const divClickRegex = /<div[^>]*onClick[^>]*>/g;
    const clickableDivs = content.match(divClickRegex) || [];
    
    clickableDivs.forEach(div => {
      if (!div.includes('role=')) {
        issues.push({
          type: 'interactive-no-role',
          element: div,
          severity: 'medium',
          fix: div.replace('<div', '<div role="button"'),
          suggestion: 'Add role="button" and onKeyPress handler'
        });
      }
    });

    return issues;
  }

  getLineNumber(content, substring) {
    const index = content.indexOf(substring);
    return content.substring(0, index).split('\n').length;
  }

  generateAccessibilityReport(issues) {
    const report = {
      summary: {
        total: issues.length,
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length
      },
      issues: issues,
      autoFixable: issues.filter(i => i.fix).length
    };

    return report;
  }

  async autoFix(filePath, issues) {
    let content = fs.readFileSync(filePath, 'utf8');

    issues.forEach(issue => {
      if (issue.fix) {
        content = content.replace(issue.element, issue.fix);
      }
    });

    fs.writeFileSync(filePath, content);
    return {
      file: filePath,
      fixed: issues.filter(i => i.fix).length
    };
  }
}

// Usage
const checker = new AccessibilityChecker();
const issues = checker.checkComponent('./src/Button.jsx');
const report = checker.generateAccessibilityReport(issues);

console.log('♿ Accessibility Report\n');
console.log(`Total Issues: ${report.summary.total}`);
console.log(`Critical: ${report.summary.critical}`);
console.log(`High: ${report.summary.high}`);
console.log(`Auto-fixable: ${report.autoFixable}\n`);

issues.forEach(issue => {
  console.log(`[${issue.severity.toUpperCase()}] ${issue.type}`);
  console.log(`  Element: ${issue.element.substring(0, 50)}...`);
  console.log(`  Fix: ${issue.suggestion}\n`);
});
```

---

## 5. Commit Message Automation

### Husky + Commitlint Setup

```bash
# Install dependencies
npm install -D husky @commitlint/cli @commitlint/config-conventional

# Initialize husky
npx husky init
```

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting
        'refactor', // Code restructuring
        'perf',     // Performance
        'test',     // Tests
        'chore',    // Maintenance
        'ci',       // CI/CD
        'build'     // Build system
      ]
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100]
  }
};
```

### Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

echo "🔍 Running pre-commit checks..."

# 1. Lint staged files
npx lint-staged

# 2. Run type checking
npm run type-check

# 3. Run tests related to staged files
npm run test:staged

# 4. Check for console.logs
if git diff --cached --name-only | grep -E '\.(js|jsx|ts|tsx)$' | xargs grep -n 'console\.log' ; then
  echo "❌ Found console.log statements"
  echo "Please remove them before committing"
  exit 1
fi

# 5. Check for debugger statements
if git diff --cached --name-only | grep -E '\.(js|jsx|ts|tsx)$' | xargs grep -n 'debugger' ; then
  echo "❌ Found debugger statements"
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

### Lint-staged Configuration

```javascript
// .lintstagedrc.js
module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'npm run test:related'
  ],
  '*.{css,scss}': [
    'stylelint --fix',
    'prettier --write'
  ],
  '*.{json,md}': [
    'prettier --write'
  ]
};
```

---

## 6. Unified Automation Workflow

### Master Automation Script

```javascript
// scripts/auto-maintain.js
import { PropTypeGenerator } from './generate-proptypes.js';
import { UnusedImportDetector } from './detect-unused-imports.js';
import { PerformanceAnalyzer } from './detect-slow-components.js';
import { AccessibilityChecker } from './check-accessibility.js';

class ProjectMaintainer {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.report = {
      timestamp: new Date().toISOString(),
      checks: [],
      fixes: [],
      suggestions: []
    };
  }

  async runAll(srcDir) {
    console.log('🚀 Starting automated project maintenance...\n');

    // 1. Prop Types
    await this.checkPropTypes(srcDir);

    // 2. Unused Code
    await this.removeUnusedCode(srcDir);

    // 3. Performance
    await this.optimizePerformance(srcDir);

    // 4. Accessibility
    await this.fixAccessibility(srcDir);

    // 5. Validate
    await this.validate();

    // 6. Generate Report
    this.generateReport();

    console.log('\n✅ Maintenance complete!');
  }

  async checkPropTypes(srcDir) {
    console.log('📝 Checking PropTypes...');
    const generator = new PropTypeGenerator();
    const files = this.getAllComponentFiles(srcDir);

    for (const file of files) {
      const propTypes = await generator.analyzeComponent(file);
      
      if (Object.keys(propTypes).length > 0 && !this.hasPropTypes(file)) {
        this.report.suggestions.push({
          type: 'add-proptypes',
          file,
          propTypes
        });
      }
    }
  }

  async removeUnusedCode(srcDir) {
    console.log('🗑️  Removing unused code...');
    const detector = new UnusedImportDetector();
    const results = await detector.scanProject(srcDir);

    for (const result of results) {
      if (!this.dryRun) {
        await detector.removeUnusedImports(
          result.file,
          result.unusedImports
        );
        
        this.report.fixes.push({
          type: 'removed-unused-imports',
          file: result.file,
          count: result.unusedImports.length
        });
      } else {
        this.report.suggestions.push({
          type: 'remove-unused-imports',
          file: result.file,
          imports: result.unusedImports
        });
      }
    }
  }

  async optimizePerformance(srcDir) {
    console.log('⚡ Optimizing performance...');
    const analyzer = new PerformanceAnalyzer();
    const files = this.getAllComponentFiles(srcDir);

    for (const file of files) {
      const issues = analyzer.detectSlowPatterns(file);
      
      if (issues.length > 0) {
        const optimizations = analyzer.generateOptimizations(issues);
        
        this.report.suggestions.push({
          type: 'performance-optimization',
          file,
          issues,
          optimizations
        });
      }
    }
  }

  async fixAccessibility(srcDir) {
    console.log('♿ Checking accessibility...');
    const checker = new AccessibilityChecker();
    const files = this.getAllComponentFiles(srcDir);

    for (const file of files) {
      const issues = checker.checkComponent(file);
      
      if (issues.length > 0) {
        if (!this.dryRun) {
          const result = await checker.autoFix(file, issues);
          this.report.fixes.push({
            type: 'accessibility-fixes',
            ...result
          });
        } else {
          this.report.suggestions.push({
            type: 'accessibility-issues',
            file,
            issues
          });
        }
      }
    }
  }

  async validate() {
    console.log('🧪 Validating changes...');

    const steps = [
      { name: 'Install', cmd: 'npm install' },
      { name: 'Type Check', cmd: 'npm run type-check' },
      { name: 'Lint', cmd: 'npm run lint' },
      { name: 'Test', cmd: 'npm test' },
      { name: 'Build', cmd: 'npm run build' }
    ];

    for (const step of steps) {
      const result = await this.exec(step.cmd);
      
      this.report.checks.push({
        step: step.name,
        success: result.success,
        error: result.error
      });

      if (!result.success) {
        console.log(`❌ ${step.name} failed`);
        return false;
      }
      
      console.log(`✅ ${step.name} passed`);
    }

    return true;
  }

  generateReport() {
    const reportPath = './maintenance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));

    console.log('\n📊 Maintenance Report\n');
    console.log(`Fixes Applied: ${this.report.fixes.length}`);
    console.log(`Suggestions: ${this.report.suggestions.length}`);
    console.log(`Validation Checks: ${this.report.checks.length}`);
    console.log(`\nFull report: ${reportPath}`);
  }

  getAllComponentFiles(dir) {
    // Implementation
    return [];
  }

  hasPropTypes(file) {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('.propTypes') || content.includes('PropTypes');
  }

  exec(command) {
    // Implementation similar to dependency manager
    return { success: true };
  }
}

// CLI
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run')
};

const maintainer = new ProjectMaintainer(options);
await maintainer.runAll('./src');
```

### Package.json Scripts

```json
{
  "scripts": {
    "maintain": "node scripts/auto-maintain.js",
    "maintain:dry-run": "node scripts/auto-maintain.js --dry-run",
    "type-check": "tsc --noEmit",
    "test:staged": "jest --findRelatedTests",
    "prepare": "husky install"
  }
}
```

---

## Summary Checklist

- ✅ Auto-generate PropTypes/TypeScript interfaces
- ✅ Detect and remove unused imports/code
- ✅ Detect and optimize slow components
- ✅ Find inefficient loops and suggest optimization
- ✅ Auto-check accessibility (ARIA, alt text, labels)
- ✅ Enforce commit message standards
- ✅ Pre-commit hooks for code quality
- ✅ Unified automation workflow
- ✅ Comprehensive validation (install/build/test)
- ✅ Detailed maintenance reports

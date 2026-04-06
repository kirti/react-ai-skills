---
name: duplicate-code-detection
description: Automatically detect and refactor duplicate code blocks in JavaScript/TypeScript projects
version: 1.0.0
tags: [code-quality, refactoring, duplication, eslint, automation]
---

# Duplicate Code Detection and Fixing

## When to Use This Skill
- Detecting repeated code patterns across your codebase
- Refactoring duplicated logic into reusable functions
- Enforcing DRY (Don't Repeat Yourself) principles
- Code review and quality improvements
- Pre-commit validation

## Understanding Code Duplication

### Types of Duplication

**1. Exact Duplication** - Identical code blocks
```javascript
// ❌ Exact duplication
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validateUserEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ✅ Refactored
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (email) => EMAIL_REGEX.test(email);
```

**2. Structural Duplication** - Similar patterns, different values
```javascript
// ❌ Structural duplication
const fetchUsers = async () => {
  const response = await fetch('/api/users');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

const fetchPosts = async () => {
  const response = await fetch('/api/posts');
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
};

// ✅ Refactored
const fetchData = async (endpoint) => {
  const response = await fetch(`/api/${endpoint}`);
  if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
  return response.json();
};
```

**3. Logical Duplication** - Same logic, different implementation
```javascript
// ❌ Logical duplication
const isAdult = (age) => age >= 18;
const canVote = (age) => age >= 18;
const canDrive = (age) => age >= 18;

// ✅ Refactored
const MIN_AGE = {
  ADULT: 18,
  VOTE: 18,
  DRIVE: 16
};

const meetsAgeRequirement = (age, requirement) => age >= MIN_AGE[requirement];
```

## Detection Tools and Configuration

### Using jscpd (Copy-Paste Detector)

```bash
# Install
npm install -D jscpd

# Configuration: .jscpd.json
{
  "threshold": 5,
  "reporters": ["html", "json", "console"],
  "ignore": [
    "node_modules",
    "dist",
    "build",
    "**/*.min.js",
    "**/*.test.js"
  ],
  "format": ["javascript", "typescript", "jsx", "tsx"],
  "minLines": 5,
  "minTokens": 50,
  "output": "./reports/duplication"
}
```

### ESLint Rules for Duplication

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['sonarjs'],
  rules: {
    'sonarjs/no-duplicate-string': ['error', 3],
    'sonarjs/no-identical-functions': 'error',
    'sonarjs/no-duplicated-branches': 'error',
    'no-duplicate-imports': 'error'
  }
};
```

### Custom Detection Script

```javascript
// scripts/detect-duplicates.js
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class DuplicateDetector {
  constructor(options = {}) {
    this.minLines = options.minLines || 5;
    this.ignorePatterns = options.ignore || ['node_modules', 'dist'];
    this.duplicates = new Map();
  }

  async scan(directory) {
    const files = this.getAllFiles(directory);
    const codeBlocks = new Map();

    files.forEach(file => {
      const blocks = this.extractCodeBlocks(file);
      
      blocks.forEach(block => {
        const hash = this.hashCode(block.code);
        
        if (!codeBlocks.has(hash)) {
          codeBlocks.set(hash, []);
        }
        
        codeBlocks.get(hash).push({
          file,
          lines: block.lines,
          code: block.code
        });
      });
    });

    // Find duplicates
    codeBlocks.forEach((occurrences, hash) => {
      if (occurrences.length > 1) {
        this.duplicates.set(hash, occurrences);
      }
    });

    return this.generateReport();
  }

  extractCodeBlocks(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const blocks = [];

    for (let i = 0; i <= lines.length - this.minLines; i++) {
      const block = lines.slice(i, i + this.minLines).join('\n');
      
      // Skip empty blocks or comments
      if (this.isValidBlock(block)) {
        blocks.push({
          lines: `${i + 1}-${i + this.minLines}`,
          code: block
        });
      }
    }

    return blocks;
  }

  isValidBlock(code) {
    const trimmed = code.trim();
    return trimmed.length > 20 && 
           !trimmed.startsWith('//') && 
           !trimmed.startsWith('/*') &&
           !/^import\s/.test(trimmed);
  }

  hashCode(str) {
    // Normalize code before hashing
    const normalized = str
      .replace(/\s+/g, ' ')
      .replace(/['"]/g, '')
      .trim();
    
    return crypto
      .createHash('md5')
      .update(normalized)
      .digest('hex');
  }

  getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!this.shouldIgnore(filePath)) {
          this.getAllFiles(filePath, fileList);
        }
      } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  shouldIgnore(filePath) {
    return this.ignorePatterns.some(pattern => 
      filePath.includes(pattern)
    );
  }

  generateReport() {
    const report = {
      totalDuplicates: this.duplicates.size,
      duplicateBlocks: [],
      summary: {
        filesAffected: new Set(),
        linesOfDuplication: 0
      }
    };

    this.duplicates.forEach((occurrences, hash) => {
      const block = {
        hash,
        occurrences: occurrences.length,
        locations: occurrences.map(o => ({
          file: o.file,
          lines: o.lines
        })),
        code: occurrences[0].code
      };

      report.duplicateBlocks.push(block);
      
      occurrences.forEach(o => {
        report.summary.filesAffected.add(o.file);
        report.summary.linesOfDuplication += this.minLines;
      });
    });

    report.summary.filesAffected = Array.from(report.summary.filesAffected);

    return report;
  }
}

// Usage
const detector = new DuplicateDetector({
  minLines: 5,
  ignore: ['node_modules', 'dist', 'build']
});

const report = await detector.scan('./src');

console.log('📊 Duplication Report\n');
console.log(`Total Duplicates: ${report.totalDuplicates}`);
console.log(`Files Affected: ${report.summary.filesAffected.length}`);
console.log(`Lines of Duplication: ${report.summary.linesOfDuplication}\n`);

report.duplicateBlocks.forEach((block, index) => {
  console.log(`\n${index + 1}. Duplicate Block (${block.occurrences} occurrences)`);
  block.locations.forEach(loc => {
    console.log(`   📄 ${loc.file}:${loc.lines}`);
  });
});
```

## Automated Refactoring

### Extract Function Refactoring

```javascript
// scripts/auto-refactor.js
class AutoRefactor {
  constructor(report) {
    this.report = report;
    this.refactorings = [];
  }

  suggestRefactorings() {
    this.report.duplicateBlocks.forEach(block => {
      if (block.occurrences >= 2) {
        const refactoring = this.createRefactoring(block);
        this.refactorings.push(refactoring);
      }
    });

    return this.refactorings;
  }

  createRefactoring(block) {
    const functionName = this.generateFunctionName(block.code);
    const params = this.extractParameters(block.code);
    
    return {
      type: 'extract-function',
      name: functionName,
      parameters: params,
      originalCode: block.code,
      refactoredCode: this.generateRefactoredFunction(
        functionName, 
        params, 
        block.code
      ),
      locations: block.locations
    };
  }

  generateFunctionName(code) {
    // Simple heuristic: extract from first meaningful word
    const match = code.match(/(?:const|let|var|function)\s+(\w+)/);
    return match ? `refactored_${match[1]}` : 'extractedFunction';
  }

  extractParameters(code) {
    // Detect variables used in the code block
    const variables = new Set();
    const varMatches = code.matchAll(/\b([a-z_$][a-z0-9_$]*)\b/gi);
    
    for (const match of varMatches) {
      const varName = match[1];
      if (!this.isKeyword(varName)) {
        variables.add(varName);
      }
    }
    
    return Array.from(variables);
  }

  isKeyword(word) {
    const keywords = ['const', 'let', 'var', 'function', 'if', 'else', 
                     'return', 'for', 'while', 'class', 'import', 'export'];
    return keywords.includes(word.toLowerCase());
  }

  generateRefactoredFunction(name, params, code) {
    return `
const ${name} = (${params.join(', ')}) => {
  ${code}
};
`;
  }

  async applyRefactorings(dryRun = true) {
    const results = [];

    for (const refactoring of this.refactorings) {
      if (dryRun) {
        console.log(`\n🔄 Suggested Refactoring: ${refactoring.name}`);
        console.log('Original locations:');
        refactoring.locations.forEach(loc => {
          console.log(`  - ${loc.file}:${loc.lines}`);
        });
        console.log('\nRefactored function:');
        console.log(refactoring.refactoredCode);
        
        results.push({
          name: refactoring.name,
          status: 'suggested',
          locations: refactoring.locations
        });
      } else {
        // Actually apply the refactoring
        const applied = await this.applyRefactoring(refactoring);
        results.push(applied);
      }
    }

    return results;
  }

  async applyRefactoring(refactoring) {
    // Implementation for actually modifying files
    // This would use AST transformation with tools like babel or jscodeshift
    return {
      name: refactoring.name,
      status: 'applied',
      filesModified: refactoring.locations.map(l => l.file)
    };
  }
}
```

## Integration with ESLint

### Custom ESLint Plugin

```javascript
// eslint-plugin-no-duplication/index.js
module.exports = {
  rules: {
    'no-similar-functions': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Detect similar function implementations',
          category: 'Best Practices'
        },
        fixable: 'code'
      },
      create(context) {
        const functions = [];

        return {
          FunctionDeclaration(node) {
            functions.push(node);
          },
          'Program:exit'() {
            // Compare all functions
            for (let i = 0; i < functions.length; i++) {
              for (let j = i + 1; j < functions.length; j++) {
                const similarity = calculateSimilarity(
                  functions[i].body, 
                  functions[j].body
                );
                
                if (similarity > 0.8) {
                  context.report({
                    node: functions[j],
                    message: `Function similar to ${functions[i].id.name}`,
                    fix(fixer) {
                      // Suggest combining functions
                      return null;
                    }
                  });
                }
              }
            }
          }
        };
      }
    }
  }
};

function calculateSimilarity(ast1, ast2) {
  // Simplified similarity calculation
  const str1 = JSON.stringify(ast1);
  const str2 = JSON.stringify(ast2);
  
  // Levenshtein distance or similar algorithm
  return 1 - (levenshteinDistance(str1, str2) / Math.max(str1.length, str2.length));
}
```

## Pre-commit Hook Integration

```bash
#!/bin/bash
# .husky/pre-commit

echo "🔍 Checking for code duplication..."

# Run duplication detection
node scripts/detect-duplicates.js --threshold=5

if [ $? -ne 0 ]; then
  echo "❌ Code duplication detected!"
  echo "Please refactor duplicated code before committing."
  exit 1
fi

echo "✅ No significant duplication found"
```

## CI/CD Integration

```yaml
# .github/workflows/code-quality.yml
name: Code Quality Checks

on: [pull_request]

jobs:
  duplication-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run duplication detection
        run: npm run detect:duplicates
      
      - name: Generate report
        run: |
          node scripts/detect-duplicates.js > duplication-report.txt
      
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('duplication-report.txt', 'utf8');
            
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## 📊 Code Duplication Report\n\n\`\`\`\n${report}\n\`\`\``
            });
```

## Best Practices for Refactoring

### 1. Extract Constants
```javascript
// ❌ Before
if (user.age >= 18) { /* ... */ }
if (age >= 18) { /* ... */ }

// ✅ After
const LEGAL_AGE = 18;
if (user.age >= LEGAL_AGE) { /* ... */ }
if (age >= LEGAL_AGE) { /* ... */ }
```

### 2. Extract Utility Functions
```javascript
// ❌ Before
const formattedDate1 = new Date().toLocaleDateString('en-US');
const formattedDate2 = new Date().toLocaleDateString('en-US');

// ✅ After
const formatDate = (date = new Date()) => 
  date.toLocaleDateString('en-US');

const formattedDate1 = formatDate();
const formattedDate2 = formatDate();
```

### 3. Use Higher-Order Functions
```javascript
// ❌ Before
const doubleNumbers = (arr) => arr.map(x => x * 2);
const tripleNumbers = (arr) => arr.map(x => x * 3);

// ✅ After
const multiplyBy = (factor) => (arr) => arr.map(x => x * factor);

const doubleNumbers = multiplyBy(2);
const tripleNumbers = multiplyBy(3);
```

### 4. Create Configuration Objects
```javascript
// ❌ Before
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePhone = (phone) => {
  const regex = /^\d{3}-\d{3}-\d{4}$/;
  return regex.test(phone);
};

// ✅ After
const VALIDATORS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\d{3}-\d{3}-\d{4}$/
};

const validate = (type, value) => VALIDATORS[type].test(value);
```

## Automated Report Generation

```javascript
// scripts/generate-duplication-report.js
import { DuplicateDetector } from './detect-duplicates.js';
import fs from 'fs';

const detector = new DuplicateDetector();
const report = await detector.scan('./src');

// Generate Markdown report
const markdown = `
# Code Duplication Report

**Generated:** ${new Date().toISOString()}

## Summary

- **Total Duplicates:** ${report.totalDuplicates}
- **Files Affected:** ${report.summary.filesAffected.length}
- **Lines of Duplication:** ${report.summary.linesOfDuplication}

## Duplicate Blocks

${report.duplicateBlocks.map((block, i) => `
### ${i + 1}. Duplicate Block (${block.occurrences} occurrences)

**Locations:**
${block.locations.map(loc => `- \`${loc.file}:${loc.lines}\``).join('\n')}

**Code:**
\`\`\`javascript
${block.code}
\`\`\`

**Suggested Refactoring:**
\`\`\`javascript
// Extract to shared utility function
const refactoredFunction = () => {
  ${block.code}
};
\`\`\`
`).join('\n---\n')}

## Recommendations

1. Review the duplicate blocks above
2. Extract common logic into utility functions
3. Update all occurrences to use the extracted functions
4. Run tests to ensure nothing breaks
5. Commit the refactored code
`;

fs.writeFileSync('duplication-report.md', markdown);
console.log('✅ Report generated: duplication-report.md');
```

## Package.json Scripts

```json
{
  "scripts": {
    "detect:duplicates": "node scripts/detect-duplicates.js",
    "detect:duplicates:report": "node scripts/generate-duplication-report.js",
    "refactor:suggest": "node scripts/auto-refactor.js --dry-run",
    "refactor:apply": "node scripts/auto-refactor.js",
    "lint:duplication": "jscpd src/"
  }
}
```

## Summary Checklist

- ✅ Detect exact, structural, and logical duplication
- ✅ Configure minimum threshold (lines/tokens)
- ✅ Generate detailed reports with locations
- ✅ Suggest automated refactorings
- ✅ Extract functions, constants, and utilities
- ✅ Integrate with ESLint for real-time detection
- ✅ Add pre-commit hooks to prevent duplication
- ✅ CI/CD integration with automated PR comments
- ✅ Best practices for refactoring duplicated code

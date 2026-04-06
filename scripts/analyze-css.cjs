#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🎨 Analyzing CSS Quality...\n');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

function getAllCSSFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        results = results.concat(getAllCSSFiles(filePath));
      } else if (file.endsWith('.css') || file.endsWith('.scss')) {
        results.push(filePath);
      }
    } catch (e) {}
  });
  return results;
}

const files = getAllCSSFiles('./src');
console.log(`📁 Analyzing ${files.length} CSS/SCSS files\n`);

const report = {
  totalFiles: files.length,
  totalRules: 0,
  issues: {
    duplicateSelectors: [],
    colorInconsistency: new Set(),
    spacingInconsistency: new Set(),
    importantOveruse: [],
    deepNesting: []
  }
};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  // Count rules
  const ruleMatches = content.match(/[^{]+\{[^}]*\}/g) || [];
  report.totalRules += ruleMatches.length;
  
  // Check for !important overuse
  const importantCount = (content.match(/!important/g) || []).length;
  if (importantCount > 5) {
    report.issues.importantOveruse.push({ file, count: importantCount });
  }
  
  // Extract colors
  const colorRegex = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g;
  const colors = content.match(colorRegex) || [];
  colors.forEach(c => report.issues.colorInconsistency.add(c));
  
  // Extract spacing values
  const spacingRegex = /(?:margin|padding):\s*(\d+px|\d+rem)/g;
  let match;
  while ((match = spacingRegex.exec(content)) !== null) {
    report.issues.spacingInconsistency.add(match[1]);
  }
  
  // Check nesting depth (SCSS)
  if (file.endsWith('.scss')) {
    let maxDepth = 0;
    let currentDepth = 0;
    lines.forEach(line => {
      if (line.includes('{')) currentDepth++;
      if (line.includes('}')) currentDepth--;
      maxDepth = Math.max(maxDepth, currentDepth);
    });
    if (maxDepth > 4) {
      report.issues.deepNesting.push({ file, depth: maxDepth });
    }
  }
});

// Print report
console.log('='.repeat(80));
console.log(`${colors.bold}📊 CSS ANALYSIS REPORT${colors.reset}`);
console.log('='.repeat(80));
console.log('');

console.log(`${colors.cyan}📈 Statistics${colors.reset}`);
console.log(`  Total Files: ${report.totalFiles}`);
console.log(`  Total Rules: ${report.totalRules}`);
console.log(`  Unique Colors: ${colors.yellow}${report.issues.colorInconsistency.size}${colors.reset}`);
console.log(`  Unique Spacing Values: ${colors.yellow}${report.issues.spacingInconsistency.size}${colors.reset}`);
console.log('');

if (report.issues.importantOveruse.length > 0) {
  console.log(`${colors.yellow}⚠️  !important Overuse${colors.reset}`);
  report.issues.importantOveruse.forEach(issue => {
    console.log(`  ${issue.file}: ${colors.red}${issue.count} occurrences${colors.reset}`);
  });
  console.log('');
}

if (report.issues.deepNesting.length > 0) {
  console.log(`${colors.yellow}⚠️  Deep Nesting (SCSS)${colors.reset}`);
  report.issues.deepNesting.forEach(issue => {
    console.log(`  ${issue.file}: ${colors.red}${issue.depth} levels${colors.reset}`);
  });
  console.log('');
}

console.log(`${colors.cyan}💡 Recommendations${colors.reset}`);
if (report.issues.colorInconsistency.size > 10) {
  console.log(`  • Consider using CSS variables for colors (found ${report.issues.colorInconsistency.size} unique colors)`);
}
if (report.issues.spacingInconsistency.size > 8) {
  console.log(`  • Implement a consistent spacing scale (found ${report.issues.spacingInconsistency.size} unique values)`);
}
if (report.issues.importantOveruse.length > 0) {
  console.log(`  • Reduce !important usage, refactor specificity instead`);
}
if (report.issues.deepNesting.length > 0) {
  console.log(`  • Flatten SCSS nesting to max 3-4 levels using BEM`);
}
console.log('');

fs.writeFileSync('reports/css-analysis-report.json', JSON.stringify(report, null, 2));
console.log(`${colors.green}📄 Report saved to: css-analysis-report.json${colors.reset}\n`);

process.exit(0);

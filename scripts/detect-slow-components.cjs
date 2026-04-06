#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('⚡ Analyzing Component Performance...\n');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

function getAllFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        results = results.concat(getAllFiles(filePath));
      } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        results.push(filePath);
      }
    } catch (e) {}
  });
  return results;
}

const files = getAllFiles('./src');
console.log(`📁 Analyzing ${files.length} component files\n`);

const issues = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const fileIssues = [];
  
  // Check 1: Missing React.memo
  const isFunctional = /(?:function|const)\s+\w+\s*=?\s*(?:\([^)]*\))?\s*(?:=>)?\s*{[\s\S]*return\s+</m.test(content);
  const hasMemo = content.includes('React.memo') || content.includes('memo(');
  
  if (isFunctional && !hasMemo && content.includes('export')) {
    fileIssues.push({
      type: 'missing-memo',
      severity: 'medium',
      message: 'Component not wrapped in React.memo',
      fix: 'export default React.memo(ComponentName);'
    });
  }
  
  // Check 2: Inline function definitions in render
  const inlineFunctions = (content.match(/(?:onClick|onChange|onSubmit)=\{(?:\(\)|[^}]*)\s*=>/g) || []).length;
  if (inlineFunctions > 2) {
    fileIssues.push({
      type: 'inline-functions',
      severity: 'high',
      count: inlineFunctions,
      message: `${inlineFunctions} inline event handlers (creates new functions on each render)`,
      fix: 'Use useCallback to memoize handlers'
    });
  }
  
  // Check 3: Missing keys in lists
  const hasMaps = content.includes('.map(');
  const hasKeys = content.match(/key=\{/g);
  if (hasMaps && (!hasKeys || hasKeys.length < (content.match(/\.map\(/g) || []).length)) {
    fileIssues.push({
      type: 'missing-keys',
      severity: 'critical',
      message: 'List items missing key prop',
      fix: 'Add unique key prop: <div key={item.id}>'
    });
  }
  
  // Check 4: Large inline objects/arrays
  const inlineObjects = (content.match(/=\s*\{[^}]{50,}\}/g) || []).length;
  if (inlineObjects > 0) {
    fileIssues.push({
      type: 'inline-objects',
      severity: 'medium',
      count: inlineObjects,
      message: `${inlineObjects} large inline objects (recreated on each render)`,
      fix: 'Move outside component or use useMemo'
    });
  }
  
  // Check 5: useEffect without dependencies
  const effectsWithoutDeps = (content.match(/useEffect\([^)]+\)\s*$/gm) || []).length;
  if (effectsWithoutDeps > 0) {
    fileIssues.push({
      type: 'effect-no-deps',
      severity: 'high',
      message: 'useEffect without dependency array',
      fix: 'Add dependency array: useEffect(() => {...}, [deps])'
    });
  }
  
  if (fileIssues.length > 0) {
    issues.push({
      file: file.replace(process.cwd(), '.'),
      issues: fileIssues
    });
  }
});

// Print report
console.log('='.repeat(80));
console.log(`${colors.bold}⚡ PERFORMANCE ANALYSIS${colors.reset}`);
console.log('='.repeat(80));
console.log('');

console.log(`${colors.cyan}📊 Summary${colors.reset}`);
console.log(`  Components Analyzed: ${files.length}`);
console.log(`  Components with Issues: ${colors.yellow}${issues.length}${colors.reset}`);
console.log(`  Total Issues: ${colors.red}${issues.reduce((sum, i) => sum + i.issues.length, 0)}${colors.reset}`);
console.log('');

if (issues.length === 0) {
  console.log(`${colors.green}✅ No performance issues found!${colors.reset}\n`);
  process.exit(0);
}

console.log(`${colors.cyan}🔍 Issues Found${colors.reset}`);
console.log('');

issues.forEach(item => {
  console.log(`${colors.cyan}📄 ${item.file}${colors.reset}`);
  item.issues.forEach(issue => {
    const severityColor = issue.severity === 'critical' ? 'red' : 
                         issue.severity === 'high' ? 'red' : 'yellow';
    console.log(`  [${colors[severityColor]}${issue.severity.toUpperCase()}${colors.reset}] ${issue.message}`);
    console.log(`  ${colors.green}Fix: ${issue.fix}${colors.reset}`);
  });
  console.log('');
});

console.log(`${colors.cyan}💡 Performance Tips${colors.reset}`);
console.log('  1. Wrap components in React.memo to prevent unnecessary re-renders');
console.log('  2. Use useCallback for event handlers');
console.log('  3. Use useMemo for expensive calculations');
console.log('  4. Always add keys to list items');
console.log('  5. Move static data outside components');
console.log('');

fs.writeFileSync('reports/performance-report.json', JSON.stringify(issues, null, 2));
console.log(`${colors.green}📄 Report saved to: performance-report.json${colors.reset}\n`);

process.exit(issues.length > 0 ? 1 : 0);

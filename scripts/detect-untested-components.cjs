#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🧪 Detecting Components Without TestCafe E2E Tests...\n');

function getAllComponents(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        results = results.concat(getAllComponents(filePath));
      } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        // Skip test files themselves
        if (!file.includes('.test.') && !file.includes('.spec.')) {
          results.push(filePath);
        }
      }
    } catch (e) {}
  });
  return results;
}

function getTestCafeTests(dirs) {
  let results = [];
  
  // Check multiple possible TestCafe locations
  const testDirs = [
    './tests',
    './testcafe',
    './e2e',
    './test',
    ...dirs
  ];
  
  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { recursive: true }).filter(f => {
      // Look for TestCafe specific patterns
      return f.endsWith('.testcafe.js') || 
             f.endsWith('.e2e.js') || 
             (dir.includes('testcafe') && f.endsWith('.js')) ||
             (dir.includes('e2e') && f.endsWith('.js'));
    });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.existsSync(fullPath)) {
        results.push(fullPath);
      }
    });
  });
  
  return results;
}

const components = getAllComponents('./src');
const testCafeFiles = getTestCafeTests(['./tests', './testcafe', './e2e']);

console.log(`📁 Found ${components.length} components`);
console.log(`🧪 Found ${testCafeFiles.length} TestCafe E2E test files\n`);

// Extract component names from TestCafe files
const testedComponents = new Set();
testCafeFiles.forEach(testFile => {
  const content = fs.readFileSync(testFile, 'utf8');
  
  // Look for TestCafe fixture names
  const fixtureMatches = content.match(/fixture\s*\(\s*['"`]([^'"`]+)['"`]/g);
  if (fixtureMatches) {
    fixtureMatches.forEach(match => {
      const name = match.match(/['"`]([^'"`]+)['"`]/)[1];
      testedComponents.add(name);
    });
  }
  
  // Also check for component imports
  const importMatches = content.match(/import\s+.*?from\s+['"`].*?([^/]+)\.jsx?['"`]/g);
  if (importMatches) {
    importMatches.forEach(match => {
      const compName = match.match(/([^/]+)\.jsx?['"`]/)[1];
      if (compName) {
        testedComponents.add(compName);
      }
    });
  }
});

const untested = components.filter(comp => {
  const baseName = path.basename(comp, path.extname(comp));
  const fileName = path.basename(comp);
  
  // Check if component name appears in tested components
  return !testedComponents.has(baseName) && 
         !testedComponents.has(fileName) &&
         // Skip main.jsx and index files
         baseName !== 'main' && 
         baseName !== 'index';
});

if (untested.length > 0) {
  console.log('⚠️  Components without TestCafe E2E tests:\n');
  untested.forEach(comp => console.log(`  ${comp.replace(process.cwd(), '.')}`));
} else {
  console.log('✅ All components have TestCafe E2E tests!');
}

const coverage = components.length > 0 
  ? (((components.length - untested.length) / components.length) * 100).toFixed(1)
  : 0;

console.log(`\n📊 E2E Test Coverage: ${coverage}%`);

if (testCafeFiles.length === 0) {
  console.log('\n💡 Tip: Create TestCafe tests in ./tests/ or ./testcafe/ folder');
  console.log('   Example: tests/app.testcafe.js or testcafe/login.e2e.js\n');
} else {
  console.log('\n📝 TestCafe test files found:');
  testCafeFiles.forEach(f => console.log(`   ${f.replace(process.cwd(), '.')}`));
  console.log('');
}

process.exit(0);

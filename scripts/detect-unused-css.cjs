#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🎨 Detecting Unused CSS...\n');

const colors = {
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

function getAllFiles(dir, ext) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        results = results.concat(getAllFiles(filePath, ext));
      } else if (ext.some(e => file.endsWith(e))) {
        results.push(filePath);
      }
    } catch (e) {}
  });
  return results;
}

// Find all CSS files
const cssFiles = getAllFiles('./src', ['.css', '.scss']);
const jsFiles = getAllFiles('./src', ['.js', '.jsx', '.ts', '.tsx']);

console.log(`📁 Found ${cssFiles.length} CSS files and ${jsFiles.length} JS files\n`);

let totalUnused = 0;
const unusedClasses = [];

cssFiles.forEach(cssFile => {
  const cssContent = fs.readFileSync(cssFile, 'utf8');
  const classRegex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  const classes = new Set();
  
  let match;
  while ((match = classRegex.exec(cssContent)) !== null) {
    classes.add(match[1]);
  }
  
  // Check if classes are used in JS files
  const unused = [];
  classes.forEach(cls => {
    let found = false;
    for (const jsFile of jsFiles) {
      const jsContent = fs.readFileSync(jsFile, 'utf8');
      if (jsContent.includes(cls)) {
        found = true;
        break;
      }
    }
    if (!found) {
      unused.push(cls);
    }
  });
  
  if (unused.length > 0) {
    totalUnused += unused.length;
    console.log(`${colors.cyan}📄 ${cssFile.replace(process.cwd(), '.')}${colors.reset}`);
    unused.slice(0, 10).forEach(cls => {
      console.log(`   ${colors.yellow}⚠️  .${cls}${colors.reset}`);
    });
    if (unused.length > 10) {
      console.log(`   ... and ${unused.length - 10} more`);
    }
    console.log('');
    unusedClasses.push({ file: cssFile, classes: unused });
  }
});

console.log(`\n${colors.green}📊 Summary: Found ${totalUnused} unused CSS classes${colors.reset}\n`);

// Save report
fs.writeFileSync('reports/unused-css-report.json', JSON.stringify(unusedClasses, null, 2));
console.log(`${colors.green}📄 Report saved to: unused-css-report.json${colors.reset}\n`);

process.exit(0);

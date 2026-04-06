#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🔍 Detecting Unused Imports...\n');

function getAllFiles(dir, ext = ['.js', '.jsx', '.ts', '.tsx']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('dist')) {
      results = results.concat(getAllFiles(filePath, ext));
    } else if (ext.some(e => file.endsWith(e))) {
      results.push(filePath);
    }
  });
  return results;
}

const files = getAllFiles('./src');
let totalUnused = 0;

console.log(`📁 Scanning ${files.length} files...\n`);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  const unused = [];
  
  while ((match = importRegex.exec(content)) !== null) {
    const imports = match[1] ? match[1].split(',').map(i => i.trim()) : [match[2]];
    
    imports.forEach(imp => {
      const name = imp.replace(/\s+as\s+\w+/, '').trim();
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      const matches = content.match(regex) || [];
      
      if (matches.length === 1) {
        unused.push(name);
      }
    });
  }
  
  if (unused.length > 0) {
    totalUnused += unused.length;
    console.log(`📄 ${file.replace(process.cwd(), '.')}`);
    unused.forEach(u => console.log(`   ⚠️  Unused: ${u}`));
    console.log('');
  }
});

console.log(`\n📊 Summary: Found ${totalUnused} unused imports\n`);
process.exit(totalUnused > 0 ? 1 : 0);

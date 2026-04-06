#!/usr/bin/env node
console.log('🎨 Auto-fixing CSS Issues...\n');

const fs = require('fs');
const path = require('path');

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
      } else if (file.endsWith('.css')) {
        results.push(filePath);
      }
    } catch (e) {}
  });
  return results;
}

const files = getAllCSSFiles('./src');
let fixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Fix: Remove duplicate properties
  content = content.replace(/([a-z-]+):\s*([^;]+);\s*\1:\s*[^;]+;/g, '$1: $2;');
  
  // Fix: Normalize spacing
  content = content.replace(/{\s+/g, ' { ');
  content = content.replace(/\s+}/g, ' }');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    fixed++;
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log(`\n📊 Fixed ${fixed} files\n`);

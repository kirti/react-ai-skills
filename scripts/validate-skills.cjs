#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('✅ Validating Skills...\n');

const skillsDir = './skills';
if (!fs.existsSync(skillsDir)) {
  console.log('⚠️  No skills directory found\n');
  process.exit(0);
}

const skills = fs.readdirSync(skillsDir).filter(f => {
  const fullPath = path.join(skillsDir, f);
  // Skip hidden directories (starting with .) and files
  if (f.startsWith('.') || !fs.statSync(fullPath).isDirectory()) {
    return false;
  }
  return true;
});

console.log(`📁 Found ${skills.length} skills\n`);

let hasErrors = false;

skills.forEach(skill => {
  const skillPath = path.join(skillsDir, skill, 'SKILL.md');
  if (fs.existsSync(skillPath)) {
    console.log(`✅ ${skill}`);
  } else {
    console.log(`❌ ${skill} - missing SKILL.md`);
    hasErrors = true;
  }
});

console.log('\n✅ Validation complete\n');

if (hasErrors) {
  process.exit(1);
}

#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

console.log('📊 Generating Detailed Duplication Report...\n');

try {
  execSync('node scripts/detect-duplicates.js --save', { stdio: 'inherit' });
  
  if (fs.existsSync('duplication-report.json')) {
    const report = JSON.parse(fs.readFileSync('duplication-report.json', 'utf8'));
    
    // Generate markdown
    let md = `# Code Duplication Report\n\n`;
    md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    md += `## Summary\n\n`;
    md += `- **Total Duplicates:** ${report.totalDuplicates}\n`;
    md += `- **Files Affected:** ${report.summary.filesAffected.length}\n`;
    md += `- **Lines of Duplication:** ${report.summary.linesOfDuplication}\n\n`;
    
    md += `## Duplicate Blocks\n\n`;
    report.duplicateBlocks.slice(0, 20).forEach((block, i) => {
      md += `### ${i + 1}. Duplicate (${block.occurrences} occurrences)\n\n`;
      md += `**Locations:**\n`;
      block.locations.forEach(loc => {
        md += `- \`${loc.file}:${loc.lines}\`\n`;
      });
      md += `\n`;
    });
    
    fs.writeFileSync('duplication-report.md', md);
    console.log('\n✅ Markdown report: duplication-report.md');
  }
} catch (e) {
  console.error('Error:', e.message);
}

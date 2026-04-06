#!/usr/bin/env node
const fs = require('fs');

const dryRun = process.argv.includes('--dry-run');

console.log(`🔧 Auto Refactoring ${dryRun ? '(DRY RUN)' : ''}...\n`);

if (fs.existsSync('duplication-report.json')) {
  const report = JSON.parse(fs.readFileSync('duplication-report.json', 'utf8'));
  
  console.log(`Found ${report.totalDuplicates} potential refactorings\n`);
  
  report.duplicateBlocks.slice(0, 5).forEach((block, i) => {
    console.log(`${i + 1}. Extract function for ${block.occurrences} duplicates`);
    console.log(`   Suggested name: refactored_${i + 1}`);
    console.log(`   Lines: ${block.linesCount}`);
    console.log('');
  });
  
  if (dryRun) {
    console.log('✅ Dry run complete. Use without --dry-run to apply changes.\n');
  } else {
    console.log('⚠️  Manual refactoring recommended for safety.\n');
  }
} else {
  console.log('⚠️  Run detect:duplicates first\n');
}

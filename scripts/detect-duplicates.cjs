#!/usr/bin/env node

/**
 * Duplicate Code Detection
 * Finds and reports duplicate code blocks in JavaScript/TypeScript files
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DuplicateDetector {
  constructor(options = {}) {
    this.minLines = options.minLines || 5;
    this.minTokens = options.minTokens || 50;
    this.ignorePatterns = options.ignore || ['node_modules', 'dist', 'build', 'coverage', '.git'];
    this.duplicates = new Map();
    
    // Color codes
    this.colors = {
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      green: '\x1b[32m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m'
    };
  }

  colorize(text, color) {
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }

  async scan(directory) {
    console.log(this.colorize('🔍 Scanning for duplicate code...', 'cyan'));
    console.log('');

    const files = this.getAllFiles(directory);
    console.log(`📁 Found ${files.length} files to analyze`);
    console.log('');

    const codeBlocks = new Map();

    // Extract code blocks from each file
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

  getAllFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) {
      return fileList;
    }

    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          if (!this.shouldIgnore(filePath)) {
            this.getAllFiles(filePath, fileList);
          }
        } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
          fileList.push(filePath);
        }
      } catch (err) {
        // Skip files we can't read
      }
    });

    return fileList;
  }

  shouldIgnore(filePath) {
    return this.ignorePatterns.some(pattern => 
      filePath.includes(pattern)
    );
  }

  extractCodeBlocks(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const blocks = [];

      for (let i = 0; i <= lines.length - this.minLines; i++) {
        const block = lines.slice(i, i + this.minLines).join('\n');
        
        if (this.isValidBlock(block)) {
          blocks.push({
            lines: `${i + 1}-${i + this.minLines}`,
            code: block
          });
        }
      }

      return blocks;
    } catch (err) {
      return [];
    }
  }

  isValidBlock(code) {
    const trimmed = code.trim();
    
    // Skip empty blocks
    if (trimmed.length < 20) return false;
    
    // Skip comment-only blocks
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return false;
    
    // Skip import-only blocks
    if (/^import\s/.test(trimmed) && !trimmed.includes('{')) return false;
    
    // Count meaningful tokens
    const tokens = trimmed.match(/\w+/g) || [];
    if (tokens.length < this.minTokens / 10) return false;
    
    return true;
  }

  hashCode(str) {
    // Normalize code before hashing
    const normalized = str
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/['"]/g, '')           // Remove quotes
      .replace(/\/\/.*$/gm, '')       // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .trim();
    
    return crypto
      .createHash('md5')
      .update(normalized)
      .digest('hex');
  }

  generateReport() {
    const report = {
      totalDuplicates: this.duplicates.size,
      duplicateBlocks: [],
      summary: {
        filesAffected: new Set(),
        linesOfDuplication: 0,
        estimatedSavings: 0
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
        code: occurrences[0].code,
        linesCount: occurrences[0].code.split('\n').length
      };

      report.duplicateBlocks.push(block);
      
      occurrences.forEach(o => {
        report.summary.filesAffected.add(o.file);
      });
      
      // Count duplicated lines (excluding first occurrence)
      const duplicatedLines = block.linesCount * (occurrences.length - 1);
      report.summary.linesOfDuplication += duplicatedLines;
      report.summary.estimatedSavings += duplicatedLines;
    });

    report.summary.filesAffected = Array.from(report.summary.filesAffected);

    return report;
  }

  printReport(report) {
    console.log('');
    console.log('='.repeat(80));
    console.log(this.colorize('📊 DUPLICATE CODE REPORT', 'bold'));
    console.log('='.repeat(80));
    console.log('');

    // Summary
    console.log(this.colorize('📈 Summary', 'cyan'));
    console.log('-'.repeat(80));
    console.log(`  Total Duplicate Blocks: ${this.colorize(report.totalDuplicates, 'yellow')}`);
    console.log(`  Files Affected: ${this.colorize(report.summary.filesAffected.length, 'yellow')}`);
    console.log(`  Lines of Duplication: ${this.colorize(report.summary.linesOfDuplication, 'red')}`);
    console.log(`  Potential Lines Saved: ${this.colorize(report.summary.estimatedSavings, 'green')}`);
    console.log('');

    if (report.totalDuplicates === 0) {
      console.log(this.colorize('✅ No significant code duplication found!', 'green'));
      console.log('');
      return;
    }

    // Show top duplicates
    console.log(this.colorize('🔍 Duplicate Blocks Found', 'cyan'));
    console.log('-'.repeat(80));
    console.log('');

    // Sort by number of occurrences
    const sorted = report.duplicateBlocks.sort((a, b) => b.occurrences - a.occurrences);
    
    sorted.slice(0, 10).forEach((block, index) => {
      console.log(this.colorize(`${index + 1}. Duplicate Block`, 'bold') + 
                  ` (${this.colorize(block.occurrences + ' occurrences', 'yellow')}, ` +
                  `${this.colorize(block.linesCount + ' lines', 'gray')})`);
      console.log('');
      
      block.locations.forEach(loc => {
        const relativePath = loc.file.replace(process.cwd(), '.');
        console.log(`   ${this.colorize('📄', 'cyan')} ${relativePath}:${this.colorize(loc.lines, 'gray')}`);
      });
      
      console.log('');
      console.log(this.colorize('   Code Preview:', 'gray'));
      const preview = block.code.split('\n').slice(0, 3).join('\n');
      preview.split('\n').forEach(line => {
        console.log(this.colorize(`   ${line}`, 'gray'));
      });
      console.log(this.colorize('   ...', 'gray'));
      console.log('');
    });

    if (sorted.length > 10) {
      console.log(this.colorize(`... and ${sorted.length - 10} more duplicate blocks`, 'gray'));
      console.log('');
    }

    // Recommendations
    console.log(this.colorize('💡 Recommendations', 'cyan'));
    console.log('-'.repeat(80));
    console.log('  1. Extract common code into reusable functions');
    console.log('  2. Create utility modules for repeated patterns');
    console.log('  3. Use DRY (Don\'t Repeat Yourself) principle');
    console.log('  4. Consider using higher-order functions');
    console.log('');

    console.log('='.repeat(80));
    console.log('');
  }

  saveReport(report) {
    const reportPath = path.join(process.cwd(), 'reports', 'duplication-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(this.colorize(`📄 Full report saved to: ${reportPath}`, 'green'));
    console.log('');
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Duplicate Code Detector

Usage: node detect-duplicates.js [options] [directory]

Options:
  --min-lines <n>     Minimum lines for duplication (default: 5)
  --min-tokens <n>    Minimum tokens for duplication (default: 50)
  --save              Save detailed report to JSON file
  --help              Show this help

Examples:
  node detect-duplicates.js
  node detect-duplicates.js src/
  node detect-duplicates.js --min-lines 10 --save
    `);
    process.exit(0);
  }

  const options = {
    minLines: parseInt(args.find(a => a.match(/^\d+$/))) || 5,
    save: args.includes('--save')
  };

  const directory = args.find(a => !a.startsWith('--') && !a.match(/^\d+$/)) || './src';

  const detector = new DuplicateDetector(options);
  const report = await detector.scan(directory);
  
  detector.printReport(report);
  
  if (options.save || report.totalDuplicates > 0) {
    detector.saveReport(report);
  }

  // Exit with error code if duplicates found
  if (report.totalDuplicates > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = DuplicateDetector;

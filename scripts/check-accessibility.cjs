#!/usr/bin/env node

/**
 * Accessibility Checker
 * Checks React components for accessibility issues (ARIA, alt text, labels, etc.)
 */

const fs = require('fs');
const path = require('path');

class AccessibilityChecker {
  constructor(options = {}) {
    this.autoFix = options.autoFix || false;
    this.ignorePatterns = options.ignore || ['node_modules', 'dist', 'build', 'coverage'];
    this.issues = [];
    this.fixes = 0;
    
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
    console.log(this.colorize('♿ Scanning for accessibility issues...', 'cyan'));
    console.log('');

    const files = this.getAllFiles(directory);
    console.log(`📁 Found ${files.length} component files`);
    console.log('');

    files.forEach(file => {
      this.checkFile(file);
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
        } else if (/\.(jsx|tsx)$/.test(file)) {
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

  checkFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      let modified = false;

      // Check 1: Images without alt text
      const imgRegex = /<img\s+(?![^>]*\balt\s*=)([^>]*)>/gi;
      let match;
      
      while ((match = imgRegex.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const imgTag = match[0];
        
        this.issues.push({
          file: filePath,
          line: lineNumber,
          severity: 'high',
          type: 'missing-alt-text',
          element: imgTag,
          message: 'Image missing alt attribute',
          fix: imgTag.replace('<img', '<img alt="Description"')
        });

        if (this.autoFix) {
          const fixed = imgTag.replace('<img', '<img alt="FIXME: Add description"');
          content = content.replace(imgTag, fixed);
          modified = true;
          this.fixes++;
        }
      }

      // Check 2: Buttons without accessible text
      const buttonRegex = /<button\s+(?![^>]*\baria-label\s*=)([^>]*)>\s*<[^>]+\/>\s*<\/button>/gi;
      
      while ((match = buttonRegex.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const buttonTag = match[0];
        
        // Only flag if it contains only icons (self-closing tags like <Icon />)
        if (/<[A-Z][^>]*\/>/.test(buttonTag)) {
          this.issues.push({
            file: filePath,
            line: lineNumber,
            severity: 'critical',
            type: 'button-no-label',
            element: buttonTag.substring(0, 100),
            message: 'Button with icon only, missing aria-label',
            fix: buttonTag.replace('<button', '<button aria-label="FIXME: Describe action"')
          });

          if (this.autoFix) {
            const fixed = buttonTag.replace('<button', '<button aria-label="FIXME: Describe action"');
            content = content.replace(buttonTag, fixed);
            modified = true;
            this.fixes++;
          }
        }
      }

      // Check 3: Form inputs without labels
      const inputRegex = /<input\s+(?![^>]*\baria-label\s*=)([^>]*)(?:\s+id\s*=\s*["']([^"']+)["'])?([^>]*)>/gi;
      
      while ((match = inputRegex.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const inputTag = match[0];
        const inputId = match[2];
        
        // Check if there's a label for this input
        const hasLabel = inputId && content.includes(`htmlFor="${inputId}"`);
        const hasAriaLabel = /aria-label\s*=/.test(inputTag);
        
        if (!hasLabel && !hasAriaLabel) {
          this.issues.push({
            file: filePath,
            line: lineNumber,
            severity: 'high',
            type: 'input-no-label',
            element: inputTag,
            message: 'Form input missing label or aria-label',
            fix: inputId ? `Add: <label htmlFor="${inputId}">Label Text</label>` : 'Add aria-label attribute'
          });
        }
      }

      // Check 4: Interactive divs without role
      const divClickRegex = /<div\s+(?![^>]*\brole\s*=)([^>]*)\s+onClick\s*=/gi;
      
      while ((match = divClickRegex.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const divTag = match[0];
        
        this.issues.push({
          file: filePath,
          line: lineNumber,
          severity: 'medium',
          type: 'interactive-no-role',
          element: divTag.substring(0, 100),
          message: 'Interactive div missing role attribute',
          fix: divTag.replace('<div', '<div role="button" tabIndex="0"')
        });

        if (this.autoFix) {
          const fixed = divTag.replace('<div', '<div role="button" tabIndex="0"');
          content = content.replace(divTag, fixed);
          modified = true;
          this.fixes++;
        }
      }

      // Check 5: Links without accessible text
      const linkRegex = /<a\s+(?![^>]*\baria-label\s*=)([^>]*)>\s*<[^>]+\/>\s*<\/a>/gi;
      
      while ((match = linkRegex.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const linkTag = match[0];
        
        if (/<[A-Z][^>]*\/>/.test(linkTag)) {
          this.issues.push({
            file: filePath,
            line: lineNumber,
            severity: 'high',
            type: 'link-no-text',
            element: linkTag.substring(0, 100),
            message: 'Link with icon only, missing aria-label',
            fix: linkTag.replace('<a', '<a aria-label="FIXME: Describe link"')
          });

          if (this.autoFix) {
            const fixed = linkTag.replace('<a', '<a aria-label="FIXME: Describe link"');
            content = content.replace(linkTag, fixed);
            modified = true;
            this.fixes++;
          }
        }
      }

      // Save changes if auto-fix is enabled
      if (modified && this.autoFix) {
        fs.writeFileSync(filePath, content);
      }

    } catch (err) {
      console.error(`Error reading ${filePath}:`, err.message);
    }
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  generateReport() {
    const report = {
      totalIssues: this.issues.length,
      fixes: this.fixes,
      summary: {
        critical: this.issues.filter(i => i.severity === 'critical').length,
        high: this.issues.filter(i => i.severity === 'high').length,
        medium: this.issues.filter(i => i.severity === 'medium').length,
        low: this.issues.filter(i => i.severity === 'low').length
      },
      issues: this.issues,
      autoFixable: this.issues.filter(i => i.fix && typeof i.fix === 'string').length
    };

    return report;
  }

  printReport(report) {
    console.log('');
    console.log('='.repeat(80));
    console.log(this.colorize('♿ ACCESSIBILITY REPORT', 'bold'));
    console.log('='.repeat(80));
    console.log('');

    // Summary
    console.log(this.colorize('📊 Summary', 'cyan'));
    console.log('-'.repeat(80));
    console.log(`  Total Issues: ${this.colorize(report.totalIssues, report.totalIssues > 0 ? 'red' : 'green')}`);
    
    if (report.summary.critical > 0) {
      console.log(`  ${this.colorize('Critical:', 'red')} ${report.summary.critical}`);
    }
    if (report.summary.high > 0) {
      console.log(`  ${this.colorize('High:', 'red')} ${report.summary.high}`);
    }
    if (report.summary.medium > 0) {
      console.log(`  ${this.colorize('Medium:', 'yellow')} ${report.summary.medium}`);
    }
    if (report.summary.low > 0) {
      console.log(`  ${this.colorize('Low:', 'gray')} ${report.summary.low}`);
    }
    
    console.log(`  Auto-fixable: ${this.colorize(report.autoFixable, 'green')}`);
    
    if (this.autoFix && this.fixes > 0) {
      console.log(`  ${this.colorize('✅ Fixed:', 'green')} ${this.fixes} issues`);
    }
    
    console.log('');

    if (report.totalIssues === 0) {
      console.log(this.colorize('✅ No accessibility issues found!', 'green'));
      console.log('');
      return;
    }

    // Show issues by type
    const issuesByType = {};
    report.issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });

    console.log(this.colorize('🔍 Issues Found', 'cyan'));
    console.log('-'.repeat(80));
    console.log('');

    Object.entries(issuesByType).forEach(([type, issues]) => {
      const severityColor = issues[0].severity === 'critical' ? 'red' : 
                           issues[0].severity === 'high' ? 'red' :
                           issues[0].severity === 'medium' ? 'yellow' : 'gray';
      
      console.log(this.colorize(`${type.toUpperCase().replace(/-/g, ' ')}`, 'bold') + 
                  ` (${this.colorize(issues.length + ' occurrences', severityColor)})`);
      console.log('');
      
      issues.slice(0, 5).forEach(issue => {
        const relativePath = issue.file.replace(process.cwd(), '.');
        console.log(`  ${this.colorize('[' + issue.severity.toUpperCase() + ']', severityColor)} ${relativePath}:${issue.line}`);
        console.log(`    ${issue.message}`);
        if (issue.fix) {
          console.log(this.colorize(`    Fix: ${issue.fix}`, 'green'));
        }
        console.log('');
      });

      if (issues.length > 5) {
        console.log(this.colorize(`  ... and ${issues.length - 5} more`, 'gray'));
        console.log('');
      }
    });

    // Recommendations
    console.log(this.colorize('💡 Recommendations', 'cyan'));
    console.log('-'.repeat(80));
    console.log('  1. Add alt text to all images (describe the image content)');
    console.log('  2. Add aria-label to icon-only buttons and links');
    console.log('  3. Associate labels with form inputs using htmlFor');
    console.log('  4. Add role="button" to clickable divs (or use <button>)');
    console.log('  5. Ensure keyboard navigation works (test with Tab key)');
    console.log('');

    if (!this.autoFix && report.autoFixable > 0) {
      console.log(this.colorize(`💡 Tip: Run with --auto-fix to automatically fix ${report.autoFixable} issues`, 'yellow'));
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('');
  }

  saveReport(report) {
    const reportPath = path.join(process.cwd(), 'reports', 'accessibility-report.json');
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
Accessibility Checker

Usage: node check-accessibility.js [options] [directory]

Options:
  --auto-fix          Automatically fix issues when possible
  --save              Save detailed report to JSON file
  --help              Show this help

Examples:
  node check-accessibility.js
  node check-accessibility.js src/
  node check-accessibility.js --auto-fix
  node check-accessibility.js --auto-fix --save
    `);
    process.exit(0);
  }

  const options = {
    autoFix: args.includes('--auto-fix'),
    save: args.includes('--save')
  };

  const directory = args.find(a => !a.startsWith('--')) || './src';

  const checker = new AccessibilityChecker(options);
  const report = await checker.scan(directory);
  
  checker.printReport(report);
  
  if (options.save || report.totalIssues > 0) {
    checker.saveReport(report);
  }

  // Exit with error code if issues found (but not if auto-fixed)
  if (report.totalIssues > 0 && !options.autoFix) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = AccessibilityChecker;

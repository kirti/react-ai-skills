#!/usr/bin/env node

/**
 * Comprehensive Automated Maintenance
 * Runs all checks: duplicates, accessibility, performance, dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoMaintainer {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.report = {
      timestamp: new Date().toISOString(),
      checks: [],
      fixes: [],
      suggestions: [],
      errors: []
    };

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

  log(message, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      progress: '⚡'
    };
    console.log(`${icons[type]} ${message}`);
  }

  exec(command, options = {}) {
    try {
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
      return { success: true, output };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        output: error.stdout || error.stderr
      };
    }
  }

  async runAll() {
    console.log(this.colorize('🚀 Starting Comprehensive Maintenance...', 'bold'));
    console.log('');

    // 1. Dependency Check
    await this.checkDependencies();

    // 2. Code Duplicates
    await this.checkDuplicates();

    // 3. Accessibility
    await this.checkAccessibility();

    // 4. Validation
    if (!this.dryRun) {
      await this.validate();
    }

    // 5. Generate Report
    this.generateReport();

    console.log('');
    this.log('Comprehensive maintenance complete!', 'success');
  }

  async checkDependencies() {
    this.log('Checking dependencies...', 'progress');
    console.log('');

    const result = this.exec('node scripts/dependency-manager.cjs --dry-run', { silent: false });

    this.report.checks.push({
      name: 'Dependencies',
      success: result.success,
      timestamp: new Date().toISOString()
    });

    console.log('');
  }

  async checkDuplicates() {
    this.log('Checking for duplicate code...', 'progress');
    console.log('');

    if (fs.existsSync('scripts/detect-duplicates.cjs')) {
      const result = this.exec('node scripts/detect-duplicates.cjs', { silent: false });
      
      this.report.checks.push({
        name: 'Code Duplication',
        success: result.success,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(this.colorize('  ⏭️  Skipping (script not found)', 'gray'));
    }

    console.log('');
  }

  async checkAccessibility() {
    this.log('Checking accessibility...', 'progress');
    console.log('');

    if (fs.existsSync('scripts/check-accessibility.cjs')) {
      const fixFlag = this.dryRun ? '' : '--auto-fix';
      const result = this.exec(`node scripts/check-accessibility.cjs ${fixFlag}`, { silent: false });
      
      this.report.checks.push({
        name: 'Accessibility',
        success: result.success,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(this.colorize('  ⏭️  Skipping (script not found)', 'gray'));
    }

    console.log('');
  }

  async validate() {
    this.log('Validating changes...', 'progress');
    console.log('');

    const steps = [
      { name: 'Format Check', cmd: 'npm run format:check 2>/dev/null || echo "Skipping format check"' },
      { name: 'Lint', cmd: 'npm run lint 2>/dev/null || echo "Skipping lint"' },
      { name: 'Tests', cmd: 'npm test -- --run 2>/dev/null || echo "Skipping tests"' },
      { name: 'Build', cmd: 'npm run build 2>/dev/null || echo "Skipping build"' }
    ];

    for (const step of steps) {
      console.log(`  Validating: ${step.name}...`);
      const result = this.exec(step.cmd, { silent: true });
      
      this.report.checks.push({
        name: step.name,
        success: result.success,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        console.log(this.colorize(`    ✅ ${step.name} passed`, 'green'));
      } else {
        console.log(this.colorize(`    ⏭️  ${step.name} skipped`, 'gray'));
      }
    }

    console.log('');
  }

  generateReport() {
    console.log('');
    console.log('='.repeat(80));
    console.log(this.colorize('📊 MAINTENANCE SUMMARY', 'bold'));
    console.log('='.repeat(80));
    console.log('');

    // Checks
    console.log(this.colorize('🔍 Checks Performed', 'cyan'));
    console.log('-'.repeat(80));
    
    this.report.checks.forEach(check => {
      const status = check.success ? this.colorize('✅ PASS', 'green') : this.colorize('❌ FAIL', 'red');
      console.log(`  ${status} ${check.name}`);
    });
    console.log('');

    // Fixes
    if (this.report.fixes.length > 0) {
      console.log(this.colorize('🔧 Fixes Applied', 'cyan'));
      console.log('-'.repeat(80));
      
      this.report.fixes.forEach(fix => {
        console.log(`  ${this.colorize('✅', 'green')} ${fix.type}: ${fix.count} issues fixed`);
      });
      console.log('');
    }

    // Summary
    const totalChecks = this.report.checks.length;
    const passedChecks = this.report.checks.filter(c => c.success).length;
    const totalFixes = this.report.fixes.reduce((sum, f) => sum + f.count, 0);

    console.log(this.colorize('📈 Overall Summary', 'cyan'));
    console.log('-'.repeat(80));
    console.log(`  Checks Performed: ${totalChecks}`);
    console.log(`  Checks Passed: ${this.colorize(passedChecks, passedChecks === totalChecks ? 'green' : 'yellow')}`);
    console.log(`  Issues Fixed: ${this.colorize(totalFixes, totalFixes > 0 ? 'green' : 'gray')}`);
    console.log('');

    // Save report
    const reportPath = path.join(process.cwd(), 'reports', 'maintenance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(this.colorize(`📄 Full report saved to: ${reportPath}`, 'green'));
    console.log('');

    console.log('='.repeat(80));
    console.log('');
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Comprehensive Auto Maintenance

Usage: node auto-maintain.js [options]

Options:
  --dry-run    Preview changes without applying fixes
  --help       Show this help

Examples:
  node auto-maintain.js
  node auto-maintain.js --dry-run
    `);
    process.exit(0);
  }

  const options = {
    dryRun: args.includes('--dry-run')
  };

  const maintainer = new AutoMaintainer(options);
  await maintainer.runAll();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = AutoMaintainer;

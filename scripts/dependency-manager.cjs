#!/usr/bin/env node

/**
 * Automated Dependency Manager - FIXED VERSION
 * Properly reads npm audit output (production vulnerabilities only)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DependencyManager {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      skipTests: options.skipTests || false,
      skipValidation: options.skipValidation || false,
      ...options
    };

    this.report = {
      date: new Date().toISOString(),
      vulnerabilities: [],
      autoUpdated: [],
      manualReview: [],
      validationResults: [],
      errors: [],
      summary: {}
    };

    // ANSI color codes (same as npm audit)
    this.colors = {
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      dim: '\x1b[2m',
      
      // Severity colors (matching npm audit)
      critical: '\x1b[41m\x1b[37m',  // Red background, white text
      high: '\x1b[31m',              // Red text
      moderate: '\x1b[33m',          // Yellow text
      low: '\x1b[37m',               // White/gray text
      info: '\x1b[36m',              // Cyan text
      
      // Status colors
      green: '\x1b[32m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m'
    };
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

  colorize(text, color) {
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }

  getSeverityColor(severity) {
    const severityLower = (severity || 'info').toLowerCase();
    return this.colors[severityLower] || this.colors.gray;
  }

  exec(command, options = {}) {
    try {
      this.log(`Running: ${command}`, 'progress');
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

  async scanVulnerabilities() {
    this.log('Scanning for vulnerabilities...', 'progress');
    
    // Run npm audit for ALL dependencies (production + dev)
    const result = this.exec('npm audit --json', { silent: true });
    
    if (result.output) {
      try {
        const auditData = JSON.parse(result.output);
        
        // Modern npm audit format (npm 7+)
        if (auditData.vulnerabilities) {
          // Parse vulnerabilities object
          const vulnEntries = Object.entries(auditData.vulnerabilities);
          
          vulnEntries.forEach(([pkgName, vulnData]) => {
            // Skip if not actually vulnerable
            if (!vulnData.via || vulnData.via.length === 0) {
              return;
            }

            // Extract actual vulnerability info
            const viaArray = Array.isArray(vulnData.via) ? vulnData.via : [vulnData.via];
            
            viaArray.forEach(via => {
              if (typeof via === 'object' && via.title) {
                this.report.vulnerabilities.push({
                  package: pkgName,
                  severity: via.severity || vulnData.severity || 'unknown',
                  title: via.title,
                  url: via.url,
                  range: vulnData.range,
                  fixAvailable: vulnData.fixAvailable ? true : false,
                  nodes: vulnData.nodes || []
                });
              }
            });
          });

          // Get metadata summary
          const metadata = auditData.metadata || {};
          this.report.summary.vulnerabilities = {
            total: metadata.vulnerabilities?.total || this.report.vulnerabilities.length,
            info: metadata.vulnerabilities?.info || 0,
            low: metadata.vulnerabilities?.low || 0,
            moderate: metadata.vulnerabilities?.moderate || 0,
            high: metadata.vulnerabilities?.high || 0,
            critical: metadata.vulnerabilities?.critical || 0
          };
        }
        // Legacy npm audit format (npm 6)
        else if (auditData.advisories) {
          Object.values(auditData.advisories).forEach(advisory => {
            this.report.vulnerabilities.push({
              package: advisory.module_name,
              severity: advisory.severity,
              title: advisory.title,
              url: advisory.url,
              range: advisory.vulnerable_versions,
              fixAvailable: advisory.patched_versions !== '<0.0.0',
              nodes: []
            });
          });

          const metadata = auditData.metadata || {};
          this.report.summary.vulnerabilities = {
            total: metadata.vulnerabilities || 0,
            info: metadata.vulnerabilities?.info || 0,
            low: metadata.vulnerabilities?.low || 0,
            moderate: metadata.vulnerabilities?.moderate || 0,
            high: metadata.vulnerabilities?.high || 0,
            critical: metadata.vulnerabilities?.critical || 0
          };
        }
        
        const total = this.report.summary.vulnerabilities?.total || 0;
        this.log(
          `Found ${total} vulnerabilities`, 
          total > 0 ? 'warning' : 'success'
        );

        // Show breakdown if vulnerabilities found
        if (total > 0) {
          const summary = this.report.summary.vulnerabilities;
          if (summary.critical > 0) {
            const msg = `  Critical: ${summary.critical}`;
            console.log(this.colorize(msg, 'critical'));
          }
          if (summary.high > 0) {
            const msg = `  High: ${summary.high}`;
            console.log(this.colorize(msg, 'high'));
          }
          if (summary.moderate > 0) {
            const msg = `  Moderate: ${summary.moderate}`;
            console.log(this.colorize(msg, 'moderate'));
          }
          if (summary.low > 0) {
            const msg = `  Low: ${summary.low}`;
            console.log(this.colorize(msg, 'low'));
          }
        }
        
      } catch (e) {
        this.log(`Error parsing audit: ${e.message}`, 'error');
        this.log('No vulnerabilities found or parse error', 'info');
      }
    }
  }

  async checkOutdated() {
    this.log('Checking for outdated packages...', 'progress');
    
    const result = this.exec('npm outdated --json', { silent: true });
    
    if (result.output) {
      try {
        const outdated = JSON.parse(result.output);
        
        Object.entries(outdated).forEach(([pkg, info]) => {
          const current = this.parseVersion(info.current);
          const wanted = this.parseVersion(info.wanted);
          const latest = this.parseVersion(info.latest);
          
          const updateInfo = {
            package: pkg,
            currentVersion: info.current,
            wantedVersion: info.wanted,
            latestVersion: info.latest,
            location: info.location
          };

          // Determine update type
          if (latest.major > current.major) {
            // Major update - requires manual review
            this.report.manualReview.push({
              ...updateInfo,
              type: 'MAJOR',
              breaking: true,
              reason: 'Breaking changes possible - requires manual review and testing'
            });
          } else if (latest.minor > current.minor) {
            // Minor update - safe to auto-update
            this.report.autoUpdated.push({
              ...updateInfo,
              type: 'MINOR',
              breaking: false
            });
          } else if (latest.patch > current.patch) {
            // Patch update - safe to auto-update
            this.report.autoUpdated.push({
              ...updateInfo,
              type: 'PATCH',
              breaking: false
            });
          }
        });
        
        this.report.summary.updates = {
          total: Object.keys(outdated).length,
          autoUpdate: this.report.autoUpdated.length,
          manualReview: this.report.manualReview.length
        };
        
        this.log(`Auto-update candidates: ${this.report.autoUpdated.length}`, 'info');
        this.log(`Manual review required: ${this.report.manualReview.length}`, 'warning');
        
      } catch (e) {
        this.log('All packages are up to date', 'success');
      }
    } else {
      this.log('All packages are up to date', 'success');
    }
  }

  parseVersion(version) {
    if (!version) return { major: 0, minor: 0, patch: 0 };
    const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)/);
    return match ? {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3])
    } : { major: 0, minor: 0, patch: 0 };
  }

  async autoUpdate() {
    if (this.report.autoUpdated.length === 0) {
      this.log('No safe updates available', 'success');
      return;
    }

    if (this.options.dryRun) {
      this.log('DRY RUN: Would auto-update packages', 'warning');
      this.report.autoUpdated.forEach(pkg => {
        this.log(`  Would update: ${pkg.package} ${pkg.currentVersion} → ${pkg.wantedVersion}`, 'info');
      });
      this.report.summary.updateSuccess = false;
      return;
    }

    this.log('Auto-updating safe packages (patch/minor)...', 'progress');
    
    // Backup package files
    const packageJson = path.join(process.cwd(), 'package.json');
    const packageLock = path.join(process.cwd(), 'package-lock.json');
    const backupDir = path.join(process.cwd(), '.dependency-backup');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    try {
      // Create backups
      fs.copyFileSync(packageJson, path.join(backupDir, 'package.json'));
      if (fs.existsSync(packageLock)) {
        fs.copyFileSync(packageLock, path.join(backupDir, 'package-lock.json'));
      }

      // Update packages
      const updateResult = this.exec('npm update');
      
      if (!updateResult.success) {
        throw new Error('npm update failed: ' + updateResult.error);
      }

      // Validate if not skipped
      let validationSuccess = true;
      if (!this.options.skipValidation) {
        validationSuccess = await this.validate();
      }
      
      if (!validationSuccess) {
        this.log('Validation failed, restoring backup...', 'error');
        this.restoreBackup(backupDir);
        throw new Error('Validation failed after update');
      }

      this.log('Auto-update completed successfully', 'success');
      this.report.summary.updateSuccess = true;

    } catch (error) {
      this.report.errors.push({
        stage: 'auto-update',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      this.log(`Auto-update failed: ${error.message}`, 'error');
      this.report.summary.updateSuccess = false;
    }
  }

  restoreBackup(backupDir) {
    const packageJson = path.join(process.cwd(), 'package.json');
    const packageLock = path.join(process.cwd(), 'package-lock.json');

    fs.copyFileSync(path.join(backupDir, 'package.json'), packageJson);
    if (fs.existsSync(path.join(backupDir, 'package-lock.json'))) {
      fs.copyFileSync(path.join(backupDir, 'package-lock.json'), packageLock);
    }

    this.exec('npm install');
    this.log('Backup restored successfully', 'success');
  }

  async validate() {
    this.log('Validating updates...', 'progress');

    const steps = [
      { name: 'Clean Install', cmd: 'npm ci', required: true },
      { name: 'Run Tests', cmd: 'npm test', required: !this.options.skipTests },
      { name: 'Build Project', cmd: 'npm run build', required: true }
    ];

    for (const step of steps) {
      if (!step.required) {
        this.log(`Skipping: ${step.name}`, 'info');
        continue;
      }

      this.log(`Validating: ${step.name}...`, 'progress');
      const result = this.exec(step.cmd);
      
      this.report.validationResults.push({
        step: step.name,
        command: step.cmd,
        success: result.success,
        error: result.error,
        timestamp: new Date().toISOString()
      });

      if (!result.success) {
        this.log(`${step.name} failed`, 'error');
        return false;
      }
      this.log(`${step.name} passed`, 'success');
    }

    return true;
  }

  async generateMigrationGuides() {
    if (this.report.manualReview.length === 0) {
      return;
    }

    this.log('Generating migration guides...', 'progress');

    for (const pkg of this.report.manualReview) {
      const guide = await this.createMigrationGuide(pkg);
      pkg.migrationGuide = guide;
    }
  }

  async createMigrationGuide(pkg) {
    const guide = {
      package: pkg.package,
      fromVersion: pkg.currentVersion,
      toVersion: pkg.latestVersion,
      updateType: 'MAJOR',
      steps: [],
      warnings: [],
      resources: []
    };

    // Fetch package information
    const infoResult = this.exec(
      `npm view ${pkg.package}@${pkg.latestVersion} --json`,
      { silent: true }
    );

    if (infoResult.success && infoResult.output) {
      try {
        const info = JSON.parse(infoResult.output);
        
        // Add repository/homepage link
        if (info.homepage || info.repository?.url) {
          guide.resources.push({
            type: 'documentation',
            url: info.homepage || info.repository.url.replace('git+', '').replace('.git', ''),
            description: 'Official documentation and changelog'
          });
        }

        // Migration steps
        guide.steps = [
          {
            order: 1,
            title: 'Review Breaking Changes',
            description: `Check the changelog for ${pkg.package} between v${pkg.currentVersion} and v${pkg.latestVersion}`,
            action: 'manual',
            resources: guide.resources
          },
          {
            order: 2,
            title: 'Create Feature Branch',
            description: 'Create a new git branch for this upgrade',
            action: 'command',
            command: `git checkout -b upgrade-${pkg.package}-${pkg.latestVersion}`
          },
          {
            order: 3,
            title: 'Update Package',
            description: `Update ${pkg.package} to version ${pkg.latestVersion}`,
            action: 'command',
            command: `npm install ${pkg.package}@${pkg.latestVersion}`
          },
          {
            order: 4,
            title: 'Update Code',
            description: 'Modify your code to accommodate breaking changes',
            action: 'manual',
            tips: [
              'Search for imports of this package',
              'Review deprecated API usage',
              'Check for type changes (if using TypeScript)',
              'Update configuration if needed'
            ]
          },
          {
            order: 5,
            title: 'Run Tests',
            description: 'Execute test suite to identify issues',
            action: 'command',
            command: 'npm test'
          },
          {
            order: 6,
            title: 'Build and Validate',
            description: 'Ensure application builds and runs correctly',
            action: 'commands',
            commands: [
              'npm run build',
              'npm run dev'
            ]
          }
        ];

        guide.warnings.push(
          `This is a MAJOR version update which may contain breaking changes`,
          `Thorough testing is required before deploying to production`
        );

      } catch (e) {
        guide.steps.push({
          order: 1,
          title: 'Manual Review Required',
          description: `Unable to fetch package details. Check ${pkg.package} documentation manually.`,
          action: 'manual'
        });
      }
    }

    return guide;
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 DEPENDENCY MANAGEMENT REPORT');
    console.log('='.repeat(80));
    console.log(`📅 Date: ${new Date(this.report.date).toLocaleString()}`);
    console.log('');

    // Vulnerabilities Section
    console.log('🔒 SECURITY VULNERABILITIES');
    console.log('-'.repeat(80));
    if (this.report.vulnerabilities.length === 0) {
      console.log('  ✅ No vulnerabilities found');
    } else {
      const summary = this.report.summary.vulnerabilities;
      console.log(`  Total: ${summary.total}`);
      if (summary.critical > 0) {
        console.log(this.colorize(`  Critical: ${summary.critical}`, 'critical'));
      }
      if (summary.high > 0) {
        console.log(this.colorize(`  High: ${summary.high}`, 'high'));
      }
      if (summary.moderate > 0) {
        console.log(this.colorize(`  Moderate: ${summary.moderate}`, 'moderate'));
      }
      if (summary.low > 0) {
        console.log(this.colorize(`  Low: ${summary.low}`, 'low'));
      }
      console.log('');
      
      this.report.vulnerabilities.slice(0, 10).forEach(vuln => {
        const severityColor = this.getSeverityColor(vuln.severity);
        const severityLabel = `[${vuln.severity.toUpperCase()}]`;
        
        console.log(`  ${severityColor}${severityLabel}${this.colors.reset} ${this.colorize(vuln.package, 'bold')}`);
        if (vuln.title) console.log(`    ${vuln.title}`);
        if (vuln.url) console.log(this.colorize(`    ${vuln.url}`, 'cyan'));
        console.log(`    Range: ${vuln.range}`);
        console.log(`    Fix Available: ${vuln.fixAvailable ? this.colorize('Yes', 'green') : this.colorize('No', 'high')}`);
        console.log('');
      });
      
      if (this.report.vulnerabilities.length > 10) {
        console.log(`  ... and ${this.report.vulnerabilities.length - 10} more`);
      }
    }
    console.log('');

    // Auto-Updated Packages
    console.log('⚡ AUTO-UPDATED PACKAGES (Patch/Minor)');
    console.log('-'.repeat(80));
    if (this.report.autoUpdated.length === 0) {
      console.log('  No packages auto-updated');
    } else {
      this.report.autoUpdated.forEach(pkg => {
        console.log(`  ${this.options.dryRun ? '📋' : '✅'} ${pkg.package}: ${pkg.currentVersion} → ${pkg.wantedVersion} (${pkg.type})`);
      });
    }
    console.log('');

    // Manual Review Required
    console.log('⚠️  MANUAL REVIEW REQUIRED (Major Updates)');
    console.log('-'.repeat(80));
    if (this.report.manualReview.length === 0) {
      console.log('  No manual review needed');
    } else {
      this.report.manualReview.forEach(pkg => {
        console.log(`  📦 ${pkg.package}: ${pkg.currentVersion} → ${pkg.latestVersion}`);
        console.log(`     Type: ${pkg.type} update`);
        console.log(`     Reason: ${pkg.reason}`);
        
        if (pkg.migrationGuide && pkg.migrationGuide.steps) {
          console.log('     Migration Steps:');
          pkg.migrationGuide.steps.slice(0, 3).forEach(step => {
            console.log(`       ${step.order}. ${step.title}`);
            if (step.command) console.log(`          $ ${step.command}`);
          });
        }
        console.log('');
      });
    }

    // Validation Results
    if (this.report.validationResults.length > 0) {
      console.log('🧪 VALIDATION RESULTS');
      console.log('-'.repeat(80));
      this.report.validationResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} ${result.step}`);
        if (result.error) console.log(`     Error: ${result.error}`);
      });
      console.log('');
    }

    // Errors
    if (this.report.errors.length > 0) {
      console.log('❌ ERRORS ENCOUNTERED');
      console.log('-'.repeat(80));
      this.report.errors.forEach(err => {
        console.log(`  Stage: ${err.stage}`);
        console.log(`  Error: ${err.error}`);
      });
      console.log('');
    }

    // Summary
    console.log('📈 SUMMARY');
    console.log('-'.repeat(80));
    console.log(`  Vulnerabilities Found: ${this.report.summary.vulnerabilities?.total || 0}`);
    console.log(`  Packages ${this.options.dryRun ? 'Would Be' : ''} Auto-Updated: ${this.report.summary.updates?.autoUpdate || 0}`);
    console.log(`  Packages Requiring Manual Review: ${this.report.summary.updates?.manualReview || 0}`);
    if (!this.options.dryRun && typeof this.report.summary.updateSuccess === 'boolean') {
      console.log(`  Update Status: ${this.report.summary.updateSuccess ? '✅ Success' : '❌ Failed'}`);
    }
    console.log('');

    console.log('='.repeat(80));

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'reports', 'dependency-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    this.log(`Full report saved to: ${reportPath}`, 'success');

    // Save markdown report
    this.generateMarkdownReport();
  }

  generateMarkdownReport() {
    const mdPath = path.join(process.cwd(), 'reports', 'dependency-report.md');
    
    let markdown = `# Dependency Management Report\n\n`;
    markdown += `**Date:** ${new Date(this.report.date).toLocaleString()}\n\n`;
    
    markdown += `## 🔒 Security Vulnerabilities\n\n`;
    if (this.report.vulnerabilities.length === 0) {
      markdown += `✅ No vulnerabilities found\n\n`;
    } else {
      markdown += `| Severity | Package | Title | Fix Available |\n`;
      markdown += `|----------|---------|-------|---------------|\n`;
      this.report.vulnerabilities.forEach(vuln => {
        const title = (vuln.title || '').substring(0, 50);
        markdown += `| ${vuln.severity} | ${vuln.package} | ${title} | ${vuln.fixAvailable ? '✅' : '❌'} |\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `## Summary\n\n`;
    markdown += `- **Total Vulnerabilities:** ${this.report.summary.vulnerabilities?.total || 0}\n`;
    markdown += `- **Packages Auto-Updated:** ${this.report.summary.updates?.autoUpdate || 0}\n`;
    markdown += `- **Packages Requiring Manual Review:** ${this.report.summary.updates?.manualReview || 0}\n`;
    
    fs.writeFileSync(mdPath, markdown);
    this.log(`Markdown report saved to: ${mdPath}`, 'success');
  }

  async run() {
    this.log('Starting Dependency Management...', 'progress');
    console.log('');

    await this.scanVulnerabilities();
    await this.checkOutdated();
    await this.autoUpdate();
    await this.generateMigrationGuides();
    this.generateReport();

    this.log('Dependency management complete!', 'success');
    
    // Exit with error code if there were errors
    if (this.report.errors.length > 0 && !this.options.dryRun) {
      process.exit(1);
    }
  }
}

// CLI Interface
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  skipTests: args.includes('--skip-tests'),
  skipValidation: args.includes('--skip-validation')
};

if (args.includes('--help')) {
  console.log(`
Automated Dependency Manager

Usage: node dependency-manager.cjs [options]

Options:
  --dry-run           Show what would be updated without making changes
  --skip-tests        Skip running tests during validation
  --skip-validation   Skip all validation steps
  --help             Show this help message

Examples:
  node dependency-manager.cjs --dry-run
  node dependency-manager.cjs
  node dependency-manager.cjs --skip-tests
  `);
  process.exit(0);
}

const manager = new DependencyManager(options);
manager.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

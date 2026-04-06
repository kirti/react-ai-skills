---
name: css-style-fixes
description: Automatically detect and fix CSS inconsistencies, conflicts, and suggest maintainable styling patterns for Tailwind, SCSS, and CSS Modules
version: 1.0.0
tags: [css, styling, tailwind, scss, code-quality, maintainability]
---

# CSS/Style Fixes and Suggestions

## When to Use This Skill
- Detecting inconsistent CSS patterns
- Finding conflicting or redundant styles
- Converting inline styles to utility classes
- Optimizing CSS for performance
- Ensuring CSS best practices
- Migrating between CSS approaches (CSS → Tailwind, etc.)

## Understanding CSS Issues

### Common CSS Problems

**1. Conflicting Styles**
```css
/* ❌ Problem: Specificity conflict */
.button { background: blue; }
button.button { background: red; }
#header .button { background: green; }

/* ✅ Fixed: Consistent specificity */
.button { background: var(--button-bg, blue); }
.button--primary { background: var(--button-primary-bg, red); }
.button--success { background: var(--button-success-bg, green); }
```

**2. Duplicated Properties**
```css
/* ❌ Problem: Repeated values */
.card { margin: 20px; padding: 20px; }
.modal { margin: 20px; padding: 20px; }
.panel { margin: 20px; padding: 20px; }

/* ✅ Fixed: Use CSS variables or utility classes */
:root {
  --spacing-medium: 20px;
}

.card, .modal, .panel {
  margin: var(--spacing-medium);
  padding: var(--spacing-medium);
}
```

**3. Inconsistent Naming**
```css
/* ❌ Problem: Mixed naming conventions */
.btn-Primary { }
.button_secondary { }
.ButtonTertiary { }

/* ✅ Fixed: BEM or consistent naming */
.button--primary { }
.button--secondary { }
.button--tertiary { }
```

## Detection Tools

### StyleLint Configuration

```javascript
// .stylelintrc.js
module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-prettier'
  ],
  plugins: [
    'stylelint-order',
    'stylelint-scss'
  ],
  rules: {
    // Enforce consistent naming
    'selector-class-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    
    // Prevent duplication
    'declaration-block-no-duplicate-properties': true,
    'no-duplicate-selectors': true,
    
    // Enforce property order
    'order/properties-alphabetical-order': true,
    
    // Limit specificity
    'selector-max-id': 0,
    'selector-max-specificity': '0,3,0',
    
    // Prevent redundant
    'shorthand-property-no-redundant-values': true,
    'declaration-block-no-redundant-longhand-properties': true,
    
    // Color consistency
    'color-named': 'never',
    'color-no-hex': true,
    
    // Units
    'length-zero-no-unit': true,
    'unit-allowed-list': ['px', 'rem', '%', 'vh', 'vw', 's', 'ms'],
    
    // No vendor prefixes (use autoprefixer)
    'property-no-vendor-prefix': true,
    'value-no-vendor-prefix': true
  }
};
```

### Custom CSS Analyzer

```javascript
// scripts/analyze-css.js
import fs from 'fs';
import path from 'path';
import postcss from 'postcss';

class CSSAnalyzer {
  constructor() {
    this.issues = [];
    this.stats = {
      totalRules: 0,
      totalDeclarations: 0,
      duplicateSelectors: new Map(),
      duplicateDeclarations: new Map(),
      colorVariations: new Map(),
      spacingValues: new Map()
    };
  }

  async analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ast = postcss.parse(content);

    ast.walkRules(rule => {
      this.stats.totalRules++;
      this.analyzeRule(rule, filePath);
    });

    return this.generateReport();
  }

  analyzeRule(rule, file) {
    const selector = rule.selector;

    // Check for duplicate selectors
    if (!this.stats.duplicateSelectors.has(selector)) {
      this.stats.duplicateSelectors.set(selector, []);
    }
    this.stats.duplicateSelectors.get(selector).push(file);

    // Analyze declarations
    rule.walkDecls(decl => {
      this.stats.totalDeclarations++;
      this.analyzeDeclaration(decl, selector, file);
    });
  }

  analyzeDeclaration(decl, selector, file) {
    const prop = decl.prop;
    const value = decl.value;

    // Track color values
    if (this.isColor(prop)) {
      if (!this.stats.colorVariations.has(value)) {
        this.stats.colorVariations.set(value, []);
      }
      this.stats.colorVariations.get(value).push({ selector, file });
    }

    // Track spacing values
    if (this.isSpacing(prop)) {
      if (!this.stats.spacingValues.has(value)) {
        this.stats.spacingValues.set(value, []);
      }
      this.stats.spacingValues.get(value).push({ selector, prop, file });
    }

    // Check for redundant declarations
    const key = `${selector}:${prop}`;
    if (!this.stats.duplicateDeclarations.has(key)) {
      this.stats.duplicateDeclarations.set(key, []);
    }
    this.stats.duplicateDeclarations.get(key).push({ value, file });
  }

  isColor(prop) {
    return ['color', 'background-color', 'border-color', 'fill', 'stroke']
      .includes(prop);
  }

  isSpacing(prop) {
    return ['margin', 'padding', 'gap', 'margin-top', 'margin-right', 
            'margin-bottom', 'margin-left', 'padding-top', 'padding-right',
            'padding-bottom', 'padding-left'].includes(prop);
  }

  generateReport() {
    const report = {
      summary: {
        totalRules: this.stats.totalRules,
        totalDeclarations: this.stats.totalDeclarations,
        duplicateSelectorsCount: 0,
        uniqueColors: this.stats.colorVariations.size,
        uniqueSpacingValues: this.stats.spacingValues.size
      },
      issues: [],
      suggestions: []
    };

    // Find duplicate selectors
    this.stats.duplicateSelectors.forEach((files, selector) => {
      if (files.length > 1) {
        report.summary.duplicateSelectorsCount++;
        report.issues.push({
          type: 'duplicate-selector',
          selector,
          files,
          severity: 'warning'
        });
      }
    });

    // Suggest color variables
    if (this.stats.colorVariations.size > 5) {
      const colors = Array.from(this.stats.colorVariations.entries())
        .filter(([_, usages]) => usages.length > 2)
        .map(([color, usages]) => ({ color, usages: usages.length }));

      if (colors.length > 0) {
        report.suggestions.push({
          type: 'use-color-variables',
          message: 'Consider using CSS variables for frequently used colors',
          colors
        });
      }
    }

    // Suggest spacing scale
    if (this.stats.spacingValues.size > 8) {
      report.suggestions.push({
        type: 'use-spacing-scale',
        message: 'Consider implementing a consistent spacing scale',
        uniqueValues: this.stats.spacingValues.size
      });
    }

    return report;
  }
}

// Usage
const analyzer = new CSSAnalyzer();
const report = await analyzer.analyzeFile('./src/styles/main.css');

console.log('📊 CSS Analysis Report\n');
console.log(`Total Rules: ${report.summary.totalRules}`);
console.log(`Total Declarations: ${report.summary.totalDeclarations}`);
console.log(`Duplicate Selectors: ${report.summary.duplicateSelectorsCount}`);
console.log(`Unique Colors: ${report.summary.uniqueColors}`);
console.log(`Unique Spacing Values: ${report.summary.uniqueSpacingValues}\n`);

if (report.issues.length > 0) {
  console.log('⚠️  Issues Found:\n');
  report.issues.forEach(issue => {
    console.log(`- ${issue.type}: ${issue.selector}`);
  });
}

if (report.suggestions.length > 0) {
  console.log('\n💡 Suggestions:\n');
  report.suggestions.forEach(suggestion => {
    console.log(`- ${suggestion.message}`);
  });
}
```

## Tailwind-Specific Fixes

### Detect Inline Styles to Convert

```javascript
// scripts/convert-to-tailwind.js
class TailwindConverter {
  constructor() {
    this.styleMap = {
      // Layout
      'display: flex': 'flex',
      'display: grid': 'grid',
      'display: block': 'block',
      'display: none': 'hidden',
      
      // Spacing
      'margin: 0': 'm-0',
      'margin: 4px': 'm-1',
      'margin: 8px': 'm-2',
      'padding: 0': 'p-0',
      'padding: 4px': 'p-1',
      'padding: 8px': 'p-2',
      
      // Colors
      'color: #000': 'text-black',
      'color: #fff': 'text-white',
      'background-color: #000': 'bg-black',
      'background-color: #fff': 'bg-white',
      
      // Typography
      'font-weight: bold': 'font-bold',
      'text-align: center': 'text-center',
      'font-size: 14px': 'text-sm',
      'font-size: 16px': 'text-base',
      'font-size: 18px': 'text-lg'
    };
  }

  convertInlineStyles(jsx) {
    const inlineStyleRegex = /style={{([^}]+)}}/g;
    const matches = jsx.matchAll(inlineStyleRegex);
    
    const conversions = [];

    for (const match of matches) {
      const styles = match[1];
      const tailwindClasses = this.convertToTailwind(styles);
      
      conversions.push({
        original: match[0],
        tailwind: `className="${tailwindClasses}"`,
        styles: styles.trim()
      });
    }

    return conversions;
  }

  convertToTailwind(styles) {
    const declarations = styles
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''));
    
    const classes = [];

    declarations.forEach(decl => {
      const normalized = this.normalizeDeclaration(decl);
      const tailwindClass = this.styleMap[normalized];
      
      if (tailwindClass) {
        classes.push(tailwindClass);
      } else {
        // Try to infer Tailwind class
        const inferred = this.inferTailwindClass(decl);
        if (inferred) {
          classes.push(inferred);
        }
      }
    });

    return classes.join(' ');
  }

  normalizeDeclaration(decl) {
    return decl
      .replace(/:\s+/g, ': ')
      .replace(/;$/, '')
      .trim();
  }

  inferTailwindClass(decl) {
    const [prop, value] = decl.split(':').map(s => s.trim());

    // Margin/Padding with px values
    if (prop.startsWith('margin') || prop.startsWith('padding')) {
      const match = value.match(/(\d+)px/);
      if (match) {
        const px = parseInt(match[1]);
        const scale = Math.round(px / 4); // Tailwind uses 4px scale
        const prefix = prop.startsWith('margin') ? 'm' : 'p';
        const side = this.getSide(prop);
        return `${prefix}${side}-${scale}`;
      }
    }

    return null;
  }

  getSide(prop) {
    if (prop.includes('top')) return 't';
    if (prop.includes('right')) return 'r';
    if (prop.includes('bottom')) return 'b';
    if (prop.includes('left')) return 'l';
    return '';
  }
}

// Usage in JSX file
const converter = new TailwindConverter();
const jsxContent = fs.readFileSync('./src/Component.jsx', 'utf8');
const conversions = converter.convertInlineStyles(jsxContent);

console.log('🎨 Tailwind Conversion Suggestions:\n');
conversions.forEach(conv => {
  console.log(`Replace:`);
  console.log(`  ${conv.original}`);
  console.log(`With:`);
  console.log(`  ${conv.tailwind}\n`);
});
```

### Detect Unused Tailwind Classes

```javascript
// scripts/detect-unused-tailwind.js
import fs from 'fs';
import path from 'path';

class TailwindAuditor {
  constructor() {
    this.usedClasses = new Set();
    this.definedClasses = new Set();
  }

  async audit(srcDir, configPath) {
    // Scan all JSX/TSX files for used classes
    this.scanForUsedClasses(srcDir);
    
    // Load Tailwind config to see what's defined
    this.loadTailwindConfig(configPath);
    
    // Find unused
    const unused = Array.from(this.definedClasses)
      .filter(cls => !this.usedClasses.has(cls));
    
    return {
      totalDefined: this.definedClasses.size,
      totalUsed: this.usedClasses.size,
      unused
    };
  }

  scanForUsedClasses(dir) {
    const files = this.getAllFiles(dir);
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Extract className attributes
      const classNameRegex = /className="([^"]+)"|className={'([^']+)'}/g;
      const matches = content.matchAll(classNameRegex);
      
      for (const match of matches) {
        const classes = (match[1] || match[2]).split(/\s+/);
        classes.forEach(cls => this.usedClasses.add(cls.trim()));
      }
    });
  }

  loadTailwindConfig(configPath) {
    // This would parse tailwind.config.js
    // For simplicity, we'll just note common classes
    const commonClasses = [
      'flex', 'grid', 'hidden', 'block',
      'm-0', 'm-1', 'm-2', 'p-0', 'p-1', 'p-2',
      'text-black', 'text-white', 'bg-black', 'bg-white'
    ];
    
    commonClasses.forEach(cls => this.definedClasses.add(cls));
  }

  getAllFiles(dir, ext = ['.jsx', '.tsx']) {
    // Implementation similar to previous examples
  }
}
```

## SCSS Best Practices

### Detect and Fix SCSS Issues

```scss
/* ❌ Bad SCSS practices */
.header {
  .nav {
    .item {
      .link {
        .icon {
          /* Too deeply nested */
        }
      }
    }
  }
}

/* ✅ Good: Limit nesting to 3 levels */
.header {}
.header__nav {}
.header__nav-item {}
.header__nav-link {}
.header__nav-icon {}

/* ❌ Bad: Hardcoded colors */
.button {
  background: #3498db;
  color: #ffffff;
}

/* ✅ Good: Use variables */
$color-primary: #3498db;
$color-white: #ffffff;

.button {
  background: $color-primary;
  color: $color-white;
}

/* ❌ Bad: Magic numbers */
.card {
  padding: 23px;
  margin: 17px;
}

/* ✅ Good: Named spacing scale */
$spacing: (
  xs: 4px,
  sm: 8px,
  md: 16px,
  lg: 24px,
  xl: 32px
);

.card {
  padding: map-get($spacing, lg);
  margin: map-get($spacing, md);
}
```

### Auto-fix SCSS Script

```javascript
// scripts/fix-scss.js
import fs from 'fs';
import postcss from 'postcss';
import scss from 'postcss-scss';

class SCSSFixer {
  constructor() {
    this.fixes = [];
  }

  async fixFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ast = postcss().process(content, { syntax: scss });

    ast.root.walkRules(rule => {
      // Fix 1: Limit nesting depth
      const depth = this.getNestingDepth(rule);
      if (depth > 3) {
        this.fixes.push({
          type: 'deep-nesting',
          selector: rule.selector,
          depth,
          suggestion: 'Flatten using BEM or separate selectors'
        });
      }

      // Fix 2: Extract hardcoded colors
      rule.walkDecls(decl => {
        if (this.isColor(decl.prop) && this.isHexColor(decl.value)) {
          this.fixes.push({
            type: 'hardcoded-color',
            property: decl.prop,
            value: decl.value,
            suggestion: `Use variable: $color-${this.colorName(decl.value)}`
          });
        }
      });
    });

    return this.fixes;
  }

  getNestingDepth(rule, depth = 0) {
    return rule.parent && rule.parent.type === 'rule'
      ? this.getNestingDepth(rule.parent, depth + 1)
      : depth;
  }

  isColor(prop) {
    return ['color', 'background-color', 'border-color'].includes(prop);
  }

  isHexColor(value) {
    return /^#[0-9a-f]{3,6}$/i.test(value);
  }

  colorName(hex) {
    // Simple color naming (would be more sophisticated in production)
    const colorMap = {
      '#000': 'black',
      '#fff': 'white',
      '#3498db': 'primary',
      '#e74c3c': 'danger'
    };
    return colorMap[hex.toLowerCase()] || hex.slice(1);
  }
}
```

## CSS Modules Best Practices

```javascript
// ❌ Bad: Global class pollution
import './styles.css';

function Component() {
  return <div className="container" />;
}

// ✅ Good: Scoped CSS Modules
import styles from './Component.module.css';

function Component() {
  return <div className={styles.container} />;
}
```

### Detect Non-Module CSS

```javascript
// scripts/convert-to-css-modules.js
class CSSModuleConverter {
  async convertFile(cssPath) {
    const content = fs.readFileSync(cssPath, 'utf8');
    const componentName = path.basename(cssPath, '.css');
    const modulePath = cssPath.replace('.css', '.module.css');

    // Convert global classes to BEM
    const converted = content.replace(
      /\.([a-z-]+)\s*{/g,
      `.${componentName}__$1 {`
    );

    fs.writeFileSync(modulePath, converted);
    
    return {
      original: cssPath,
      module: modulePath,
      suggestion: `Update imports to use: import styles from './${path.basename(modulePath)}'`
    };
  }
}
```

## Performance Optimization

### Remove Unused CSS

```javascript
// Using PurgeCSS
const purgecss = require('@fullhuman/postcss-purgecss');

module.exports = {
  plugins: [
    purgecss({
      content: ['./src/**/*.{js,jsx,ts,tsx}'],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
    })
  ]
};
```

### Minify and Optimize

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('cssnano')({
      preset: ['default', {
        discardComments: { removeAll: true },
        normalizeWhitespace: true
      }]
    })
  ]
};
```

## Package.json Scripts

```json
{
  "scripts": {
    "lint:css": "stylelint 'src/**/*.{css,scss}'",
    "lint:css:fix": "stylelint 'src/**/*.{css,scss}' --fix",
    "analyze:css": "node scripts/analyze-css.js",
    "convert:tailwind": "node scripts/convert-to-tailwind.js",
    "audit:tailwind": "node scripts/detect-unused-tailwind.js",
    "fix:scss": "node scripts/fix-scss.js"
  }
}
```

## Summary Checklist

- ✅ Detect CSS conflicts and duplicates
- ✅ Enforce consistent naming conventions
- ✅ Convert inline styles to utility classes
- ✅ Suggest CSS variables for repeated values
- ✅ Detect unused Tailwind classes
- ✅ Fix SCSS nesting and best practices
- ✅ Convert to CSS Modules
- ✅ Optimize and remove unused CSS
- ✅ Integrate StyleLint for automated checking
- ✅ Generate actionable reports

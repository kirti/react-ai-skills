---
name: testcafe-automation
description: Automated TestCafe test generation, coverage detection, and CI/CD integration for frontend testing
version: 1.0.0
tags: [testcafe, e2e-testing, automation, frontend, testing, ci-cd]
---

# TestCafe Automation Skill

## When to Use This Skill
- Generating E2E tests for new frontend features
- Detecting areas without test coverage
- Setting up TestCafe infrastructure
- Integrating tests into CI/CD pipelines
- Improving existing test quality

## Understanding TestCafe

TestCafe is a Node.js-based E2E testing framework that:
- ✅ Works without WebDriver
- ✅ Tests real browsers (Chrome, Safari, Firefox)
- ✅ Has built-in waiting mechanisms
- ✅ Supports parallel test execution
- ✅ Generates reports and screenshots

## Auto-Generating Tests

### Basic Test Structure

```javascript
// tests/user-authentication.test.js
import { Selector } from 'testcafe';

fixture('User Authentication')
  .page('http://localhost:3000/login');

test('User can log in with valid credentials', async t => {
  await t
    .typeText('#email', 'user@example.com')
    .typeText('#password', 'password123')
    .click('#login-button')
    .expect(Selector('.dashboard').exists).ok()
    .expect(Selector('.user-name').innerText).eql('John Doe');
});

test('Shows error with invalid credentials', async t => {
  await t
    .typeText('#email', 'wrong@example.com')
    .typeText('#password', 'wrongpass')
    .click('#login-button')
    .expect(Selector('.error-message').innerText)
    .contains('Invalid credentials');
});
```

### Auto-Generation from React Components

**Pattern Recognition:**

For a component like:
```jsx
// LoginForm.jsx
const LoginForm = ({ onSubmit }) => (
  <form onSubmit={onSubmit} data-testid="login-form">
    <input 
      type="email" 
      name="email" 
      data-testid="email-input"
      placeholder="Email"
    />
    <input 
      type="password" 
      name="password" 
      data-testid="password-input"
      placeholder="Password"
    />
    <button type="submit" data-testid="login-button">
      Login
    </button>
  </form>
);
```

**Auto-Generate Test:**
```javascript
// Auto-generated from LoginForm.jsx
import { Selector } from 'testcafe';

fixture('LoginForm Component')
  .page('http://localhost:3000/login');

const emailInput = Selector('[data-testid="email-input"]');
const passwordInput = Selector('[data-testid="password-input"]');
const loginButton = Selector('[data-testid="login-button"]');

test('LoginForm renders all fields', async t => {
  await t
    .expect(emailInput.exists).ok('Email input should exist')
    .expect(passwordInput.exists).ok('Password input should exist')
    .expect(loginButton.exists).ok('Login button should exist');
});

test('LoginForm accepts user input', async t => {
  const testEmail = 'test@example.com';
  const testPassword = 'testpass123';

  await t
    .typeText(emailInput, testEmail)
    .typeText(passwordInput, testPassword)
    .expect(emailInput.value).eql(testEmail)
    .expect(passwordInput.value).eql(testPassword);
});

test('LoginForm submits on button click', async t => {
  await t
    .typeText(emailInput, 'user@test.com')
    .typeText(passwordInput, 'password')
    .click(loginButton)
    .wait(1000); // Wait for submission
  
  // Check for expected behavior after submit
  // Auto-detect: redirect, loading state, or error message
});
```

## Coverage Detection

### Detecting Untested Components

**File Scanning Pattern:**
```javascript
// scripts/detect-untested-components.js
import fs from 'fs';
import path from 'path';

const findReactComponents = (dir) => {
  const components = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach(file => {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory() && file.name !== 'node_modules') {
      components.push(...findReactComponents(filePath));
    } else if (/\.(jsx|tsx)$/.test(file.name)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Detect React components
      const componentMatches = content.match(/(?:export\s+(?:default\s+)?(?:const|function)\s+(\w+)|class\s+(\w+)\s+extends\s+(?:React\.)?Component)/g);
      
      if (componentMatches) {
        components.push({
          file: filePath,
          name: file.name,
          components: componentMatches.map(m => 
            m.match(/\b(\w+)(?=\s*(?:=|extends))/)?.[1]
          ).filter(Boolean)
        });
      }
    }
  });

  return components;
};

const findExistingTests = (dir) => {
  const tests = new Set();
  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach(file => {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      findExistingTests(filePath).forEach(t => tests.add(t));
    } else if (/\.test\.(js|ts)$/.test(file.name)) {
      const content = fs.readFileSync(filePath, 'utf8');
      // Extract tested component names
      const fixtureMatches = content.match(/fixture\(['"](.+?)['"]\)/g);
      if (fixtureMatches) {
        fixtureMatches.forEach(m => {
          const name = m.match(/fixture\(['"](.+?)['"]\)/)?.[1];
          if (name) tests.add(name);
        });
      }
    }
  });

  return tests;
};

// Find components without tests
const components = findReactComponents('./src');
const testedComponents = findExistingTests('./tests');

const untestedComponents = components.filter(c => 
  !c.components.some(name => testedComponents.has(name))
);

console.log('📊 Test Coverage Report\n');
console.log(`Total Components: ${components.length}`);
console.log(`Tested: ${components.length - untestedComponents.length}`);
console.log(`Untested: ${untestedComponents.length}`);
console.log('\n⚠️  Components Without Tests:\n');

untestedComponents.forEach(c => {
  console.log(`  📄 ${c.file}`);
  c.components.forEach(name => console.log(`     - ${name}`));
});
```

### Auto-Generate Test Scaffolding

```javascript
// scripts/generate-test-scaffold.js
const generateTestScaffold = (componentPath, componentName) => {
  const testTemplate = `
import { Selector } from 'testcafe';

fixture('${componentName}')
  .page('http://localhost:3000'); // TODO: Update URL

// TODO: Add selectors for ${componentName}
const container = Selector('[data-testid="${componentName.toLowerCase()}"]');

test('${componentName} renders correctly', async t => {
  await t
    .expect(container.exists).ok('${componentName} should render');
  
  // TODO: Add more assertions
});

test('${componentName} handles user interactions', async t => {
  // TODO: Add interaction tests
  await t
    .click(container)
    .wait(100);
  
  // TODO: Verify expected behavior
});

test('${componentName} handles edge cases', async t => {
  // TODO: Test error states
  // TODO: Test loading states
  // TODO: Test empty states
});
`;

  const testPath = componentPath.replace(/\.(jsx|tsx)$/, '.test.js');
  const testDir = testPath.replace(/src\//, 'tests/');
  
  return { path: testDir, content: testTemplate };
};
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/testcafe.yml
name: TestCafe E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        browser: [chrome, firefox]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm start &
        env:
          PORT: 3000
      
      - name: Wait for application
        run: npx wait-on http://localhost:5173 
      
      - name: Run TestCafe tests
        run: npm run test:e2e -- --browser=${{ matrix.browser }}
      
      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: testcafe-screenshots-${{ matrix.browser }}
          path: screenshots/
      
      - name: Upload test reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: testcafe-reports-${{ matrix.browser }}
          path: reports/
```

### TestCafe Configuration

```javascript
// .testcaferc.js
module.exports = {
  src: ['tests/**/*.test.js'],
  browsers: ['chrome:headless', 'firefox:headless'],
  screenshots: {
    path: 'screenshots/',
    takeOnFails: true,
    fullPage: true
  },
  videoPath: 'videos/',
  videoOptions: {
    failedOnly: true
  },
  reporter: [
    {
      name: 'spec'
    },
    {
      name: 'json',
      output: 'reports/report.json'
    },
    {
      name: 'xunit',
      output: 'reports/report.xml'
    }
  ],
  concurrency: 3,
  selectorTimeout: 10000,
  assertionTimeout: 5000,
  pageLoadTimeout: 30000,
  speed: 1,
  stopOnFirstFail: false,
  skipJsErrors: false,
  quarantineMode: false,
  debugMode: false,
  debugOnFail: false,
  skipUncaughtErrors: false
};
```

## Test Quality Improvements

### Detecting Missing Edge Cases

```javascript
// Auto-suggest missing test cases
const suggestEdgeCases = (component) => {
  const suggestions = [];
  
  // Check for loading states
  if (component.includes('isLoading') || component.includes('loading')) {
    suggestions.push({
      type: 'loading-state',
      test: `
test('Shows loading state', async t => {
  await t
    .expect(Selector('.loading-spinner').exists).ok()
    .wait(2000)
    .expect(Selector('.loading-spinner').exists).notOk();
});`
    });
  }
  
  // Check for error handling
  if (component.includes('error') || component.includes('catch')) {
    suggestions.push({
      type: 'error-handling',
      test: `
test('Handles errors gracefully', async t => {
  // Mock API error
  await t
    .expect(Selector('.error-message').exists).ok()
    .expect(Selector('.error-message').innerText)
    .contains('error', { timeout: 5000 });
});`
    });
  }
  
  // Check for empty states
  if (component.includes('length === 0') || component.includes('empty')) {
    suggestions.push({
      type: 'empty-state',
      test: `
test('Shows empty state when no data', async t => {
  await t
    .expect(Selector('.empty-state').exists).ok()
    .expect(Selector('.empty-state').innerText)
    .contains('No items found');
});`
    });
  }
  
  // Check for form validation
  if (component.includes('input') || component.includes('form')) {
    suggestions.push({
      type: 'validation',
      test: `
test('Validates form inputs', async t => {
  await t
    .click('[type="submit"]')
    .expect(Selector('.validation-error').exists).ok()
    .typeText('input[name="email"]', 'invalid')
    .click('[type="submit"]')
    .expect(Selector('.validation-error').innerText)
    .contains('valid email');
});`
    });
  }
  
  return suggestions;
};
```

### Best Practices

```javascript
// ✅ Good - Page Object Model
class LoginPage {
  constructor() {
    this.emailInput = Selector('#email');
    this.passwordInput = Selector('#password');
    this.submitButton = Selector('button[type="submit"]');
    this.errorMessage = Selector('.error');
  }

  async login(email, password) {
    await t
      .typeText(this.emailInput, email)
      .typeText(this.passwordInput, password)
      .click(this.submitButton);
  }
}

// Usage
const loginPage = new LoginPage();

test('Login with valid credentials', async t => {
  await loginPage.login('user@test.com', 'password123');
  await t.expect(Selector('.dashboard').exists).ok();
});

// ✅ Good - Custom Commands
const waitForElement = async (selector, timeout = 5000) => {
  await t.expect(Selector(selector).exists).ok({ timeout });
};

const fillForm = async (formData) => {
  for (const [field, value] of Object.entries(formData)) {
    await t.typeText(`[name="${field}"]`, value);
  }
};

// ✅ Good - Test Data Management
const testData = {
  validUser: {
    email: 'test@example.com',
    password: 'Test123!@#'
  },
  invalidUser: {
    email: 'invalid',
    password: '123'
  }
};

// ✅ Good - Cleanup
test.after(async t => {
  // Clean up test data
  await t.navigateTo('/admin/cleanup');
});
```

## Automated Test Generation Script

```javascript
// scripts/auto-generate-tests.js
import fs from 'fs';
import path from 'path';

class TestGenerator {
  constructor(options = {}) {
    this.srcDir = options.srcDir || './src';
    this.testDir = options.testDir || './tests';
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
  }

  async generateTests() {
    const components = this.findComponents(this.srcDir);
    const generated = [];

    for (const component of components) {
      const testPath = this.getTestPath(component.path);
      
      if (!fs.existsSync(testPath)) {
        const testContent = this.generateTestContent(component);
        
        fs.mkdirSync(path.dirname(testPath), { recursive: true });
        fs.writeFileSync(testPath, testContent);
        
        generated.push(testPath);
        console.log(`✅ Generated: ${testPath}`);
      }
    }

    return generated;
  }

  findComponents(dir) {
    // Implementation from coverage detection above
  }

  generateTestContent(component) {
    const { name, path: componentPath, testIds } = component;
    
    return `
import { Selector } from 'testcafe';

fixture('${name}')
  .page('${this.baseUrl}')
  .beforeEach(async t => {
    // Setup: Navigate to component
    await t.navigateTo('/${name.toLowerCase()}');
  });

${testIds.map(id => `
test('${name} - ${id} interaction', async t => {
  const element = Selector('[data-testid="${id}"]');
  
  await t
    .expect(element.exists).ok('Element should exist')
    .click(element)
    .wait(500);
  
  // TODO: Add assertions for expected behavior
});`).join('\n')}

test('${name} - Accessibility', async t => {
  // Check for accessibility attributes
  await t
    .expect(Selector('button').getAttribute('aria-label')).ok()
    .expect(Selector('img').getAttribute('alt')).ok();
});
`;
  }

  getTestPath(componentPath) {
    return componentPath
      .replace(this.srcDir, this.testDir)
      .replace(/\.(jsx|tsx)$/, '.test.js');
  }
}

// Run generator
const generator = new TestGenerator();
generator.generateTests();
```

## Summary Checklist

- ✅ Auto-generate tests from React components
- ✅ Detect components without test coverage
- ✅ Generate test scaffolding for untested components
- ✅ Integrate TestCafe into CI/CD (GitHub Actions)
- ✅ Use Page Object Model pattern
- ✅ Suggest missing edge cases (loading, error, empty states)
- ✅ Configure TestCafe with screenshots and reports
- ✅ Run tests in multiple browsers
- ✅ Generate coverage reports
- ✅ Validate accessibility in tests

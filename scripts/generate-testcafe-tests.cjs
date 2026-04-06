#!/usr/bin/env node
console.log('🧪 TestCafe Test Generator\n');
console.log('⚠️  Note: Consider using Playwright instead (no vulnerabilities)\n');
console.log('💡 Generate E2E tests for components\n');
console.log('📝 Example test structure:\n');
console.log(`
import { Selector } from 'testcafe';

fixture('Component Name')
  .page('http://localhost:3000');

test('Component renders correctly', async t => {
  await t
    .expect(Selector('[data-testid="component"]').exists).ok()
    .click(Selector('button'))
    .expect(Selector('.result').innerText).contains('Expected');
});
`);

import { Selector } from 'testcafe';

fixture('TestApp Component')
  .page('http://localhost:5173');

test('TestApp renders', async t => {
  // Look for any heading or text in the component
  const heading = Selector('h1');
  await t
    .expect(heading.exists).ok('TestApp should render')
    .expect(heading.visible).ok('TestApp should be visible');
});

test('TestApp is in the DOM', async t => {
  // Check if React root exists
  const root = Selector('#root');
  await t.expect(root.exists).ok();
});

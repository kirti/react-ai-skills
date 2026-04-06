import { Selector } from 'testcafe';

fixture('App Component E2E Tests')
  .page('http://localhost:5173/');

test('App renders and displays content', async t => {
  const appContainer = Selector('#root');
  
  await t
    .expect(appContainer.exists).ok('App container should exist')
    .expect(appContainer.visible).ok('App should be visible');
});

test('Counter button works', async t => {
  const button = Selector('button').withText(/count/i);
  
  await t
    .expect(button.exists).ok('Counter button should exist')
    .click(button)
    .wait(100);
});

test('Links are clickable', async t => {
  const links = Selector('a');
  
  await t
    .expect(links.count).gte(1, 'Should have at least one link');
});

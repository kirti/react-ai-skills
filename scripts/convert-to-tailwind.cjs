#!/usr/bin/env node
console.log('🎨 Converting to Tailwind...\n');

const conversions = {
  'display: flex': 'flex',
  'display: grid': 'grid',
  'display: none': 'hidden',
  'justify-content: center': 'justify-center',
  'align-items: center': 'items-center',
  'margin: 0': 'm-0',
  'padding: 0': 'p-0'
};

console.log('📋 Common Conversions:\n');
Object.entries(conversions).forEach(([css, tw]) => {
  console.log(`  ${css} → className="${tw}"`);
});

console.log('\n💡 Manual conversion recommended for accuracy\n');

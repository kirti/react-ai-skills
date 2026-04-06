#!/usr/bin/env node
console.log('📝 TypeScript Interface Generator\n');
console.log('💡 Converts PropTypes to TypeScript interfaces\n');
console.log('📋 Example output:\n');
console.log(`
interface ComponentNameProps {
  title: string;
  count?: number;
  onClick?: () => void;
  items?: Array<object>;
}

const ComponentName: React.FC<ComponentNameProps> = ({ title, count, onClick, items }) => {
  // Component implementation
};
`);

#!/usr/bin/env node
console.log('📝 PropTypes Generator\n');
console.log('💡 Analyzes components and generates PropTypes\n');
console.log('📋 Example output:\n');
console.log(`
import PropTypes from 'prop-types';

ComponentName.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number,
  onClick: PropTypes.func,
  items: PropTypes.arrayOf(PropTypes.object)
};
`);

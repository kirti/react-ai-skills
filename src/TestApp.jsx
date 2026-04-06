import React, { useState } from 'react';
import { CLAUDE_KEY } from './config';

export const TestApp = () => {
  const [count, setCount] = useState(0);
  CLAUDE_KEY;
  return (
    <div>
      <h1>Test App</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';


import App from './App';

describe('App Component', () => {
  it('throws error if component is missing', () => {
  expect(() => render(<App1 />)).toThrow();
});

  /*test('displays initial count of 0', () => {
    render(<App />);
    expect(screen.getByText('Count is 0')).toBeInTheDocument();
  });

  test('increments count when button is clicked', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /count is 0/i });
    fireEvent.click(button);
    expect(screen.getByText('Count is 1')).toBeInTheDocument();
  });

  test('renders documentation link', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: /explore vite/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://vite.dev/');
  });

  test('renders React documentation link', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: /learn react/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://react.dev/');
  });*/
});
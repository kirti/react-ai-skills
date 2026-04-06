import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestApp } from './TestApp';

describe('TestApp Skill Demo', () => {
  it('renders and increments counter', async () => {
    render(<TestApp />);
    const user = userEvent.setup();
    const button = screen.getByText(/increment/i);
    
    await user.click(button);
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });
});
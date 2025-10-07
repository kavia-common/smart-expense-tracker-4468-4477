import { render, screen } from '@testing-library/react';
import App from './App';

// Basic smoke test ensuring App renders without crashing
test('renders app container', () => {
  render(<App />);
  const el = screen.getByText(/Smart Expense Tracker/i);
  expect(el).toBeInTheDocument();
});

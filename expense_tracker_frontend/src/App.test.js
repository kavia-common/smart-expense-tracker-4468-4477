import { render, screen } from '@testing-library/react';
import App from './App';
import { getApi } from './api/client';

test('renders dashboard heading by default route', () => {
  render(<App />);
  const heading = screen.getByText(/Dashboard/i);
  expect(heading).toBeInTheDocument();
});

test('api client exposes baseURL and mock flag', () => {
  const api = getApi();
  // If no env is set in test, it should be mock mode
  expect(typeof api.isMock).toBe('boolean');
  expect(api.baseURL === '' || typeof api.baseURL === 'string').toBeTruthy();
});

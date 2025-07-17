import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome message on landing page', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/Welcome to Keisha AI/i);
  expect(welcomeElement).toBeInTheDocument();
});

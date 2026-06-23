import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../shared/api/apiClient', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { access_token: 'fake', user: { id: '1' } } })
  }
}));

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: vi.fn().mockReturnValue(vi.fn())
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('LoginForm', () => {
  it('renders login form correctly', () => {
    renderWithRouter(<LoginForm />);
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeDefined();
  });

  it('allows typing in inputs', () => {
    renderWithRouter(<LoginForm />);
    const emailInput = screen.getByPlaceholderText(/name@example.com/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i) as HTMLInputElement;
    
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('test@test.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('submits form when button is clicked', async () => {
    renderWithRouter(<LoginForm />);
    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole('button', { name: /Sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
  });
});

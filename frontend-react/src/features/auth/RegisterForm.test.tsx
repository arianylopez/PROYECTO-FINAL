import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../shared/api/apiClient', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { message: 'success' } }),
  },
}));

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: vi.fn().mockReturnValue(vi.fn()),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('RegisterForm', () => {
  it('renders register form correctly', () => {
    renderWithRouter(<RegisterForm />);
    expect(screen.getByPlaceholderText(/Leandro Lopez/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign up/i })).toBeDefined();
  });

  it('allows typing in inputs', () => {
    renderWithRouter(<RegisterForm />);
    const nameInput = screen.getByPlaceholderText(/Leandro Lopez/i) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(/name@example.com/i) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });

    expect(nameInput.value).toBe('Test User');
    expect(emailInput.value).toBe('test@test.com');
  });

  it('submits form', () => {
    renderWithRouter(<RegisterForm />);
    const nameInput = screen.getByPlaceholderText(/Leandro Lopez/i);
    const submitButton = screen.getByRole('button', { name: /Sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.click(submitButton);
  });
});

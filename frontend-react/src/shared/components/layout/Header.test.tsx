import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

describe('Header', () => {
  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    expect(screen.getAllByText(/CARTELERA/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CINES/i).length).toBeGreaterThan(0);
  });
});

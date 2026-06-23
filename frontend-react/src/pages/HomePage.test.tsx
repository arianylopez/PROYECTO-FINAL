import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HomePage } from './HomePage';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../features/catalog/catalogApi', () => ({
  fetchMovies: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  fetchGenres: vi.fn().mockResolvedValue({ genres: [] }),
  fetchRecommendations: vi.fn().mockResolvedValue([])
}));

describe('HomePage', () => {
  it('renders homepage', () => {
    const { container } = render(<BrowserRouter><HomePage /></BrowserRouter>);
    expect(container).toBeDefined();
  });
});

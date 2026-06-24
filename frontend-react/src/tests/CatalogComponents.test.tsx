import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MovieCatalog } from '../features/catalog/components/MovieCatalog';
import { MovieCard } from '../features/catalog/components/MovieCard';
import { FeaturedHero } from '../features/catalog/components/FeaturedHero';
import { BrowserRouter } from 'react-router-dom';

describe('Catalog Components', () => {
  it('renders MovieCatalog', () => {
    const { container } = render(<BrowserRouter><MovieCatalog /></BrowserRouter>);
    expect(container).toBeDefined();
  });

  it('renders MovieCard', () => {
    const movie = { id: '1', title: 'Test', poster_url: 'url', duration_minutes: 120, rating_classification: 'ATP', release_date: '2025-01-01' };
    const { container } = render(<BrowserRouter><MovieCard movie={movie as any} /></BrowserRouter>);
    expect(container).toBeDefined();
  });

  it('renders FeaturedHero', () => {
    const { container } = render(<BrowserRouter><FeaturedHero /></BrowserRouter>);
    expect(container).toBeDefined();
  });
});

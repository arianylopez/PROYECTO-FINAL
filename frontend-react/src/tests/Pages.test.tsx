import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaymentPage } from '../pages/PaymentPage';
import { TicketPage } from '../pages/TicketPage';
import { SeatSelectionPage } from '../pages/SeatSelectionPage';
import { MovieDetailPage } from '../pages/MovieDetailPage';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../features/catalog/catalogApi', () => ({
  fetchScreeningSeats: vi.fn().mockResolvedValue({ movie: {}, screening: {}, seats: [], ticket_types: [] }),
  processScreeningPurchase: vi.fn(),
  fetchMovieDetail: vi.fn().mockResolvedValue({ movie: {}, reviews: [], stats: {} }),
  fetchMovieScreenings: vi.fn().mockResolvedValue({ screenings: [] }),
  fetchGenres: vi.fn().mockResolvedValue({ genres: [] }),
}));

describe('Pages rendering', () => {
  it('renders PaymentPage', () => {
    const { container } = render(
      <BrowserRouter>
        <PaymentPage />
      </BrowserRouter>
    );
    expect(container).toBeDefined();
  });

  it('renders TicketPage', () => {
    const { container } = render(
      <BrowserRouter>
        <TicketPage />
      </BrowserRouter>
    );
    expect(container).toBeDefined();
  });

  it('renders SeatSelectionPage', () => {
    const { container } = render(
      <BrowserRouter>
        <SeatSelectionPage />
      </BrowserRouter>
    );
    expect(container).toBeDefined();
  });

  it('renders MovieDetailPage', () => {
    const { container } = render(
      <BrowserRouter>
        <MovieDetailPage />
      </BrowserRouter>
    );
    expect(container).toBeDefined();
  });
});

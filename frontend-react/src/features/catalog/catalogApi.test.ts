import { describe, it, expect, vi } from 'vitest';
import * as api from './catalogApi';
import { apiClient } from '../../shared/api/apiClient';

vi.mock('../../shared/api/apiClient', () => {
  return {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    },
  };
});

describe('catalogApi', () => {
  it('fetchMovies', async () => {
    (apiClient.get as any).mockResolvedValue({ data: { items: [], total: 0 } });
    const res = await api.fetchMovies(1, 10, 'title', 'genre');
    expect(res).toEqual({ items: [], total: 0 });
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/catalog/movies', {
      params: { page: 1, size: 10, genre: 'genre', q: 'title' },
    });
  });

  it('fetchGenres', async () => {
    (apiClient.get as any).mockResolvedValue({ data: { genres: [] } });
    const res = await api.fetchGenres();
    expect(res).toEqual([]);
  });

  it('fetchMovieDetail', async () => {
    (apiClient.get as any).mockResolvedValue({ data: { movie: {} } });
    const res = await api.fetchMovieDetail('1');
    expect(res).toEqual({ movie: {} });
  });

  it('fetchMovieScreenings', async () => {
    (apiClient.get as any).mockResolvedValue({ data: { screenings: [] } });
    const res = await api.fetchMovieScreenings('1');
    expect(res).toEqual({ screenings: [] });
  });

  it('fetchScreeningSeats', async () => {
    (apiClient.get as any).mockResolvedValue({ data: { seats: [] } });
    const res = await api.fetchScreeningSeats('1');
    expect(res).toEqual({ seats: [] });
  });

  it('lockScreeningSeats', async () => {
    (apiClient.post as any).mockResolvedValue({ data: { locked: true } });
    const res = await api.lockScreeningSeats('1', ['A1'], 'user1');
    expect(res).toEqual({ locked: true });
  });

  it('processScreeningPurchase', async () => {
    (apiClient.post as any).mockResolvedValue({ data: { success: true } });
    const res = await api.processScreeningPurchase('1', ['A1'], 'card', 'user1', 100, ['A1']);
    expect(res).toEqual({ success: true });
  });

  it('fetchMyOrders', async () => {
    (apiClient.get as any).mockResolvedValue({ data: { orders: [] } });
    const res = await api.fetchMyOrders('user1');
    expect(res).toEqual([]);
  });

  it('fetchWatchlist', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [] });
    const res = await api.fetchWatchlist('user1');
    expect(res).toEqual([]);
  });

  it('toggleWatchlist', async () => {
    (apiClient.post as any).mockResolvedValue({ data: { is_added: true } });
    const res = await api.toggleWatchlist('1', 'user1', 'Title', 'url');
    expect(res).toEqual(true);
  });

  it('fetchWatchlistStatus', async () => {
    (apiClient.get as any).mockResolvedValue({ data: { is_added: true } });
    const res = await api.fetchWatchlistStatus('1', 'user1');
    expect(res).toEqual(true);
  });

  it('submitMovieRating', async () => {
    (apiClient.post as any).mockResolvedValue({ data: {} });
    const res = await api.submitMovieRating('1', 'user1', 'User', 5);
    expect(res).toEqual({});
  });

  it('submitMovieReview', async () => {
    (apiClient.post as any).mockResolvedValue({ data: {} });
    const res = await api.submitMovieReview('1', 'user1', 'User', 'Review');
    expect(res).toEqual({});
  });

  it('fetchRecommendations', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [] });
    const res = await api.fetchRecommendations('user1');
    expect(res).toEqual([]);
  });

  it('markNotInterested', async () => {
    (apiClient.post as any).mockResolvedValue({ data: {} });
    const res = await api.markNotInterested('1', 'user1');
    expect(res).toEqual({});
  });

  it('fetchActivityHistory', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [] });
    const res = await api.fetchActivityHistory('user1');
    expect(res).toEqual([]);
  });
});

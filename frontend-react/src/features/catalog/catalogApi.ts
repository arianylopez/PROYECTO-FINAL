import { apiClient } from '../../shared/api/apiClient';
import type { components } from '../../shared/api/schema';

export type Movie = components['schemas']['MovieResponse'];
export type CatalogResponse = components['schemas']['CatalogResponse'];
export type Screening = components['schemas']['ScreeningResponse'];
export type MovieDetail = components['schemas']['MovieDetailResponse'];
export type TicketType = components['schemas']['TicketTypeResponse'];
export type Seat = components['schemas']['SeatResponse'];
export type ScreeningSeatsResponse = components['schemas']['ScreeningSeatsResponse'];
export type MovieScreeningsResponse = components['schemas']['MovieScreeningsResponse'];

export const fetchMovies = async (
  page: number = 1,
  size: number = 12,
  searchQuery?: string,
  genre?: string
): Promise<CatalogResponse> => {
  const params: Record<string, any> = { page, size };

  if (searchQuery) params.q = searchQuery;
  if (genre && genre !== 'Todas') params.genre = genre;

  const response = await apiClient.get<CatalogResponse>('/api/v1/catalog/movies', { params });
  return response.data;
};

export const fetchGenres = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get<{ genres: string[] }>('/api/v1/catalog/genres');
    return response.data.genres;
  } catch (error) {
    console.error('Error cargando géneros dinámicos:', error);
    return [];
  }
};

export const fetchMovieDetail = async (id: string): Promise<MovieDetail> => {
  const response = await apiClient.get<MovieDetail>(`/api/v1/catalog/movies/${id}`);
  return response.data;
};

export const fetchMovieScreenings = async (id: string): Promise<MovieScreeningsResponse> => {
  const response = await apiClient.get<MovieScreeningsResponse>(`/api/v1/catalog/movies/${id}/screenings`);
  return response.data;
};

export const fetchScreeningSeats = async (screeningId: string, userId?: string): Promise<ScreeningSeatsResponse> => {
  const params = userId ? { user_id: userId } : {};
  const response = await apiClient.get<ScreeningSeatsResponse>(`/api/v1/catalog/screenings/${screeningId}/seats`, {
    params,
  });
  return response.data;
};

export const lockScreeningSeats = async (screeningId: string, seatIds: string[], userId: string) => {
  const response = await apiClient.post(`/api/v1/catalog/screenings/${screeningId}/lock-seats`, {
    seat_ids: seatIds,
    user_id: userId,
  });
  return response.data;
};

export const unlockScreeningSeats = async (screeningId: string, userId: string) => {
  const response = await apiClient.delete(`/api/v1/catalog/screenings/${screeningId}/lock-seats`, {
    params: { user_id: userId },
  });
  return response.data;
};

export const processScreeningPurchase = async (
  screeningId: string,
  seatIds: string[],
  method: string,
  userId: string,
  total: number,
  seatLabels: string[]
) => {
  const response = await apiClient.post(`/api/v1/catalog/screenings/${screeningId}/purchase`, {
    seat_ids: seatIds,
    payment_method: method,
    user_id: userId,
    invoice_total: total,
    seat_labels: seatLabels,
  });
  return response.data;
};

export type OrderTicket = components['schemas']['OrderTicket'];
export type OrderHistoryItem = components['schemas']['OrderHistoryItem'];

export const fetchMyOrders = async (userId: string): Promise<OrderHistoryItem[]> => {
  const response = await apiClient.get<{ orders: OrderHistoryItem[] }>(`/api/v1/catalog/me/orders?user_id=${userId}`);
  return response.data.orders;
};

export interface Review {
  id: string;
  user_id: string;
  user_name: string;
  score: number;
  text: string;
  date: string;
}

export interface ReviewsResponse {
  stats: {
    avg_score: number;
    total_ratings: number;
    positive: number;
    neutral: number;
    negative: number;
  };
  reviews: Review[];
}

export const fetchMovieReviews = async (movieId: string): Promise<ReviewsResponse> => {
  const response = await apiClient.get<ReviewsResponse>(`/api/v1/ugc/movies/${movieId}/reviews`);
  return response.data;
};

export const submitMovieRating = async (movieId: string, userId: string, userName: string, score: number) => {
  const response = await apiClient.post(`/api/v1/ugc/movies/${movieId}/rate`, {
    user_id: userId,
    user_name: userName,
    score,
  });
  return response.data;
};

export const submitMovieReview = async (movieId: string, userId: string, userName: string, text: string) => {
  const response = await apiClient.post(`/api/v1/ugc/movies/${movieId}/review`, {
    user_id: userId,
    user_name: userName,
    text,
  });
  return response.data;
};

export interface WatchlistItem {
  id: string;
  movie_id: string;
  movie_title: string;
  poster_url: string;
  added_at: string;
}

export interface ActivityItem {
  id: string;
  type: 'rating' | 'review' | 'watchlist' | 'purchase';
  movie_id: string;
  title: string;
  description: string;
  date: string;
}

export const fetchWatchlistStatus = async (movieId: string, userId: string) => {
  const response = await apiClient.get(`/api/v1/ugc/movies/${movieId}/watchlist-status`, {
    params: { user_id: userId },
  });
  return response.data.is_added;
};

export const toggleWatchlist = async (movieId: string, userId: string, movieTitle: string, posterUrl: string) => {
  const response = await apiClient.post(`/api/v1/ugc/movies/${movieId}/watchlist`, {
    user_id: userId,
    movie_title: movieTitle,
    poster_url: posterUrl,
  });
  return response.data.is_added;
};

export const fetchWatchlist = async (userId: string): Promise<WatchlistItem[]> => {
  const response = await apiClient.get(`/api/v1/ugc/users/${userId}/watchlist`);
  return response.data;
};

export const fetchActivityHistory = async (userId: string): Promise<ActivityItem[]> => {
  const response = await apiClient.get(`/api/v1/ugc/users/${userId}/activity`);
  return response.data;
};

export interface RecommendationItem {
  id: string;
  title: string;
  poster_url: string;
  reason: string;
}

export interface RecommendationResponse {
  is_personalized: boolean;
  title: string;
  subtitle: string;
  items: RecommendationItem[];
}

export const fetchRecommendations = async (userId?: string): Promise<RecommendationResponse> => {
  const params = userId ? { user_id: userId } : {};
  const response = await apiClient.get<RecommendationResponse>('/api/v1/recommendations/', { params });
  return response.data;
};

export const markNotInterested = async (movieId: string, userId: string) => {
  const response = await apiClient.post(`/api/v1/ugc/movies/${movieId}/not-interested`, { user_id: userId });
  return response.data;
};

import { apiClient } from '../../shared/api/apiClient';

export interface Movie {
  id: string;
  title: string;
  synopsis: string;
  genres: string[];
  director: string;
  duration_minutes: number;
  rating_classification: string;
  release_date: string;
  poster_url: string;
  trailer_url: string;
}

export interface CatalogResponse {
  items: Movie[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Screening {
  id: string;
  start_time: string;
  room: string;
  format: string;
  language: string;
}

export interface MovieDetail extends Movie {
  screenings: Screening[];
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
}

export interface Seat {
  id: string;
  row: string;
  col: number;
  type: 'normal' | 'vip' | 'wheelchair' | 'corridor';
  status: 'available' | 'locked' | 'locked_by_me' | 'sold'; 
}

export interface ScreeningSeatsResponse {
  movie: {
    id: string;
    title: string;
    poster_url: string;
    duration_minutes: number;
    rating_classification: string;
  };
  screening: {
    id: string;
    start_time: string;
    room_name: string;
  };
  ticket_types: TicketType[];
  seats: Seat[];
  active_lock_ttl?: number;
}

export interface MovieScreeningsResponse {
  movie: {
    id: string;
    title: string;
    duration_minutes: number;
    rating_classification: string;
    poster_url: string;
  };
  screenings: Screening[];
  ticket_types: TicketType[];
}

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
    const response = await apiClient.get<{genres: string[]}>('/api/v1/catalog/genres');
    return response.data.genres;
  } catch (error) {
    console.error("Error cargando géneros dinámicos:", error);
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
  const response = await apiClient.get<ScreeningSeatsResponse>(`/api/v1/catalog/screenings/${screeningId}/seats`, { params });
  return response.data;
};

export const lockScreeningSeats = async (screeningId: string, seatIds: string[], userId: string) => {
  const response = await apiClient.post(`/api/v1/catalog/screenings/${screeningId}/lock-seats`, {
    seat_ids: seatIds,
    user_id: userId 
  });
  return response.data;
};

export const unlockScreeningSeats = async (screeningId: string, userId: string) => {
  const response = await apiClient.delete(`/api/v1/catalog/screenings/${screeningId}/lock-seats`, {
    params: { user_id: userId }
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
    seat_labels: seatLabels
  });
  return response.data;
};

export interface OrderTicket {
  seat_id: string;
  qr_code: string;
}

export interface OrderHistoryItem {
  id: string;
  movie_title: string;
  poster_url: string;
  room_name: string;
  start_time: string;
  seat_labels: string[];
  total_price: number;
  status: string;
  created_at: string;
  tickets: OrderTicket[];
}

export const fetchMyOrders = async (userId: string): Promise<OrderHistoryItem[]> => {
  const response = await apiClient.get<{orders: OrderHistoryItem[]}>(`/api/v1/catalog/me/orders?user_id=${userId}`);
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
    score
  });
  return response.data;
};

export const submitMovieReview = async (movieId: string, userId: string, userName: string, text: string) => {
  const response = await apiClient.post(`/api/v1/ugc/movies/${movieId}/review`, {
    user_id: userId,
    user_name: userName,
    text
  });
  return response.data;
};
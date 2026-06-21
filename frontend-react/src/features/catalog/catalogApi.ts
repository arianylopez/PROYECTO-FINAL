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
  status: 'available' | 'locked' | 'sold';
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

export const fetchScreeningSeats = async (screeningId: string): Promise<ScreeningSeatsResponse> => {
  const response = await apiClient.get<ScreeningSeatsResponse>(`/api/v1/catalog/screenings/${screeningId}/seats`);
  return response.data; 
};

export const lockScreeningSeats = async (screeningId: string, seatIds: string[]) => {
  const response = await apiClient.post(`/api/v1/catalog/screenings/${screeningId}/lock-seats`, {
    seat_ids: seatIds
  });
  return response.data;
};
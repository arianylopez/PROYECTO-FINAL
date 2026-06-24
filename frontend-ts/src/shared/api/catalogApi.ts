import { apiClient } from './apiClient';
import type { components } from './schema';

export type Movie = components['schemas']['MovieResponse'];
export type CatalogResponse = components['schemas']['CatalogResponse'];
export type GenreResponse = components['schemas']['GenreResponse'];
export type MovieDetail = components['schemas']['MovieDetailResponse'];

export const catalogApi = {
  getMovies: async (page = 1, size = 12): Promise<Movie[]> => {
    const response = await apiClient.get<CatalogResponse>(`/catalog/movies?page=${page}&size=${size}`);
    return response.data.items;
  },
  getFeatured: async (): Promise<Movie> => {
    const response = await apiClient.get<CatalogResponse>(`/catalog/movies?page=1&size=1`);
    return response.data.items[0];
  },
  getGenres: async (): Promise<GenreResponse> => {
    const response = await apiClient.get<GenreResponse>('/catalog/genres');
    return response.data;
  },
  getMovieById: async (id: string): Promise<MovieDetail> => {
    const response = await apiClient.get<MovieDetail>(`/catalog/movies/${id}`);
    return response.data;
  }
};
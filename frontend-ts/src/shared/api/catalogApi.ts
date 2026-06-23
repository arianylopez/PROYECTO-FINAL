import { apiClient } from './apiClient';

export const catalogApi = {
  getMovies: async (page = 1, size = 12) => {
    const response = await apiClient.get(`/catalog/movies?page=${page}&size=${size}`);
    return response.data.items || response.data.results || response.data.data || response.data;
  },
  getFeatured: async () => {
    const response = await apiClient.get(`/catalog/movies?page=1&size=1`);
    const movies = response.data.items || response.data.results || response.data.data || response.data;
    return movies[0];
  },
  getGenres: async () => {
    const response = await apiClient.get('/catalog/genres');
    return response.data;
  },
  getMovieById: async (id: string) => {
    const response = await apiClient.get(`/catalog/movies/${id}`);
    return response.data;
  }
};
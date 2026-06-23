import { apiClient } from './apiClient';

export const ugcApi = {
  getReviews: async (movieId: string) => {
    const response = await apiClient.get(`/ugc/movies/${movieId}/reviews`);
    return response.data;
  }
};
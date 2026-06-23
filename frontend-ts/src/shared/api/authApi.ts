import { apiClient } from './apiClient';

export const authApi = {
  getMe: async () => {
    const response = await apiClient.get('/auth/users/me');
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }
};
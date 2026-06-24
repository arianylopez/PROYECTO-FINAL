import { apiClient } from './apiClient';

export const authApi = {
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  login: async (payload: any) => {
    const response = await apiClient.post('/auth/login', payload);
    return response.data;
  },
  register: async (payload: any) => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },
  loginWithGoogle: async (payload: any) => {
    const response = await apiClient.post('/auth/google', payload);
    return response.data;
  },
  revokeDevice: async (deviceId: string) => {
    const response = await apiClient.post(`/auth/devices/${deviceId}/revoke`);
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (payload: any) => {
    const response = await apiClient.post('/auth/reset-password', payload);
    return response.data;
  }
};
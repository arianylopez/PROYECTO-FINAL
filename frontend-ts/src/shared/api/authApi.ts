import { apiClient } from './apiClient';
import type { components } from './schema';

export type LoginRequest = components['schemas']['LoginRequest'];
export type LoginResponse = components['schemas']['LoginResponse'];
export type UserRegisterRequest = components['schemas']['UserRegisterRequest'];
export type RegisterResponse = components['schemas']['RegisterResponse'];
export type GoogleLoginRequest = components['schemas']['GoogleLoginRequest'];
export type PasswordResetRequest = components['schemas']['PasswordResetRequest'];
export type PasswordResetConfirm = components['schemas']['PasswordResetConfirm'];
export type MessageResponse = components['schemas']['MessageResponse'];

export const authApi = {
  logout: async (): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/logout');
    return response.data;
  },
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', payload);
    return response.data;
  },
  register: async (payload: UserRegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', payload);
    return response.data;
  },
  loginWithGoogle: async (payload: GoogleLoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/google', payload);
    return response.data;
  },
  revokeDevice: async (deviceId: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/auth/devices/${deviceId}/revoke`);
    return response.data;
  },
  forgotPassword: async (email: string): Promise<any> => {
    const response = await apiClient.post('/auth/password-reset-request', { email });
    return response.data;
  },
  resetPassword: async (payload: PasswordResetConfirm): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/password-reset', payload);
    return response.data;
  }
};
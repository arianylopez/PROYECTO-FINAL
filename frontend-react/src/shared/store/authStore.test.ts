import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  });

  it('should initialize with default values', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should login user and update state and localStorage', () => {
    const user = { id: '1', name: 'Test', email: 'test@test.com', role: 'user' };
    const token = 'fake-jwt-token';

    useAuthStore.getState().login(user, token);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe(token);
    expect(state.isAuthenticated).toBe(true);

    expect(localStorage.getItem('accessToken')).toBe(token);
    expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual(user);
  });

  it('should logout user and clear state and localStorage', () => {
    const user = { id: '1', name: 'Test', email: 'test@test.com', role: 'user' };
    const token = 'fake-jwt-token';
    useAuthStore.getState().login(user, token);

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should update token', () => {
    useAuthStore.getState().updateToken('new-token');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-token');
    expect(localStorage.getItem('accessToken')).toBe('new-token');
  });
});

import { EventBus } from '../lib/block/EventBus';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

class AuthStore extends EventBus {
  private state: AuthState;

  constructor() {
    super();
    this.state = {
      user: JSON.parse(localStorage.getItem('user') || 'null'),
      accessToken: localStorage.getItem('accessToken') || null,
      isAuthenticated: !!localStorage.getItem('accessToken'),
    };
  }

  public getState() {
    return this.state;
  }

  public login(user: User, token: string) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.state = { user, accessToken: token, isAuthenticated: true };
    this.emit('changed', this.state);
  }

  public logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    this.state = { user: null, accessToken: null, isAuthenticated: false };
    this.emit('changed', this.state);
  }

  public updateToken(token: string) {
    localStorage.setItem('accessToken', token);
    this.state.accessToken = token;
    this.emit('changed', this.state);
  }
}

export const authStore = new AuthStore();

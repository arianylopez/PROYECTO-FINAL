import Block from '../../shared/lib/block/Block';
import template from './Header.hbs?raw';
import './Header.css';
import { routerInstance } from '../../shared/lib/router/Router';
import { authApi } from '../../shared/api/authApi';

import { authStore } from '../../shared/store/authStore';

export class Header extends Block {
  protected template = template;

  constructor() {
    super({ isAuthenticated: false, user: null });
  }

  protected componentDidMount() {
    const state = authStore.getState();
    this.setProps({ isAuthenticated: state.isAuthenticated, user: state.user });
    
    // Opcional: escuchar cambios en el authStore si el usuario se desloguea desde otra pestaña
    authStore.on('changed', (newState: any) => {
      this.setProps({ isAuthenticated: newState.isAuthenticated, user: newState.user });
    });
  }

  protected events = {
    click: async (e: Event) => {
      const target = e.target as HTMLElement;
      
      if (target.id === 'nav-logo' || target.id === 'nav-catalog') {
        routerInstance.go('/home');
      }
      
      if (target.id === 'nav-login') {
        routerInstance.go('/login');
      }

      if (target.id === 'nav-register') {
        routerInstance.go('/register');
      }

      if (target.id === 'nav-history') {
        routerInstance.go('/history');
      }

      if (target.id === 'nav-logout') {
        try {
          await authApi.logout();
          this.setProps({ isAuthenticated: false, user: null });
          routerInstance.go('/home');
        } catch (error) {
          this.setProps({ isAuthenticated: false, user: null });
        }
      }
    },
  };
}
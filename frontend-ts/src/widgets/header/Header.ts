import Block from '../../shared/lib/block/Block';
import template from './Header.hbs?raw';
import './Header.css';
import { routerInstance } from '../../shared/lib/router/Router';
import { authApi } from '../../shared/api/authApi';

export class Header extends Block {
  protected template = template;

  constructor() {
    super({ isAuthenticated: false, user: null });
  }

  protected async componentDidMount() {
    try {
      const user = await authApi.getMe();
      this.setProps({ isAuthenticated: true, user });
    } catch (error) {
      this.setProps({ isAuthenticated: false, user: null });
    }
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
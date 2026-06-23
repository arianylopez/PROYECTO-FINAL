import Block from '../../shared/lib/block/Block';
import template from './Header.hbs?raw';
import './Header.css';
import { routerInstance } from '../../shared/lib/router/Router';

export class Header extends Block {
  protected template = template;

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;
      
      if (target.id === 'logo-home' || target.id === 'nav-home') {
        routerInstance.go('/home');
      }
      
      if (target.id === 'nav-login') {
        routerInstance.go('/login');
      }
    },
  };
}
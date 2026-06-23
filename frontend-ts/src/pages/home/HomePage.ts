import Block from '../../shared/lib/block/Block';
import template from './HomePage.hbs?raw';
import { routerInstance } from '../../shared/lib/router/Router';

export class HomePage extends Block {
  protected template = template;

  protected events = {
    click: (e: Event) => {
      if ((e.target as HTMLElement).id === 'go-login') {
        routerInstance.go('/login');
      }
    },
  };
}
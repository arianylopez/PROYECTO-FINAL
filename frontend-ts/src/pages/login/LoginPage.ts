import Block from '../../shared/lib/block/Block';
import template from './LoginPage.hbs?raw';
import { routerInstance } from '../../shared/lib/router/Router';

export class LoginPage extends Block {
  protected template = template;

  protected events = {
    click: (e: Event) => {
      if ((e.target as HTMLElement).id === 'go-home') {
        routerInstance.go('/home');
      }
    },
  };
}
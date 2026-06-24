import { Route } from './Route';
import { authStore } from '../../store/authStore';

export class Router {
  private routes: Route[] = [];
  private history: History = window.history;
  private _currentRoute: Route | null = null;
  private _rootQuery: string = '#app';
  private static __instance: Router;

  constructor(rootQuery: string = '#app') {
    if (Router.__instance) {
      return Router.__instance;
    }
    this.routes = [];
    this.history = window.history;
    this._currentRoute = null;
    this._rootQuery = rootQuery;
    Router.__instance = this;
  }

  use(pathname: string, blockClass: any, meta: { requireAuth?: boolean; requireGuest?: boolean; isDynamic?: boolean } = {}) {
    const route = new Route(pathname, blockClass, { rootQuery: this._rootQuery, ...meta });
    this.routes.push(route);
    return this;
  }

  start() {
    window.onpopstate = (event: PopStateEvent) => {
      this._onRoute((event.currentTarget as Window).location.pathname);
    };
    this._onRoute(window.location.pathname);
  }

  private async _onRoute(fullPath: string) {
    const pathname = fullPath.split('?')[0];
    const route = this.getRoute(pathname);
    if (!route) {
      return;
    }

    const { requireAuth, requireGuest } = route.getProps();
    const state = authStore.getState();

    if (requireAuth && !state.isAuthenticated) {
      this.go('/login');
      return;
    }
    
    if (requireGuest && state.isAuthenticated) {
      this.go('/home');
      return;
    }

    if (this._currentRoute && this._currentRoute !== route) {
      this._currentRoute.leave();
    }
    this._currentRoute = route;
    await route.render();
    window.scrollTo(0, 0);
  }

  go(pathname: string) {
    this.history.pushState({}, '', pathname);
    this._onRoute(pathname);
  }

  back() {
    this.history.back();
  }

  forward() {
    this.history.forward();
  }

  private getRoute(pathname: string) {
    return this.routes.find((route) => route.match(pathname));
  }
}

export const routerInstance = new Router('#app');
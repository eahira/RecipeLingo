export class Router {
  constructor(routes, fallback) {
    this.routes = routes;
    this.fallback = fallback;
  }

  start() {
    window.addEventListener('hashchange', () => this.handleRoute());

    if (!window.location.hash) {
      window.location.hash = '#/';
      return;
    }

    this.handleRoute();
  }

  handleRoute() {
    const currentRoute = window.location.hash || '#/';
    const route = this.routes.find((item) => item.path === currentRoute);

    if (route) {
      route.handler();
      return;
    }

    this.fallback();
  }
}


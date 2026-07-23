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

    const dynamicRoute = this.routes.find((item) => item.path.includes(':'));

    if (dynamicRoute) {
      const routeParts = dynamicRoute.path.split('/');
      const currentParts = currentRoute.split('/');

      if (routeParts.length === currentParts.length) {
        const params = {};
        const matches = routeParts.every((part, index) => {
          if (part.startsWith(':')) {
            params[part.slice(1)] = currentParts[index];
            return true;
          }

          return part === currentParts[index];
        });

        if (matches) {
          dynamicRoute.handler(params);
          return;
        }
      }
    }

    this.fallback();
  }
}

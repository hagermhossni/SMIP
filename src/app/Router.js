/**
 * Router
 * ----------------------------------------------------------------------
 * A minimal hash-based router. No external dependency is needed for
 * three flat routes, so this stays intentionally small. If SMIP later
 * needs nested routes or URL parameters, this is the file to extend
 * (or the seam to swap in a library router).
 *
 * Each route maps to a factory function that returns a "module"
 * instance: an object with mount(container) and unmount() methods.
 * The router guarantees the previous module's unmount() runs before
 * the next module's mount(), so 3D scenes/resources are always
 * cleaned up on navigation.
 */
export class Router {
  /**
   * @param {Object.<string, () => {mount: Function, unmount: Function}>} routes
   *   Map of route key (e.g. 'dynamics') to a factory creating that module.
   * @param {HTMLElement} outlet - container the active module is mounted into
   * @param {string} defaultRoute - route key used when the hash is empty/unknown
   */
  constructor(routes, outlet, defaultRoute) {
    this.routes = routes;
    this.outlet = outlet;
    this.defaultRoute = defaultRoute;
    this.currentModule = null;
    this.currentRoute = null;

    this._onHashChange = this._onHashChange.bind(this);
    window.addEventListener('hashchange', this._onHashChange);
  }

  /** Reads the current URL hash and mounts the matching module. */
  start() {
    this._onHashChange();
  }

  /** Programmatic navigation, e.g. from nav bar clicks. */
  navigate(routeKey) {
    window.location.hash = `#/${routeKey}`;
  }

  /**
   * Synchronous variant of navigate(): activates the route immediately
   * instead of waiting on the browser's asynchronous 'hashchange' event,
   * for callers (the Guided Tour) that need the new module mounted
   * before their very next line of code runs. Still updates the URL
   * hash to match, so back/forward and normal navigate() calls stay
   * consistent - the 'hashchange' handler's own _activate() call is a
   * harmless no-op afterward, since _activate() already early-returns
   * once the route hasn't changed.
   */
  navigateNow(routeKey) {
    if (!this.routes[routeKey]) return;
    window.location.hash = `#/${routeKey}`;
    this._activate(routeKey);
  }

  /**
   * Tears this Router instance down: removes its 'hashchange' listener
   * and unmounts whatever module is currently active. Needed because
   * the language switcher rebuilds the whole app (see main.js) - without
   * this, the previous Router would keep listening for hash changes and
   * its old module (e.g. a DynamicsModule with a running render loop)
   * would keep running invisibly after being replaced.
   */
  dispose() {
    window.removeEventListener('hashchange', this._onHashChange);
    if (this.currentModule) {
      this.currentModule.unmount();
      this.currentModule = null;
    }
  }

  _onHashChange() {
    const key = window.location.hash.replace(/^#\//, '') || this.defaultRoute;
    const routeKey = this.routes[key] ? key : this.defaultRoute;
    this._activate(routeKey);
  }

  _activate(routeKey) {
    if (routeKey === this.currentRoute) return;

    if (this.currentModule) {
      this.currentModule.unmount();
      this.outlet.innerHTML = '';
    }

    const factory = this.routes[routeKey];
    this.currentModule = factory();
    this.currentModule.mount(this.outlet);
    this.currentRoute = routeKey;

    if (this.onRouteChange) this.onRouteChange(routeKey);
  }
}

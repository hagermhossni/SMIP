/**
 * Navigation
 * ----------------------------------------------------------------------
 * Renders the top-level section tabs (Spatial Dynamics / Spatial Geometry
 * / Problem Library) and tells the Router to navigate when clicked.
 * Highlights the active tab based on the router's current route.
 */
export class Navigation {
  /**
   * @param {Array<{key: string, label: string}>} items
   * @param {Router} router
   */
  constructor(items, router) {
    this.items = items;
    this.router = router;

    this.el = document.createElement('nav');
    this.el.className = 'app-nav';
    this._render();

    router.onRouteChange = (activeKey) => this._setActive(activeKey);
  }

  _render() {
    this.buttons = {};

    this.items.forEach(({ key, label }) => {
      const btn = document.createElement('button');
      btn.className = 'app-nav__link';
      btn.type = 'button';
      btn.textContent = label;
      btn.addEventListener('click', () => this.router.navigate(key));

      this.buttons[key] = btn;
      this.el.appendChild(btn);
    });
  }

  _setActive(activeKey) {
    Object.entries(this.buttons).forEach(([key, btn]) => {
      btn.classList.toggle('is-active', key === activeKey);
    });
  }
}

import { Navigation } from './Navigation.js';

/**
 * AppShell
 * ----------------------------------------------------------------------
 * Builds the persistent page frame: header + navigation + a main content
 * region ("outlet") that the Router swaps module views into. This is the
 * only place that touches the top-level #app element directly.
 */
export class AppShell {
  /**
   * @param {HTMLElement} rootEl - the #app element from index.html
   * @param {Array<{key: string, label: string}>} navItems
   * @param {Router} router
   */
  constructor(rootEl, navItems, router) {
    this.root = rootEl;
    this.root.innerHTML = '';
    this.root.classList.add('app-shell');

    this._buildHeader();
    this.navigation = new Navigation(navItems, router);
    this.root.appendChild(this.navigation.el);

    this.outlet = document.createElement('main');
    this.outlet.className = 'app-main';
    this.root.appendChild(this.outlet);
  }

  _buildHeader() {
    const header = document.createElement('header');
    header.className = 'app-header';

    const title = document.createElement('span');
    title.className = 'app-header__title';
    title.textContent = 'SMIP';

    const tagline = document.createElement('span');
    tagline.className = 'app-header__tagline';
    tagline.textContent = 'Spatial Mathematics Interactive Platform';

    header.append(title, tagline);
    this.root.appendChild(header);
  }
}

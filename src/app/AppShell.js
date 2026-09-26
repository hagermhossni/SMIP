import { Navigation } from './Navigation.js';
import { t, getLanguage } from '../i18n/i18n.js';
import { getTheme, setTheme } from '../theme/theme.js';

/**
 * AppShell
 * ----------------------------------------------------------------------
 * Builds the persistent page frame: header + navigation + a main content
 * region ("outlet") that the Router swaps module views into. This is the
 * only place that touches the top-level #app element directly.
 *
 * The whole shell is rebuilt from scratch whenever the language changes
 * (see main.js), so every piece of text here is read from the i18n
 * dictionary at construction time rather than cached.
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
    tagline.textContent = t('appTagline');

    this.tourButtonEl = document.createElement('button');
    this.tourButtonEl.type = 'button';
    this.tourButtonEl.className = 'app-header__tour-btn';
    this.tourButtonEl.textContent = t('tourButton');
    // Click handling for both buttons below is wired up externally (see
    // main.js), so AppShell itself stays unaware of the Guided Tour /
    // language-switching logic - this file only builds the page frame.

    const languageWrap = this._buildLanguageSwitcher();
    const themeBtn = this._buildThemeToggle();

    header.append(title, tagline, this.tourButtonEl, languageWrap, themeBtn);
    this.root.appendChild(header);
  }

  _buildThemeToggle() {
    this.themeButtonEl = document.createElement('button');
    this.themeButtonEl.type = 'button';
    this.themeButtonEl.className = 'app-header__theme-btn';
    this._updateThemeButtonLabel();

    // Fully self-contained (unlike the tour/language buttons above):
    // switching theme is pure CSS - see theme.js - so there's no Router
    // or Guided Tour state to coordinate with, and no rebuild needed.
    this.themeButtonEl.addEventListener('click', () => {
      setTheme(getTheme() === 'light' ? 'dark' : 'light');
      this._updateThemeButtonLabel();
    });

    return this.themeButtonEl;
  }

  /** Label always names the mode a click switches *to*, matching the two labels from the feature request. */
  _updateThemeButtonLabel() {
    this.themeButtonEl.textContent = getTheme() === 'light' ? t('themeSwitchToDark') : t('themeSwitchToLight');
  }

  _buildLanguageSwitcher() {
    const wrap = document.createElement('div');
    wrap.className = 'app-header__lang';

    this.languageButtonEl = document.createElement('button');
    this.languageButtonEl.type = 'button';
    this.languageButtonEl.className = 'app-header__lang-btn';
    this.languageButtonEl.textContent = t('languageButton');

    const menu = document.createElement('div');
    menu.className = 'app-header__lang-menu';
    this.languageMenuEl = menu;

    const currentLang = getLanguage();
    const makeOption = (lang, label) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'app-header__lang-option';
      if (lang === currentLang) btn.classList.add('is-active');
      btn.textContent = label;
      menu.appendChild(btn);
      return btn;
    };

    // Exposed so main.js can attach the actual language-switching
    // behavior, matching the tourButtonEl pattern above.
    this.languageOptionButtons = {
      en: makeOption('en', t('langEnglish')),
      ar: makeOption('ar', t('langArabic')),
    };

    this.languageButtonEl.addEventListener('click', () => {
      menu.classList.toggle('is-open');
    });

    this._onDocumentClick = (event) => {
      if (!wrap.contains(event.target)) {
        menu.classList.remove('is-open');
      }
    };
    document.addEventListener('click', this._onDocumentClick);

    wrap.append(this.languageButtonEl, menu);
    return wrap;
  }

  /** Removes the document-level listener above; called before a rebuild (see main.js). */
  dispose() {
    if (this._onDocumentClick) {
      document.removeEventListener('click', this._onDocumentClick);
      this._onDocumentClick = null;
    }
  }
}

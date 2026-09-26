import { createTourSteps } from './tourSteps.js';
import { isTourDismissed, setTourDismissed } from './tourStorage.js';
import { t, isRTL } from '../i18n/i18n.js';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * GuidedTour
 * ----------------------------------------------------------------------
 * A self-contained, additive feature: an interactive walkthrough of the
 * existing SMIP interface. It never modifies what any highlighted
 * element does - it only (a) draws a dimmed overlay + spotlight ring +
 * tooltip on top of the page, and (b) drives the *real* nav tabs/
 * buttons (via .click()) and the Router's navigateNow() to bring the
 * right part of the existing UI into view before highlighting it.
 *
 * Lifecycle: start() builds its DOM (once) and shows step 0. Back/Next
 * move between steps; each step's optional `prepare(tour)` (see
 * tourSteps.js) re-derives the exact view it needs from whatever is
 * currently on screen, so Back/Next work correctly in either direction.
 * Skip/close/finish tear the DOM back down; nothing about the app is
 * left mounted differently by the tour ever having run.
 */
export class GuidedTour {
  /** @param {{router: import('../app/Router.js').Router}} config */
  constructor({ router }) {
    this.router = router;
    this.steps = createTourSteps();
    this.stepIndex = 0;
    this._built = false;

    // Which step indices count toward "Step X of N" (welcome/final are
    // bookends, not counted steps).
    this._contentIndexes = this.steps
      .map((s, i) => i)
      .filter((i) => this.steps[i].type === 'spotlight' || this.steps[i].type === 'intro');

    this._onReposition = this._onReposition.bind(this);
  }

  // ==================== public API ====================

  /** @param {{force?: boolean}} [options] - force=true always shows, ignoring "Don't show this again" */
  start({ force = false } = {}) {
    if (!force && isTourDismissed()) return;
    this.stepIndex = 0;
    this._ensureDom();
    this._renderStep();
  }

  // ==================== navigation helpers used by tourSteps.js ====================

  /** @param {'dynamics'|'geometry'|'problems'} routeKey */
  goToRoute(routeKey) {
    if (this.router.currentRoute !== routeKey) {
      this.router.navigateNow(routeKey);
    }
  }

  /** Drives the real Problem Library back to its category-cards home screen. */
  goToProblemLibraryHome(maxSteps = 4) {
    for (let i = 0; i < maxSteps; i++) {
      if (document.querySelector('[data-tour="problem-categories"]')) return;
      const back = document.querySelector('.problem-form__back');
      if (back) {
        back.click();
        continue;
      }
      break;
    }
  }

  /** Drives the real Problem Library to a category's question-list view (via the first category card). */
  goToProblemLibraryCategory() {
    this.goToProblemLibraryHome();
    const card = document.querySelector('.problem-library__category-card');
    if (card) card.click();
  }

  /** Drives the real Problem Library to the Add Problem form. */
  goToProblemLibraryAddForm() {
    if (document.querySelector('[data-tour="problem-add-title"]')) return;
    this.goToProblemLibraryCategory();
    const addBtn = document.querySelector('[data-tour="problem-add-btn"]');
    if (addBtn) addBtn.click();
  }

  /** Closes the tour if open and removes all of its DOM/listeners. Safe to call even if it was never started. */
  destroy() {
    this._teardown();
  }

  // ==================== step flow ====================

  _next() {
    if (this.stepIndex < this.steps.length - 1) {
      this.stepIndex += 1;
      this._renderStep();
    }
  }

  _back() {
    if (this.stepIndex > 0) {
      this.stepIndex -= 1;
      this._renderStep();
    }
  }

  _skip() {
    this._teardown();
  }

  _finish(dontShowAgainChecked) {
    setTourDismissed(!!dontShowAgainChecked);
    this._teardown();
  }

  _renderStep() {
    const step = this.steps[this.stepIndex];
    if (step.prepare) step.prepare(this);

    this._clearCard();
    if (step.type === 'welcome') this._renderWelcome();
    else if (step.type === 'final') this._renderFinal();
    else if (step.type === 'intro') this._renderIntro(step);
    else if (step.type === 'spotlight') this._renderSpotlight(step);

    this._layoutForStep(step);
  }

  // ==================== card content per step type ====================

  _renderWelcome() {
    const title = document.createElement('h2');
    title.className = 'guided-tour__title';
    title.textContent = t('tourWelcomeTitle');

    const text = document.createElement('p');
    text.className = 'guided-tour__text';
    text.textContent = t('tourWelcomeText');

    const buttons = document.createElement('div');
    buttons.className = 'guided-tour__buttons';
    const startBtn = this._button(t('tourStartBtn'), 'guided-tour__btn--primary', () => this._next());
    const skipBtn = this._button(t('tourSkipBtn'), 'guided-tour__btn--ghost', () => this._skip());
    buttons.append(skipBtn, startBtn);

    this.cardEl.append(this._closeButton(), title, text, buttons);
  }

  _renderFinal() {
    const title = document.createElement('h2');
    title.className = 'guided-tour__title';
    title.textContent = t('tourFinalTitle');

    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = 'guided-tour__checkbox';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const checkboxText = document.createElement('span');
    checkboxText.textContent = t('tourDontShowAgain');
    checkboxLabel.append(checkbox, checkboxText);

    const buttons = document.createElement('div');
    buttons.className = 'guided-tour__buttons';
    const backBtn = this._button(t('tourBackBtn'), 'guided-tour__btn--ghost', () => this._back());
    const finishBtn = this._button(t('tourStartExploringBtn'), 'guided-tour__btn--primary', () =>
      this._finish(checkbox.checked)
    );
    buttons.append(backBtn, finishBtn);

    this.cardEl.append(this._closeButton(), title, checkboxLabel, buttons);
  }

  _renderIntro(step) {
    this.cardEl.append(this._closeButton(), this._stepCounter(), ...this._titledTextAndNav(step));
  }

  _renderSpotlight(step) {
    this.cardEl.append(this._closeButton(), this._stepCounter(), ...this._titledTextAndNav(step));
  }

  /** Shared body for 'intro' and 'spotlight' steps: optional title, text, Back/Next/Skip. */
  _titledTextAndNav(step) {
    const nodes = [];
    if (step.title) {
      const title = document.createElement('h3');
      title.className = 'guided-tour__title guided-tour__title--small';
      title.textContent = step.title;
      nodes.push(title);
    }

    const text = document.createElement('p');
    text.className = 'guided-tour__text';
    text.textContent = step.text;
    nodes.push(text);

    const buttons = document.createElement('div');
    buttons.className = 'guided-tour__buttons';
    const backBtn = this._button(t('tourBackBtn'), 'guided-tour__btn--ghost', () => this._back());
    backBtn.disabled = this.stepIndex === 0;
    const skipBtn = this._button(t('tourSkipTourBtn'), 'guided-tour__btn--ghost', () => this._skip());
    const nextBtn = this._button(t('tourNextBtn'), 'guided-tour__btn--primary', () => this._next());
    buttons.append(backBtn, skipBtn, nextBtn);
    nodes.push(buttons);

    return nodes;
  }

  _stepCounter() {
    const el = document.createElement('div');
    el.className = 'guided-tour__counter';
    const position = this._contentIndexes.indexOf(this.stepIndex) + 1;
    el.textContent = t('tourStepCounter', { n: position, total: this._contentIndexes.length });
    return el;
  }

  _closeButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'guided-tour__close';
    btn.setAttribute('aria-label', t('tourCloseAria'));
    btn.textContent = '\u00D7';
    btn.addEventListener('click', () => this._skip());
    return btn;
  }

  _button(label, variant, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `guided-tour__btn ${variant}`;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  // ==================== layout: spotlight + tooltip positioning ====================

  _layoutForStep(step) {
    if (step.type === 'spotlight') {
      const selectors = step.targets || [step.target];
      const els = selectors.map((sel) => document.querySelector(sel)).filter(Boolean);
      if (els.length === 0) {
        this._hideSpotlight();
        this._positionCardCentered();
        return;
      }
      els.forEach((el) => this._ensureExpanded(el));
      els[0].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const rects = els.map((el) => el.getBoundingClientRect());
      const rect = this._unionRect(rects);
      this._showSpotlight(rect);
      this._positionCardNear(rect);
    } else {
      this._hideSpotlight();
      this._positionCardCentered();
    }
  }

  /**
   * Opens any collapsed sidebar section / derivation panel that `el`
   * lives inside, by clicking its own existing header toggle button -
   * the exact same action a user's click would perform, so nothing
   * about that collapse/expand behavior changes.
   */
  _ensureExpanded(el) {
    let node = el;
    while (node && node !== document.body) {
      if (
        node.classList &&
        (node.classList.contains('sidebar-section') || node.classList.contains('derivation-panel')) &&
        !node.classList.contains('is-open')
      ) {
        const header = node.querySelector(':scope > button');
        if (header) header.click();
      }
      node = node.parentElement;
    }
  }

  _unionRect(rects) {
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  _showSpotlight(rect) {
    const pad = 6;
    const left = Math.max(rect.left - pad, 0);
    const top = Math.max(rect.top - pad, 0);
    const width = rect.width + pad * 2;
    const height = rect.height + pad * 2;

    this.spotlightEl.style.display = 'block';
    this.spotlightEl.style.left = `${left}px`;
    this.spotlightEl.style.top = `${top}px`;
    this.spotlightEl.style.width = `${width}px`;
    this.spotlightEl.style.height = `${height}px`;
    this.blockerEl.style.background = 'transparent';
    this._lastRect = rect;
  }

  _hideSpotlight() {
    this.spotlightEl.style.display = 'none';
    this.blockerEl.style.background = 'rgba(13, 17, 23, 0.75)';
    this._lastRect = null;
  }

  _positionCardNear(rect) {
    const card = this.cardEl;
    card.classList.remove('is-modal');
    card.classList.add('is-anchored');
    card.style.transform = 'none';

    const margin = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card.offsetWidth || 320;
    const ch = card.offsetHeight || 160;

    let left;
    let top;
    if (rect.right + margin + cw <= vw) {
      left = rect.right + margin;
      top = clamp(rect.top, margin, Math.max(margin, vh - ch - margin));
    } else if (rect.left - margin - cw >= 0) {
      left = rect.left - margin - cw;
      top = clamp(rect.top, margin, Math.max(margin, vh - ch - margin));
    } else if (rect.bottom + margin + ch <= vh) {
      left = clamp(rect.left, margin, Math.max(margin, vw - cw - margin));
      top = rect.bottom + margin;
    } else {
      left = clamp(rect.left, margin, Math.max(margin, vw - cw - margin));
      top = Math.max(rect.top - margin - ch, margin);
    }

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  _positionCardCentered() {
    const card = this.cardEl;
    card.classList.remove('is-anchored');
    card.classList.add('is-modal');
    card.style.left = '50%';
    card.style.top = '50%';
    card.style.transform = 'translate(-50%, -50%)';
  }

  _onReposition() {
    if (!this._built) return;
    const step = this.steps[this.stepIndex];
    this._layoutForStep(step);
  }

  // ==================== DOM / lifecycle ====================

  _ensureDom() {
    if (this._built) return;
    this._injectStyles();

    this.rootEl = document.createElement('div');
    this.rootEl.className = 'guided-tour';

    this.blockerEl = document.createElement('div');
    this.blockerEl.className = 'guided-tour__blocker';

    this.spotlightEl = document.createElement('div');
    this.spotlightEl.className = 'guided-tour__spotlight';
    this.spotlightEl.style.display = 'none';

    this.cardEl = document.createElement('div');
    this.cardEl.className = 'guided-tour__card';
    this.cardEl.dir = isRTL() ? 'rtl' : 'ltr';

    this.rootEl.append(this.blockerEl, this.spotlightEl, this.cardEl);
    document.body.appendChild(this.rootEl);

    window.addEventListener('resize', this._onReposition);
    // Scroll events don't bubble, but a capturing listener on document
    // still sees them fire on any descendant (e.g. a sidebar's own
    // scrollable content), which is what keeps the spotlight aligned
    // if a highlighted section is inside a scrolled sidebar.
    document.addEventListener('scroll', this._onReposition, true);

    this._built = true;
  }

  _clearCard() {
    this.cardEl.replaceChildren();
  }

  _teardown() {
    if (!this._built) return;
    window.removeEventListener('resize', this._onReposition);
    document.removeEventListener('scroll', this._onReposition, true);
    if (this.rootEl && this.rootEl.parentElement) {
      this.rootEl.parentElement.removeChild(this.rootEl);
    }
    this.rootEl = null;
    this.blockerEl = null;
    this.spotlightEl = null;
    this.cardEl = null;
    this._built = false;
  }

  _injectStyles() {
    if (document.getElementById('guided-tour-styles')) return;
    const style = document.createElement('style');
    style.id = 'guided-tour-styles';
    style.textContent = `
.guided-tour { position: fixed; inset: 0; z-index: 2147483000; font-family: var(--smip-font-ui, sans-serif); }
.guided-tour__blocker { position: absolute; inset: 0; background: rgba(13, 17, 23, 0.75); pointer-events: auto; }
.guided-tour__spotlight {
  position: fixed;
  border: 2px solid var(--smip-accent, #e8a33d);
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(13, 17, 23, 0.75);
  pointer-events: none;
}
.guided-tour__card {
  position: fixed;
  width: 300px;
  max-width: calc(100vw - 28px);
  background: var(--smip-surface, #151b23);
  border: 1px solid var(--smip-border, #263140);
  border-radius: var(--smip-radius, 4px);
  padding: 1rem 1.1rem;
  color: var(--smip-text, #e6edf3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
}
.guided-tour__title { margin: 0 0 0.4rem; font-size: 1.1rem; font-weight: 700; }
.guided-tour__title--small { font-size: 1rem; }
.guided-tour__text { margin: 0 0 0.85rem; font-size: 0.88rem; line-height: 1.4; color: var(--smip-text, #e6edf3); }
.guided-tour__counter {
  font-family: var(--smip-font-mono, monospace);
  font-size: 0.72rem;
  color: var(--smip-text-muted, #8b98a5);
  margin-bottom: 0.4rem;
}
.guided-tour__buttons { display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap; }
.guided-tour__checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--smip-text-muted, #8b98a5);
  margin-bottom: 0.85rem;
  cursor: pointer;
}
.guided-tour__btn {
  appearance: none;
  border: 1px solid var(--smip-border, #263140);
  background: var(--smip-surface-raised, #1c2430);
  color: var(--smip-text, #e6edf3);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 500;
  padding: 0.4rem 0.75rem;
  border-radius: var(--smip-radius, 4px);
  cursor: pointer;
}
.guided-tour__btn:disabled { opacity: 0.4; cursor: default; }
.guided-tour__btn--primary { background: var(--smip-accent, #e8a33d); border-color: var(--smip-accent, #e8a33d); color: #1c1500; }
.guided-tour__btn--ghost { background: transparent; }
.guided-tour__close {
  position: absolute;
  top: 0.4rem;
  right: 0.55rem;
  appearance: none;
  background: none;
  border: none;
  color: var(--smip-text-muted, #8b98a5);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.15rem 0.3rem;
}
.guided-tour__close:hover { color: var(--smip-text, #e6edf3); }
.guided-tour__card[dir='rtl'] .guided-tour__close { right: auto; left: 0.55rem; }
.guided-tour__card[dir='rtl'] .guided-tour__text,
.guided-tour__card[dir='rtl'] .guided-tour__title,
.guided-tour__card[dir='rtl'] .guided-tour__counter,
.guided-tour__card[dir='rtl'] .guided-tour__checkbox { text-align: right; }
`;
    document.head.appendChild(style);
  }
}

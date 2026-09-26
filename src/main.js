import { AppShell } from './app/AppShell.js';
import { Router } from './app/Router.js';
import { DynamicsModule } from './modules/dynamics/DynamicsModule.js';
import { GeometryModule } from './modules/geometry/GeometryModule.js';
import { ProblemLibraryModule } from './modules/problems/ProblemLibraryModule.js';
import { takePendingDynamicsProblem } from './app/pendingDynamicsProblem.js';
import { GuidedTour } from './tour/GuidedTour.js';
import { t, getLanguage, setLanguage, isRTL } from './i18n/i18n.js';
import { initTheme } from './theme/theme.js';

const rootEl = document.getElementById('app');

initTheme();

// Holds the currently-live instances so a language switch can cleanly
// tear them down before rebuilding (see teardownApp()/switchLanguage()).
let current = null;

/**
 * Reflects the active language on the document itself: <html lang="">
 * for accessibility/SEO, the tab title, and a scoped class (see
 * style.css's `.lang-rtl` rules) that right-aligns translated Arabic
 * text without touching the app's existing flex layout - the layout
 * itself (sidebar positions, nav order, etc.) stays exactly as before
 * per this feature's own "don't redesign" requirement.
 */
function applyDocumentLanguage() {
  document.documentElement.lang = getLanguage();
  document.title = `SMIP \u00B7 ${t('appTagline')}`;
  rootEl.classList.toggle('lang-rtl', isRTL());
}

function buildApp() {
  applyDocumentLanguage();

  // Route table: each key maps to a factory that creates a fresh module
  // instance. Using factories (not shared singletons) means every time you
  // navigate away and back, you get a clean module with no leftover state.
  //
  // dynamics: takePendingDynamicsProblem() is get-and-clear (see that
  // file), so this only ever affects the one navigation right after the
  // Problem Library's "Show Details" sets it - navigating here any other
  // way (nav bar, browser back/forward) gets undefined and DynamicsModule
  // falls back to its own normal defaults exactly as before.
  const routes = {
    dynamics: () => new DynamicsModule(takePendingDynamicsProblem()),
    geometry: () => new GeometryModule(),
    problems: () => new ProblemLibraryModule(),
  };

  const navItems = [
    { key: 'dynamics', label: t('navDynamics') },
    { key: 'geometry', label: t('navGeometry') },
    { key: 'problems', label: t('navProblems') },
  ];

  // The Router needs an outlet element, but AppShell is what creates that
  // outlet - so we construct the Router first with a placeholder outlet
  // reference, then let AppShell supply the real one before starting it.
  const router = new Router(routes, null, 'dynamics');
  const appShell = new AppShell(rootEl, navItems, router);
  router.outlet = appShell.outlet;

  router.start();

  // Guided Tour: purely additive - it only reads the Router and clicks
  // the app's own existing buttons to bring each part of the UI into
  // view before highlighting it (see src/tour/). Auto-shows once per
  // "Don't show this again" preference (src/tour/tourStorage.js); the
  // header's own Guided Tour button (see AppShell.js) always force-shows it.
  const guidedTour = new GuidedTour({ router });
  appShell.tourButtonEl.addEventListener('click', () => guidedTour.start({ force: true }));

  // Language switcher: selecting the option already matching the current
  // language is a no-op (switchLanguage() below guards against it), so
  // this never rebuilds needlessly.
  appShell.languageOptionButtons.en.addEventListener('click', () => switchLanguage('en'));
  appShell.languageOptionButtons.ar.addEventListener('click', () => switchLanguage('ar'));

  guidedTour.start();

  current = { router, appShell, guidedTour };
}

function teardownApp() {
  if (!current) return;
  current.guidedTour.destroy();
  current.router.dispose();
  current.appShell.dispose();
  current = null;
}

/**
 * Switches the active language and fully rebuilds the app in place.
 * A full rebuild (rather than patching text in every live component)
 * is the safest way to translate everything at once without touching
 * any existing calculation/rendering logic - the current route is kept
 * (the URL hash doesn't change), only in-progress, unsaved form input
 * is reset, exactly as a normal page reload would behave.
 */
function switchLanguage(lang) {
  if (getLanguage() === lang) return;
  setLanguage(lang);
  teardownApp();
  buildApp();
}

buildApp();

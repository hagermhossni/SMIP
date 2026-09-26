import { t } from '../i18n/i18n.js';

/**
 * tourSteps
 * ----------------------------------------------------------------------
 * Declarative step list for the Guided Tour. Each step is one of:
 *   - 'welcome' / 'final'  - centered cards, no highlighted element
 *   - 'intro'              - centered card introducing a destination
 *                            (Spatial Geometry / Problem Library)
 *   - 'spotlight'          - highlights one existing element (`target`,
 *                            a CSS selector) or several at once
 *                            (`targets`, an array of selectors - used
 *                            only for Position/Velocity/Acceleration,
 *                            which are explained together)
 *
 * All `title`/`text` values are read from the i18n dictionary (see
 * src/i18n/translations.js) at the moment createTourSteps() is called,
 * so the tour is always built in whichever language is currently active
 * (see GuidedTour's constructor, and main.js which rebuilds everything -
 * the tour included - on a language switch).
 *
 * Every 'spotlight'/'intro' step may define `prepare(nav)`, called
 * right before that step is shown so the exact same real UI (nav tabs,
 * category cards, the Add button, etc.) is driven into the state the
 * step needs - nothing here bypasses or duplicates that UI. `prepare`
 * is idempotent: it re-derives the needed view from whatever is
 * currently on screen, so it works correctly whether the tour just
 * came from Back or from Next.
 *
 * `nav` (built in GuidedTour.js) exposes:
 *   - goToRoute(routeKey)        - navigates the real Router
 *   - goToProblemLibraryHome()   - drives Problem Library back to its
 *                                  category-cards home screen
 *   - goToProblemLibraryCategory() - ...to a category's question list
 *   - goToProblemLibraryAddForm()  - ...to the Add Problem form
 */
export function createTourSteps() {
  return [
    { type: 'welcome' },

    // ---------------- Destination 1: Spatial Dynamics ----------------
    {
      type: 'spotlight',
      target: '[data-tour="dynamics-coordinate-system"]',
      text: t('tourStepCoordinateSystem'),
      prepare: (nav) => nav.goToRoute('dynamics'),
    },
    {
      type: 'spotlight',
      target: '[data-tour="dynamics-equation-input"]',
      text: t('tourStepEquationInput'),
      prepare: (nav) => nav.goToRoute('dynamics'),
    },
    {
      type: 'spotlight',
      target: '[data-tour="dynamics-simulation-settings"]',
      text: t('tourStepSimulationSettings'),
      prepare: (nav) => nav.goToRoute('dynamics'),
    },
    {
      type: 'spotlight',
      target: '[data-tour="dynamics-3d-visualization"]',
      text: t('tourStep3DVisualization'),
      prepare: (nav) => nav.goToRoute('dynamics'),
    },
    {
      type: 'spotlight',
      targets: [
        '[data-tour="dynamics-position"]',
        '[data-tour="dynamics-velocity"]',
        '[data-tour="dynamics-acceleration"]',
      ],
      text: t('tourStepPVA'),
      prepare: (nav) => nav.goToRoute('dynamics'),
    },
    {
      type: 'spotlight',
      target: '[data-tour="dynamics-coordinate-info"]',
      text: t('tourStepCoordinateInfo'),
      prepare: (nav) => nav.goToRoute('dynamics'),
    },
    {
      type: 'spotlight',
      target: '[data-tour="dynamics-derivation"]',
      text: t('tourStepDerivation'),
      prepare: (nav) => nav.goToRoute('dynamics'),
    },

    // ---------------- Destination 2: Spatial Geometry ----------------
    {
      type: 'intro',
      title: t('navGeometry'),
      text: t('tourGeometryIntro'),
      prepare: (nav) => nav.goToRoute('geometry'),
    },

    // ---------------- Destination 3: Problem Library ----------------
    {
      type: 'intro',
      title: t('navProblems'),
      text: t('tourProblemLibraryIntro'),
      prepare: (nav) => {
        nav.goToRoute('problems');
        nav.goToProblemLibraryHome();
      },
    },
    {
      type: 'spotlight',
      target: '[data-tour="problem-categories"]',
      text: t('tourStepChooseCategory'),
      prepare: (nav) => {
        nav.goToRoute('problems');
        nav.goToProblemLibraryHome();
      },
    },
    {
      type: 'spotlight',
      target: '[data-tour="problem-add-btn"]',
      text: t('tourStepClickAdd'),
      prepare: (nav) => {
        nav.goToRoute('problems');
        nav.goToProblemLibraryCategory();
      },
    },
    {
      type: 'spotlight',
      target: '[data-tour="problem-add-title"]',
      text: t('tourStepEnterTitle'),
      prepare: (nav) => {
        nav.goToRoute('problems');
        nav.goToProblemLibraryAddForm();
      },
    },
    {
      type: 'spotlight',
      target: '[data-tour="problem-add-description"]',
      text: t('tourStepEnterDescription'),
      prepare: (nav) => {
        nav.goToRoute('problems');
        nav.goToProblemLibraryAddForm();
      },
    },
    {
      type: 'spotlight',
      target: '[data-tour="problem-add-equations"]',
      text: t('tourStepEquationsApplySave'),
      prepare: (nav) => {
        nav.goToRoute('problems');
        nav.goToProblemLibraryAddForm();
      },
    },
    {
      type: 'spotlight',
      target: '[data-tour="problem-category-body"]',
      text: t('tourStepStoredEditDelete'),
      prepare: (nav) => {
        nav.goToRoute('problems');
        nav.goToProblemLibraryCategory();
      },
    },

    { type: 'final' },
  ];
}

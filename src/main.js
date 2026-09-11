import { AppShell } from './app/AppShell.js';
import { Router } from './app/Router.js';
import { DynamicsModule } from './modules/dynamics/DynamicsModule.js';
import { GeometryModule } from './modules/geometry/GeometryModule.js';
import { ProblemLibraryModule } from './modules/problems/ProblemLibraryModule.js';
import { takePendingDynamicsProblem } from './app/pendingDynamicsProblem.js';

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
  { key: 'dynamics', label: 'Spatial Dynamics' },
  { key: 'geometry', label: 'Spatial Geometry' },
  { key: 'problems', label: 'Problem Library' },
];

const rootEl = document.getElementById('app');

// The Router needs an outlet element, but AppShell is what creates that
// outlet - so we construct the Router first with a placeholder outlet
// reference, then let AppShell supply the real one before starting it.
const router = new Router(routes, null, 'dynamics');
const appShell = new AppShell(rootEl, navItems, router);
router.outlet = appShell.outlet;

router.start();

/**
 * problemStore
 * ----------------------------------------------------------------------
 * Persistence for the Problem Library's saved questions, backed by
 * localStorage (not sessionStorage/in-memory) so a saved question
 * survives a page refresh and coming back to the site later, not just
 * the current tab/session. Used only by ProblemLibraryModule - no other
 * module reads or writes this key.
 *
 * A saved record looks like:
 *   {
 *     id: string,
 *     system: 'cartesian'|'cylindrical'|'spherical',
 *     title: string,
 *     description: string,
 *     equations: object,   // keyed as in ParametricMotion's COMPONENT_KEYS[system]
 *     createdAt: number,   // Date.now() at save time
 *   }
 */
const STORAGE_KEY = 'smip.problemLibrary.savedProblems.v1';

/** @returns {Array<object>} every saved problem, oldest first; [] if none or the stored value is corrupt. */
export function loadProblems() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(problems) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
  } catch {
    // Storage unavailable or full - saving silently fails; nothing else to do here.
  }
}

/**
 * @param {'cartesian'|'cylindrical'|'spherical'} system
 * @returns {Array<object>} saved problems belonging to that category, oldest first
 */
export function loadProblemsBySystem(system) {
  return loadProblems().filter((problem) => problem.system === system);
}

/**
 * Appends a new saved problem and persists it immediately.
 * @param {{system: string, title: string, description: string, equations: object}} problem
 * @returns {object} the saved record, including its generated id/createdAt
 */
export function saveProblem(problem) {
  const record = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    ...problem,
  };
  const problems = loadProblems();
  problems.push(record);
  persist(problems);
  return record;
}

/** @param {string} id */
export function deleteProblem(id) {
  persist(loadProblems().filter((problem) => problem.id !== id));
}

/**
 * pendingDynamicsProblem
 * ----------------------------------------------------------------------
 * A tiny one-shot handoff so the Problem Library's "Show Details" button
 * can make Spatial Dynamics open already showing a saved question's
 * equations, without either module knowing about the other's internals:
 *   - ProblemLibraryModule calls setPendingDynamicsProblem(...) with the
 *     saved system/equations, then navigates to the dynamics route.
 *   - main.js's route factory calls takePendingDynamicsProblem() when
 *     building a fresh DynamicsModule, and passes whatever it gets
 *     (or undefined) straight into DynamicsModule's constructor.
 *
 * "Take" (get-and-clear) is deliberate: once read, the pending value is
 * gone, so navigating to Spatial Dynamics again afterward (e.g. via the
 * nav bar) starts fresh with its own defaults instead of silently
 * reapplying a stale problem.
 *
 * This file doesn't import from, or get imported by, anything under
 * modules/dynamics/ except the single optional constructor parameter
 * DynamicsModule already accepts - Spatial Dynamics' own default
 * behavior (nav-bar navigation, no pending value) is unchanged.
 */
let pending = null;

/** @param {{system: 'cartesian'|'cylindrical'|'spherical', equations: object}} problem */
export function setPendingDynamicsProblem(problem) {
  pending = problem;
}

/**
 * @returns {{system: string, equations: object}|null} the pending problem,
 *   clearing it so it's only ever consumed once
 */
export function takePendingDynamicsProblem() {
  const value = pending;
  pending = null;
  return value;
}

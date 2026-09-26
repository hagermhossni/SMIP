import { compileExpression } from './expressionCompiler.js';
import { cylindricalToCartesian, sphericalToCartesian } from './coordinateSystems.js';

// Step sizes for the numerical derivatives below. Equations are typed
// as arbitrary strings (min/max/abs/etc. included), so there is no
// general symbolic derivative to fall back on - central finite
// differences work for any compiled f(t) without needing to touch
// expressionCompiler.js at all.
//
// The two derivatives use different step sizes on purpose: velocity is
// a first derivative, where a smaller h shrinks truncation error with
// little round-off cost. Acceleration is a second derivative, whose
// central-difference formula divides by h^2 - too small an h there
// amplifies floating-point noise, so it uses a slightly larger step.
const VELOCITY_H = 1e-4;
const ACCELERATION_H = 1e-3;

// The three component fields a motion equation set has, per input
// coordinate system, in entry order - shared with MotionControls so the
// panel and this class always agree on which key means what.
export const COMPONENT_KEYS = {
  cartesian: ['x', 'y', 'z'],
  cylindrical: ['rho', 'phi', 'z'],
  spherical: ['r', 'theta', 'phi'],
};

/**
 * ParametricMotion
 * ----------------------------------------------------------------------
 * Represents a particle's position in space as three independent
 * functions of time. The three functions can be entered in Cartesian
 * (x(t)/y(t)/z(t)), cylindrical (rho(t)/phi(t)/z(t)), or spherical
 * (r(t)/theta(t)/phi(t)) form (Phase 6) - whichever system is active,
 * `positionAt(t)` always evaluates the three raw component functions
 * and converts the result to Cartesian via coordinateSystems.js before
 * returning, so every other part of the app (rendering, trails,
 * velocity/acceleration) keeps working with a single Cartesian
 * `{x,y,z}` regardless of how the equations were typed. This is pure
 * computation - it knows nothing about Three.js, meshes, or trails.
 *
 * It also derives velocity and acceleration from that same Cartesian
 * positionAt(t) via numerical differentiation (see velocityAt/
 * accelerationAt below), so there is still a single source of truth for
 * the motion: the position functions themselves.
 */
export class ParametricMotion {
  /**
   * @param {'cartesian'|'cylindrical'|'spherical'} system
   * @param {object} equations - expression strings in terms of t, keyed by COMPONENT_KEYS[system]
   */
  constructor(system, equations) {
    this.setEquations(system, equations);
  }

  /**
   * Compiles new equations in the given coordinate system. Throws (with
   * a message safe to show the user) if any expression is invalid -
   * callers should catch this and leave the previous equations/system
   * in place on failure.
   * @param {'cartesian'|'cylindrical'|'spherical'} system
   * @param {object} equations
   */
  setEquations(system, equations) {
    const keys = COMPONENT_KEYS[system];
    if (!keys) throw new Error(`Unknown coordinate system "${system}".`);

    const compiled = {};
    keys.forEach((key) => {
      compiled[key] = compileExpression(equations[key]);
    });

    // Only commit once every component compiled successfully, so a bad
    // equation in one field doesn't leave the motion in a half-updated state.
    this.system = system;
    this.fns = compiled;
    this.equations = { ...equations };
  }

  /**
   * @param {number} t
   * @returns {{x: number, y: number, z: number}} always Cartesian, regardless of input system
   */
  positionAt(t) {
    const raw = {};
    COMPONENT_KEYS[this.system].forEach((key) => {
      raw[key] = this.fns[key](t);
    });

    if (this.system === 'cylindrical') return cylindricalToCartesian(raw);
    if (this.system === 'spherical') return sphericalToCartesian(raw);
    return raw; // cartesian: raw is already {x, y, z}
  }

  /**
   * First derivative of position with respect to t, via a central
   * difference: v(t) = (p(t+h) - p(t-h)) / (2h).
   * @param {number} t
   * @param {number} [h=VELOCITY_H]
   * @returns {{x: number, y: number, z: number}}
   */
  velocityAt(t, h = VELOCITY_H) {
    const forward = this.positionAt(t + h);
    const backward = this.positionAt(t - h);
    return {
      x: (forward.x - backward.x) / (2 * h),
      y: (forward.y - backward.y) / (2 * h),
      z: (forward.z - backward.z) / (2 * h),
    };
  }

  /**
   * Second derivative of position with respect to t, via the standard
   * three-point central difference: a(t) = (p(t+h) - 2p(t) + p(t-h)) / h^2.
   * @param {number} t
   * @param {number} [h=ACCELERATION_H]
   * @returns {{x: number, y: number, z: number}}
   */
  accelerationAt(t, h = ACCELERATION_H) {
    const forward = this.positionAt(t + h);
    const center = this.positionAt(t);
    const backward = this.positionAt(t - h);
    const hSq = h * h;
    return {
      x: (forward.x - 2 * center.x + backward.x) / hSq,
      y: (forward.y - 2 * center.y + backward.y) / hSq,
      z: (forward.z - 2 * center.z + backward.z) / hSq,
    };
  }
}

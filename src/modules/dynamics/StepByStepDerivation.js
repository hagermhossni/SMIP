import { differentiateExpression } from '../../math/symbolicDerivative.js';
import { COMPONENT_KEYS } from '../../math/ParametricMotion.js';

// Base symbol (without the trailing "(t)") per component key, per
// coordinate system - kept local to this file (rather than imported
// from MotionControls.js's EQUATION_FIELD_DEFS) to avoid a circular
// import between the two, since MotionControls.js is the one that
// mounts this class. Must stay in sync with EQUATION_FIELD_DEFS'
// labels and ParametricMotion's COMPONENT_KEYS.
const COMPONENT_SYMBOLS = {
  cartesian: { x: 'x', y: 'y', z: 'z' },
  cylindrical: { rho: '\u03C1', phi: '\u03C6', z: 'z' },
  spherical: { r: 'r', theta: '\u03B8', phi: '\u03C6' },
};

const PRIME = '\u2032'; // ′  - first derivative
const DPRIME = '\u2033'; // ″  - second derivative

function fmt(n) {
  return n === null || n === undefined || !Number.isFinite(n) ? '\u2014' : n.toFixed(2);
}

/**
 * StepByStepDerivation
 * ----------------------------------------------------------------------
 * Renders the "Step-by-Step Derivation" section's content: a purely
 * explanatory, read-only walkthrough of the same math ParametricMotion
 * already computes. It never feeds anything back into ParametricMotion,
 * the 3D scene, or any other readout - it only re-derives (symbolically,
 * via math/symbolicDerivative.js) and re-displays.
 *
 * Two update rhythms, matching how often the underlying numbers change:
 *   - setEquations(system, equations): called only when the equations
 *     are (re)applied or the coordinate system changes (same moments
 *     DynamicsModule calls ParametricMotion.setEquations). Recomputes
 *     the symbolic derivatives and renders the static steps (Given
 *     Equations, First/Second Derivatives, Velocity & Acceleration Law).
 *   - update(...): called every frame alongside updateVelocityReadout/
 *     updateAccelerationReadout. Renders the Substitution step (numeric
 *     values at the current t, from this class's own symbolic
 *     evaluators) and the Final Result step - which reuses the exact
 *     velocity/acceleration/magnitude numbers already computed by
 *     ParametricMotion and shown in the Velocity/Acceleration sections
 *     above, so the two can never disagree.
 */
export class StepByStepDerivation {
  constructor() {
    this._system = null;
    this._derivatives = null; // {componentKey: {evaluateOriginal, firstDerivative, secondDerivative}} | null per key on failure
  }

  /** @param {HTMLElement} containerEl - the section's bodyEl */
  mount(containerEl) {
    this.staticEl = document.createElement('div');
    this.staticEl.className = 'derivation__static';
    containerEl.appendChild(this.staticEl);

    this.liveEl = document.createElement('div');
    this.liveEl.className = 'derivation__live';
    containerEl.appendChild(this.liveEl);
  }

  /**
   * @param {'cartesian'|'cylindrical'|'spherical'} system
   * @param {object} equations - expression strings keyed by COMPONENT_KEYS[system]
   */
  setEquations(system, equations) {
    this._system = system;
    const keys = COMPONENT_KEYS[system];

    this._derivatives = {};
    let derivationError = null;
    keys.forEach((key) => {
      try {
        this._derivatives[key] = differentiateExpression(equations[key]);
      } catch (err) {
        derivationError = err;
        this._derivatives[key] = null;
      }
    });

    this._renderStatic(system, equations, keys, derivationError);
  }

  _renderStatic(system, equations, keys, derivationError) {
    if (!this.staticEl) return;
    this.staticEl.replaceChildren();
    const symbols = COMPONENT_SYMBOLS[system];

    this.staticEl.appendChild(
      this._stepBlock('Given Equations', keys.map((k) => `${symbols[k]}(t) = ${equations[k]}`).join('\n'))
    );

    if (derivationError) {
      this.staticEl.appendChild(
        this._noteBlock(
          'A closed-form derivative could not be found for one of these equations, so the substitution and final result below use the exact numeric values already computed for Velocity/Acceleration.'
        )
      );
      return;
    }

    this.staticEl.appendChild(
      this._stepBlock(
        'Step 1 \u2014 First Derivative (differentiate each function w.r.t. t)',
        keys.map((k) => `${symbols[k]}${PRIME}(t) = ${this._derivatives[k].firstDerivative.text}`).join('\n')
      )
    );

    this.staticEl.appendChild(
      this._stepBlock(
        'Step 2 \u2014 Second Derivative (differentiate again)',
        keys.map((k) => `${symbols[k]}${DPRIME}(t) = ${this._derivatives[k].secondDerivative.text}`).join('\n')
      )
    );

    this.staticEl.appendChild(
      this._stepBlock(`Step 3 \u2014 Velocity & Acceleration Law (${this._systemLabel(system)})`, this._lawText(system))
    );
  }

  _systemLabel(system) {
    return system.charAt(0).toUpperCase() + system.slice(1);
  }

  _lawText(system) {
    if (system === 'cartesian') {
      return `v(t) = x${PRIME}(t) i + y${PRIME}(t) j + z${PRIME}(t) k\na(t) = x${DPRIME}(t) i + y${DPRIME}(t) j + z${DPRIME}(t) k`;
    }
    if (system === 'cylindrical') {
      return (
        `v = \u03C1${PRIME} \u03C1\u0302 + \u03C1\u03C6${PRIME} \u03C6\u0302 + z${PRIME} \u1E91\n` +
        `a = (\u03C1${DPRIME} \u2212 \u03C1\u03C6${PRIME}\u00B2) \u03C1\u0302 + (\u03C1\u03C6${DPRIME} + 2\u03C1${PRIME}\u03C6${PRIME}) \u03C6\u0302 + z${DPRIME} \u1E91`
      );
    }
    // spherical
    return (
      `v = r${PRIME} r\u0302 + r\u03B8${PRIME} \u03B8\u0302 + r\u00B7sin\u03B8\u00B7\u03C6${PRIME} \u03C6\u0302\n` +
      `a = (r${DPRIME} \u2212 r\u03B8${PRIME}\u00B2 \u2212 r\u00B7sin\u00B2\u03B8\u00B7\u03C6${PRIME}\u00B2) r\u0302\n` +
      `  + (r\u03B8${DPRIME} + 2r${PRIME}\u03B8${PRIME} \u2212 r\u00B7sin\u03B8\u00B7cos\u03B8\u00B7\u03C6${PRIME}\u00B2) \u03B8\u0302\n` +
      `  + (r\u00B7sin\u03B8\u00B7\u03C6${DPRIME} + 2r${PRIME}\u00B7sin\u03B8\u00B7\u03C6${PRIME} + 2r\u00B7cos\u03B8\u00B7\u03B8${PRIME}\u03C6${PRIME}) \u03C6\u0302`
    );
  }

  /**
   * @param {object} payload
   * @param {number} payload.t
   * @param {{x:number,y:number,z:number}|null} payload.velocity - exactly what updateVelocityReadout received
   * @param {number|null} payload.speed
   * @param {{x:number,y:number,z:number}|null} payload.acceleration - exactly what updateAccelerationReadout received
   * @param {number|null} payload.accelMagnitude
   */
  update({ t, velocity, speed, acceleration, accelMagnitude }) {
    if (!this.liveEl || !this._system) return;

    const hasClosedForm = this._derivatives && Object.values(this._derivatives).every((d) => d !== null);
    this.liveEl.replaceChildren();

    if (!hasClosedForm) {
      this.liveEl.appendChild(
        this._stepBlock(
          `Result at t = ${t.toFixed(2)} (exact values from the Velocity/Acceleration computation above)`,
          this._finalResultText(velocity, speed, acceleration, accelMagnitude)
        )
      );
      return;
    }

    const keys = COMPONENT_KEYS[this._system];
    const raw = {};
    const d1 = {};
    const d2 = {};
    keys.forEach((k) => {
      raw[k] = this._derivatives[k].evaluateOriginal(t);
      d1[k] = this._derivatives[k].firstDerivative.evaluate(t);
      d2[k] = this._derivatives[k].secondDerivative.evaluate(t);
    });

    this.liveEl.appendChild(
      this._stepBlock(`Step 4 \u2014 Substitute at t = ${t.toFixed(2)}`, this._substitutionText(this._system, keys, raw, d1, d2))
    );
    this.liveEl.appendChild(
      this._stepBlock(
        'Step 5 \u2014 Final Result (matches Velocity / Acceleration above)',
        this._finalResultText(velocity, speed, acceleration, accelMagnitude)
      )
    );
  }

  _substitutionText(system, keys, raw, d1, d2) {
    const symbols = COMPONENT_SYMBOLS[system];
    const lines = [];
    keys.forEach((k) => lines.push(`${symbols[k]}(t) = ${fmt(raw[k])}`));
    keys.forEach((k) => lines.push(`${symbols[k]}${PRIME}(t) = ${fmt(d1[k])}`));
    keys.forEach((k) => lines.push(`${symbols[k]}${DPRIME}(t) = ${fmt(d2[k])}`));
    lines.push('');
    lines.push(...this._lawSubstitutionLines(system, raw, d1, d2));
    return lines.join('\n');
  }

  _lawSubstitutionLines(system, raw, d1, d2) {
    if (system === 'cartesian') {
      return [
        `v = (${fmt(d1.x)}) i + (${fmt(d1.y)}) j + (${fmt(d1.z)}) k`,
        `a = (${fmt(d2.x)}) i + (${fmt(d2.y)}) j + (${fmt(d2.z)}) k`,
      ];
    }
    if (system === 'cylindrical') {
      const { rho } = raw;
      const vRho = d1.rho;
      const vPhi = rho * d1.phi;
      const vZ = d1.z;
      const aRho = d2.rho - rho * d1.phi * d1.phi;
      const aPhi = rho * d2.phi + 2 * d1.rho * d1.phi;
      const aZ = d2.z;
      return [
        `v_\u03C1 = \u03C1${PRIME} = ${fmt(vRho)}`,
        `v_\u03C6 = \u03C1\u00B7\u03C6${PRIME} = ${fmt(rho)}\u00D7${fmt(d1.phi)} = ${fmt(vPhi)}`,
        `v_z = z${PRIME} = ${fmt(vZ)}`,
        `a_\u03C1 = \u03C1${DPRIME} \u2212 \u03C1\u03C6${PRIME}\u00B2 = ${fmt(aRho)}`,
        `a_\u03C6 = \u03C1\u03C6${DPRIME} + 2\u03C1${PRIME}\u03C6${PRIME} = ${fmt(aPhi)}`,
        `a_z = z${DPRIME} = ${fmt(aZ)}`,
        '(then converted to Cartesian via \u03C1\u0302=(cos\u03C6,sin\u03C6,0), \u03C6\u0302=(\u2212sin\u03C6,cos\u03C6,0), \u1E91=(0,0,1))',
      ];
    }
    // spherical
    const { r, theta } = raw;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const vR = d1.r;
    const vTheta = r * d1.theta;
    const vPhi = r * sinT * d1.phi;
    const aR = d2.r - r * d1.theta * d1.theta - r * sinT * sinT * d1.phi * d1.phi;
    const aTheta = r * d2.theta + 2 * d1.r * d1.theta - r * sinT * cosT * d1.phi * d1.phi;
    const aPhi = r * sinT * d2.phi + 2 * d1.r * sinT * d1.phi + 2 * r * cosT * d1.theta * d1.phi;
    return [
      `v_r = r${PRIME} = ${fmt(vR)}`,
      `v_\u03B8 = r\u00B7\u03B8${PRIME} = ${fmt(vTheta)}`,
      `v_\u03C6 = r\u00B7sin\u03B8\u00B7\u03C6${PRIME} = ${fmt(vPhi)}`,
      `a_r = r${DPRIME} \u2212 r\u03B8${PRIME}\u00B2 \u2212 r\u00B7sin\u00B2\u03B8\u00B7\u03C6${PRIME}\u00B2 = ${fmt(aR)}`,
      `a_\u03B8 = r\u03B8${DPRIME} + 2r${PRIME}\u03B8${PRIME} \u2212 r\u00B7sin\u03B8\u00B7cos\u03B8\u00B7\u03C6${PRIME}\u00B2 = ${fmt(aTheta)}`,
      `a_\u03C6 = r\u00B7sin\u03B8\u00B7\u03C6${DPRIME} + 2r${PRIME}\u00B7sin\u03B8\u00B7\u03C6${PRIME} + 2r\u00B7cos\u03B8\u00B7\u03B8${PRIME}\u03C6${PRIME} = ${fmt(aPhi)}`,
      '(then converted to Cartesian via the r\u0302, \u03B8\u0302, \u03C6\u0302 unit-vector components)',
    ];
  }

  _finalResultText(velocity, speed, acceleration, accelMagnitude) {
    return (
      `v = (${fmt(velocity && velocity.x)}, ${fmt(velocity && velocity.y)}, ${fmt(velocity && velocity.z)})   |v| = ${fmt(speed)}\n` +
      `a = (${fmt(acceleration && acceleration.x)}, ${fmt(acceleration && acceleration.y)}, ${fmt(acceleration && acceleration.z)})   |a| = ${fmt(accelMagnitude)}`
    );
  }

  _stepBlock(title, bodyText) {
    const wrap = document.createElement('div');
    wrap.className = 'derivation-step';

    const heading = document.createElement('div');
    heading.className = 'derivation-step__title';
    heading.textContent = title;

    const body = document.createElement('div');
    body.className = 'derivation-step__line';
    body.textContent = bodyText;

    wrap.append(heading, body);
    return wrap;
  }

  _noteBlock(text) {
    const el = document.createElement('div');
    el.className = 'derivation-step__note';
    el.textContent = text;
    return el;
  }

  /** No Three.js/DOM resources beyond plain elements already owned by the sidebar's own dispose(). */
  dispose() {
    this._derivatives = null;
  }
}

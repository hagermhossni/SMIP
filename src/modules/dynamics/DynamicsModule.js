import { SceneViewport } from '../../core/SceneViewport.js';
import { createModuleHeader } from '../../utils/dom.js';
import { ParametricMotion } from '../../math/ParametricMotion.js';
import { magnitude, isFiniteVector, fromRenderVector } from '../../math/vectorMath.js';
import { cartesianToCylindrical, cartesianToSpherical } from '../../math/coordinateSystems.js';
import { Particle } from './Particle.js';
import { TrajectoryTrail } from './TrajectoryTrail.js';
import { VectorArrow } from './VectorArrow.js';
import { CylindricalHelper } from './CylindricalHelper.js';
import { SphericalHelper } from './SphericalHelper.js';
import { PositionVectorArrow } from './PositionVectorArrow.js';
import { MotionControls } from './MotionControls.js';

// One set of default equations per input coordinate system, each
// describing the same kind of shape (a helix winding around the
// vertical Z axis while climbing) so switching systems in the
// Coordinate Systems selector always lands on a visibly-3D, easy to
// relate-to-each-other starting motion.
const DEFAULT_EQUATIONS_BY_SYSTEM = {
  cartesian: { x: '5*cos(t)', y: '5*sin(t)', z: '0.6*t' },
  cylindrical: { rho: '5', phi: 't', z: '0.6*t' },
  spherical: { r: '5', theta: 'PI/3', phi: 't' },
};
const DEFAULT_T_MAX = 20;
const DEFAULT_SPEED = 1;

// Raw velocity/acceleration magnitudes don't share the scene's spatial
// scale, so arrow length is magnitude * <this scale> rather than the
// raw magnitude in scene units (see VectorArrow's class doc). These
// values were picked so the default helix's arrows (magnitude ~5) read
// clearly against its own radius (5) without overpowering the viewport.
const VELOCITY_ARROW_SCALE = 0.5;
const ACCELERATION_ARROW_SCALE = 0.5;
const VELOCITY_ARROW_COLOR = 0x2dd4bf; // teal - distinct from axes/trail/particle
const ACCELERATION_ARROW_COLOR = 0xf472b6; // pink - distinct from axes/trail/particle
const POSITION_VECTOR_COLOR = 0xf1f5f9; // near-white - distinct from velocity/acceleration/coordinate-helper colors
// CSS equivalents of the two arrow colors above, for their in-scene "V"/"a"
// symbol labels (see VectorArrow's label option) so each arrow is clearly
// identifiable at a glance instead of relying on color alone.
const VELOCITY_LABEL_COLOR = '#2dd4bf';
const ACCELERATION_LABEL_COLOR = '#f472b6';

// Passed to VectorArrow.update() when a derivative is momentarily
// non-finite, so the arrow's own zero-vector handling hides it cleanly.
const ZERO_VECTOR = { x: 0, y: 0, z: 0 };

// The coordinate system shown/selected when a fresh DynamicsModule mounts.
const DEFAULT_COORDINATE_SYSTEM = 'cartesian';

// Text for the small in-scene legend box (SceneViewport.setCoordLegend)
// explaining the active system's symbols. Cartesian has none - its x/y/z
// are already the axis letters AxisAnnotations draws directly on the
// scene's own axes, so the box stays hidden while Cartesian is selected.
const COORD_LEGEND_BY_SYSTEM = {
  cartesian: null,
  cylindrical: {
    title: 'Cylindrical',
    rows: [
      { symbol: '\u03C1', meaning: 'radial distance' },
      { symbol: '\u03C6', meaning: 'azimuth angle' },
      { symbol: 'z', meaning: 'height' },
    ],
  },
  spherical: {
    title: 'Spherical',
    rows: [
      { symbol: 'r', meaning: 'radial distance' },
      { symbol: '\u03B8', meaning: 'polar angle' },
      { symbol: '\u03C6', meaning: 'azimuth angle' },
    ],
  },
};

/**
 * DynamicsModule
 * ----------------------------------------------------------------------
 * Phase 2: a particle moves along a user-defined parametric path
 * x(t)/y(t)/z(t), leaving a visible trajectory trail, with play/pause/
 * reset controls and a live position readout.
 *
 * Phase 3: at every t, it also derives velocity and acceleration from
 * the same ParametricMotion (numerical differentiation - see
 * ParametricMotion.velocityAt/accelerationAt), renders them as arrows
 * anchored to the particle, reports their components/magnitudes in the
 * panel, and lets the trajectory/velocity/acceleration overlays each be
 * shown or hidden independently.
 *
 * Phase 4: at every t, the same Cartesian position is also converted to
 * cylindrical and spherical coordinates (see math/coordinateSystems.js)
 * and shown side by side in the panel, always kept in sync. A view
 * selector picks which system's helper visualization (CylindricalHelper/
 * SphericalHelper) is drawn in the 3D scene and which readout is
 * highlighted; Cartesian has no extra helper since the scene's existing
 * axes already represent it.
 *
 * UI layout (this pass - left Controls / right Data panel overhaul):
 *   - The controls are now two resizable, collapsible side panels
 *     (MotionControls composes two core/Sidebar.js instances) with the
 *     scene between them (see module-view--with-sidebar in style.css):
 *     a LEFT "Controls" panel with exactly three sections (Coordinate
 *     System Selection, Equation Input, Simulation Settings), and a
 *     RIGHT "Data Panel" holding every live number (Position, Velocity,
 *     Acceleration, Trajectory Information, Coordinate Information,
 *     Camera) plus the visibility toggles (Display Options), which
 *     aren't numeric data but have nowhere else to go since the left
 *     panel is strictly input-only. SceneManager's own ResizeObserver
 *     keeps the Three.js canvas responsive to either panel being
 *     resized or collapsed, with no extra wiring needed here.
 *   - The scene's coordinate convention is the standard math/physics
 *     one: Z is vertical, X/Y are horizontal, the grid sits on the XY
 *     plane (see math/vectorMath.js's toRenderVector - every *Helper/
 *     Particle/Trail/VectorArrow class applies it before touching
 *     Three.js). This module's own code stays entirely in math space;
 *     it never has to think about the remap.
 *   - The 3D scene renders a fixed set of teaching symbols (axis
 *     letters, an origin "O", the rho/phi/z or r/theta/phi helper
 *     labels, and the "V"/"a" labels beside the velocity/acceleration
 *     arrows - see AxisAnnotations/CylindricalHelper/SphericalHelper/
 *     VectorArrow) but no live number: every live number lives in the
 *     right Data Panel instead, including the camera's own position,
 *     polled here every frame from `viewport.sceneManager.camera.position`.
 *   - The coordinate-system selector now does double duty: besides
 *     picking which helper is drawn, it also picks which coordinate
 *     system the Equation Input fields accept input in (Cartesian
 *     x/y/z, Cylindrical rho/phi/z, or Spherical r/theta/phi - see
 *     math/ParametricMotion.js's COMPONENT_KEYS). Whichever system is
 *     selected, ParametricMotion.positionAt(t) always converts to
 *     Cartesian internally, so rendering/trails/derivatives never need
 *     to know which system was typed in - and the Coordinate
 *     Information readouts (computed by re-converting that Cartesian
 *     position every frame) double as the "original values" display
 *     for whichever system is active.
 *
 * Step-by-Step Derivation (new, purely additive pass): a Data Panel
 * section below Velocity/Acceleration shows a readable symbolic
 * derivation of the same math - given equations, first/second
 * derivatives, the active coordinate system's velocity/acceleration
 * law, substitution at the current t, and a final result that reuses
 * the exact velocity/acceleration/magnitude values already computed
 * above. See math/symbolicDerivative.js (pure symbolic differentiation,
 * used only for this explanatory display) and
 * modules/dynamics/StepByStepDerivation.js (renders it). Nothing about
 * equation input, ParametricMotion's actual computation, or the 3D
 * visualization changed to add this.
 *
 * This module owns all playback *state* (current t, playing, speed,
 * tMax, coordinate system view); ParametricMotion only knows how to
 * evaluate equations (and their derivatives), coordinateSystems.js only
 * knows how to convert/generate points, and MotionControls only knows
 * how to render the two panels and report clicks - none of them know
 * about each other or about Three.js (except the *Helper/Particle/
 * Trail/VectorArrow classes, which know Three.js but nothing about
 * playback state or the panels).
 */
export class DynamicsModule {
  /**
   * @param {{system: 'cartesian'|'cylindrical'|'spherical', equations: object}|null|undefined} [initial]
   *   Optional starting system/equations - used only when the Problem
   *   Library's "Show Details" navigates here with a saved question (see
   *   app/pendingDynamicsProblem.js). Omitted (the normal case: opening
   *   Spatial Dynamics from the nav bar), this module behaves exactly as
   *   before - DEFAULT_COORDINATE_SYSTEM and its default equations.
   */
  constructor(initial = null) {
    this._initial = initial || null;
  }

  mount(container) {
    this.el = document.createElement('div');
    // The --with-sidebar modifier switches .module-view from Geometry's
    // simple absolute-fill layout to a flex row - here holding three
    // children in order: the left Controls panel, a center column, and
    // the right Data panel (see style.css and core/Sidebar.js). Only
    // Dynamics needs this until a later phase gives Geometry its own
    // panels.
    this.el.className = 'module-view module-view--with-sidebar';

    // The center column stacks the 3D scene above the Step-by-Step
    // Derivation panel (MotionControls.derivationPanelEl, appended below
    // once `controls` is built) so the derivation spans the scene's full
    // width instead of living in the narrow right Data Panel sidebar.
    this.centerCol = document.createElement('div');
    this.centerCol.className = 'module-view__center';

    this.sceneWrap = document.createElement('div');
    this.sceneWrap.className = 'module-view__scene';
    this.sceneWrap.appendChild(
      createModuleHeader(
        'Spatial Dynamics',
        "Define a parametric path and play back the particle's motion through space."
      )
    );
    this.centerCol.appendChild(this.sceneWrap);
    this.el.appendChild(this.centerCol);
    container.appendChild(this.el);

    this.viewport = new SceneViewport(this.sceneWrap);
    const scene = this.viewport.sceneManager.scene;

    // Falls back to the normal cartesian default whenever no `initial`
    // was passed in - see the constructor doc above.
    const startSystem = this._initial ? this._initial.system : DEFAULT_COORDINATE_SYSTEM;
    const startEquations = this._initial ? this._initial.equations : DEFAULT_EQUATIONS_BY_SYSTEM[startSystem];

    this.motion = new ParametricMotion(startSystem, startEquations);
    this.particle = new Particle(scene);
    this.trail = new TrajectoryTrail(scene);
    this.velocityArrow = new VectorArrow(scene, {
      color: VELOCITY_ARROW_COLOR,
      scale: VELOCITY_ARROW_SCALE,
      label: 'V',
      labelColor: VELOCITY_LABEL_COLOR,
    });
    this.accelerationArrow = new VectorArrow(scene, {
      color: ACCELERATION_ARROW_COLOR,
      scale: ACCELERATION_ARROW_SCALE,
      label: 'a',
      labelColor: ACCELERATION_LABEL_COLOR,
    });
    this.cylindricalHelper = new CylindricalHelper(scene);
    this.sphericalHelper = new SphericalHelper(scene);
    this.positionVectorArrow = new PositionVectorArrow(scene, { color: POSITION_VECTOR_COLOR });

    this.state = {
      t: 0,
      playing: false,
      tMax: DEFAULT_T_MAX,
      speed: DEFAULT_SPEED,
      coordinateSystem: startSystem,
      // Independent of which coordinate system is selected above - lets
      // the student hide a helper's lines without switching away from
      // that system's view.
      showCylindricalHelpers: true,
      showSphericalHelpers: true,
    };

    // Only startSystem's row is overridden with the incoming saved
    // equations - every other system still shows its own normal
    // defaults if the student switches to it, exactly as before.
    const equationsBySystemForControls = this._initial
      ? { ...DEFAULT_EQUATIONS_BY_SYSTEM, [startSystem]: startEquations }
      : DEFAULT_EQUATIONS_BY_SYSTEM;

    this.controls = new MotionControls({
      defaultSystem: startSystem,
      defaultEquationsBySystem: equationsBySystemForControls,
      defaultTMax: DEFAULT_T_MAX,
      defaultSpeed: DEFAULT_SPEED,
      callbacks: {
        onApplyEquations: (payload) => this._applyEquations(payload),
        onPlay: () => this._play(),
        onPause: () => this._pause(),
        onReset: () => this._reset(),
        onParamsChange: (params) => this._updateParams(params),
        onToggleTrajectory: (visible) => this.trail.setVisible(visible),
        onToggleVelocity: (visible) => this.velocityArrow.setVisible(visible),
        onToggleAcceleration: (visible) => this.accelerationArrow.setVisible(visible),
        onTogglePositionVector: (visible) => this.positionVectorArrow.setVisible(visible),
        onToggleAxisLabels: (visible) => this.viewport.sceneManager.axisAnnotations.setLabelsVisible(visible),
        onToggleAxisScale: (visible) => this.viewport.sceneManager.axisAnnotations.setScaleVisible(visible),
        onToggleCylindricalHelpers: (visible) => this._toggleCylindricalHelpers(visible),
        onToggleSphericalHelpers: (visible) => this._toggleSphericalHelpers(visible),
        onSelectCoordinateSystem: (system) => this._selectCoordinateSystem(system),
      },
    });
    this.el.insertBefore(this.controls.leftEl, this.centerCol);
    this.el.appendChild(this.controls.rightEl);
    // Below the scene, spanning the center column's full width - see
    // MotionControls._buildStepByStepDerivationPanel and .derivation-panel
    // in style.css.
    this.centerCol.appendChild(this.controls.derivationPanelEl);
    this.controls.setDerivationEquations(startSystem, startEquations);

    this._updateCoordLegend(startSystem);
    this.controls.updatePathInfo(startSystem, DEFAULT_T_MAX);
    // Normally a no-op at mount (cartesian has no helper, and the two
    // Helper instances already default to hidden) - but needed here so
    // a cylindrical/spherical `initial` system shows its helper right
    // away instead of only after the student re-picks that radio button.
    this._updateHelperVisibility();

    // Draw the starting position (t=0) immediately, before any playback.
    this._syncVisualsToCurrentTime();

    this._onFrame = this._onFrame.bind(this);
    this.viewport.sceneManager.addFrameListener(this._onFrame);

    // Coming from the Problem Library's "Show Details": start playing
    // immediately so velocity/acceleration and every other live readout
    // populate right away instead of sitting at their t=0 values.
    if (this._initial) this._play();
  }

  /**
   * @param {{system: 'cartesian'|'cylindrical'|'spherical', equations: object}} payload
   */
  _applyEquations({ system, equations }) {
    try {
      this.motion.setEquations(system, equations);
      this.controls.clearError();
      this.controls.setDerivationEquations(system, equations);
    } catch (err) {
      this.controls.showError(err.message);
      return; // keep the previous, still-valid equations and motion state
    }
    this._reset();
  }

  _play() {
    // If the run already finished, restart from t=0 for a clean loop.
    if (this.state.t >= this.state.tMax) {
      this._reset();
    }
    this.state.playing = true;
    this.controls.setPlaying(true);
  }

  _pause() {
    this.state.playing = false;
    this.controls.setPlaying(false);
  }

  _reset() {
    this.state.playing = false;
    this.state.t = 0;
    this.trail.reset();
    this.controls.setPlaying(false);
    this.controls.clearError();
    this._syncVisualsToCurrentTime();
  }

  _updateParams({ tMax, speed }) {
    if (tMax !== undefined) this.state.tMax = tMax;
    if (speed !== undefined) this.state.speed = speed;
    this.controls.updatePathInfo(this.state.coordinateSystem, this.state.tMax);
  }

  _onFrame(delta) {
    // The camera readout updates every frame regardless of playback
    // state, since OrbitControls can keep moving (damping/user drag)
    // even while paused - converted back to math space (Z up) so it
    // reads consistently with every other number in the sidebar.
    this.controls.updateCameraReadout(fromRenderVector(this.viewport.sceneManager.camera.position));

    if (!this.state.playing) return;

    this.state.t = Math.min(this.state.t + delta * this.state.speed, this.state.tMax);
    const finished = this.state.t >= this.state.tMax;

    if (!this._syncVisualsToCurrentTime()) {
      // Equation produced a non-finite value (e.g. divide-by-zero) - stop
      // playback so the trail doesn't corrupt itself with NaN points.
      this._pause();
      this.controls.showError(`Undefined value at t = ${this.state.t.toFixed(2)} (check your equations).`);
      return;
    }

    if (finished) this._pause();
  }

  /**
   * Evaluates the motion at the current t (always Cartesian, regardless
   * of which system the equations were entered in - see
   * ParametricMotion.positionAt), updates the particle position, appends
   * a trail point, derives velocity/acceleration, converts the position
   * to cylindrical/spherical coordinates, updates the velocity/
   * acceleration/cylindrical/spherical helpers, and refreshes every
   * readout in the sidebar.
   *
   * Only the *position* being non-finite is treated as a fatal error
   * (matching Phase 2 behavior: playback pauses so the trail doesn't
   * fill with NaN points). Velocity/acceleration going non-finite (e.g.
   * a sharp corner in an equation like abs(t)) is softer - the arrows
   * hide and the readout shows "—" for that instant, but playback
   * keeps running since the *position* is still perfectly valid there.
   * Cylindrical/spherical conversions never produce non-finite output
   * for a finite position (see coordinateSystems.js), so they need no
   * separate validity check.
   *
   * @returns {boolean} false if the position itself was non-finite
   */
  _syncVisualsToCurrentTime() {
    const t = this.state.t;
    const position = this.motion.positionAt(t);
    if (!isFiniteVector(position)) return false;

    this.particle.setPosition(position);
    this.trail.addPoint(position);

    const velocity = this.motion.velocityAt(t);
    const acceleration = this.motion.accelerationAt(t);
    const velocityValid = isFiniteVector(velocity);
    const accelerationValid = isFiniteVector(acceleration);

    this.velocityArrow.update(position, velocityValid ? velocity : ZERO_VECTOR);
    this.accelerationArrow.update(position, accelerationValid ? acceleration : ZERO_VECTOR);

    const cylindrical = cartesianToCylindrical(position);
    const spherical = cartesianToSpherical(position);
    this.cylindricalHelper.update(position, cylindrical);
    this.sphericalHelper.update(position, spherical);
    this.positionVectorArrow.update(position, magnitude(position));

    this.controls.updateReadout(t, position);
    this.controls.updateCylindricalReadout(cylindrical);
    this.controls.updateSphericalReadout(spherical);
    this.controls.updateVelocityReadout(
      velocityValid ? velocity : null,
      velocityValid ? magnitude(velocity) : null
    );
    this.controls.updateAccelerationReadout(
      accelerationValid ? acceleration : null,
      accelerationValid ? magnitude(acceleration) : null
    );
    // Step-by-Step Derivation's Final Result reuses these exact same
    // velocity/acceleration/magnitude values, so it can never disagree
    // with the Velocity/Acceleration sections above.
    this.controls.updateDerivation({
      t,
      velocity: velocityValid ? velocity : null,
      speed: velocityValid ? magnitude(velocity) : null,
      acceleration: accelerationValid ? acceleration : null,
      accelMagnitude: accelerationValid ? magnitude(acceleration) : null,
    });

    return true;
  }

  /**
   * Switches which coordinate system is selected: resets ParametricMotion
   * to that system's default equations (the Motion Equations fields
   * themselves were already reset by MotionControls, which owns that
   * DOM), shows that system's helper visualization (Cartesian has none -
   * the scene's existing axes already represent it), hides the other,
   * and highlights the matching readout heading. All three readouts keep
   * updating regardless of which is selected.
   * @param {'cartesian'|'cylindrical'|'spherical'} system
   */
  _selectCoordinateSystem(system) {
    this.state.coordinateSystem = system;
    this.motion.setEquations(system, DEFAULT_EQUATIONS_BY_SYSTEM[system]);
    this.controls.setDerivationEquations(system, DEFAULT_EQUATIONS_BY_SYSTEM[system]);
    this.controls.setSelectedCoordinateSystem(system);
    this._updateHelperVisibility();
    this._updateCoordLegend(system);
    this.controls.updatePathInfo(system, this.state.tMax);
    this._reset();
  }

  /**
   * Shows/hides/updates the small in-scene legend box for `system`'s
   * symbols (see COORD_LEGEND_BY_SYSTEM and SceneViewport.setCoordLegend).
   * @param {'cartesian'|'cylindrical'|'spherical'} system
   */
  _updateCoordLegend(system) {
    const legend = COORD_LEGEND_BY_SYSTEM[system];
    this.viewport.setCoordLegend(legend ? legend.title : '', legend ? legend.rows : null);
  }

  /**
   * Cylindrical/Spherical helpers are visible only when both (a) that
   * system is the one currently selected above, and (b) that system's
   * own "Helpers" toggle is on - the two conditions are independent, so
   * this is the single place that combines them.
   */
  _updateHelperVisibility() {
    this.cylindricalHelper.setVisible(
      this.state.coordinateSystem === 'cylindrical' && this.state.showCylindricalHelpers
    );
    this.sphericalHelper.setVisible(
      this.state.coordinateSystem === 'spherical' && this.state.showSphericalHelpers
    );
  }

  _toggleCylindricalHelpers(visible) {
    this.state.showCylindricalHelpers = visible;
    this._updateHelperVisibility();
  }

  _toggleSphericalHelpers(visible) {
    this.state.showSphericalHelpers = visible;
    this._updateHelperVisibility();
  }

  unmount() {
    if (this.viewport) this.viewport.sceneManager.removeFrameListener(this._onFrame);
    if (this.particle) this.particle.dispose();
    if (this.trail) this.trail.dispose();
    if (this.velocityArrow) this.velocityArrow.dispose();
    if (this.accelerationArrow) this.accelerationArrow.dispose();
    if (this.cylindricalHelper) this.cylindricalHelper.dispose();
    if (this.sphericalHelper) this.sphericalHelper.dispose();
    if (this.positionVectorArrow) this.positionVectorArrow.dispose();
    if (this.controls) this.controls.dispose();
    if (this.viewport) this.viewport.dispose();
    if (this.el && this.el.parentElement) this.el.parentElement.removeChild(this.el);
  }
}

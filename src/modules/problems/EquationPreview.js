import { SceneViewport } from '../../core/SceneViewport.js';
import { isFiniteVector } from '../../math/vectorMath.js';
import { cartesianToCylindrical, cartesianToSpherical } from '../../math/coordinateSystems.js';
import { Particle } from '../dynamics/Particle.js';
import { TrajectoryTrail } from '../dynamics/TrajectoryTrail.js';
import { CylindricalHelper } from '../dynamics/CylindricalHelper.js';
import { SphericalHelper } from '../dynamics/SphericalHelper.js';

// Matches Spatial Dynamics' own default playback range/speed (see
// DynamicsModule's DEFAULT_T_MAX/DEFAULT_SPEED) so a previewed problem
// plays back at the same pace it would in the main interface. Once t
// reaches T_MAX the preview loops back to 0 - there's no Play/Pause/
// Reset UI here, this is a preview, not a replacement for the Spatial
// Dynamics module itself.
const T_MAX = 20;
const SPEED = 1;

/**
 * EquationPreview
 * ----------------------------------------------------------------------
 * A small, self-contained, looping 3D playback of a validated
 * ParametricMotion, built from the exact same core rendering pieces
 * Spatial Dynamics itself uses (SceneViewport, Particle, TrajectoryTrail,
 * Cylindrical/SphericalHelper). This is what lets the Problem Library's
 * "Apply Equations" button genuinely run a question through Spatial
 * Dynamics' own engine and open its 3D visualization, inline in the Add
 * Problem form - without touching a single file inside modules/dynamics/
 * or navigating anywhere else in the app.
 *
 * Takes an already-constructed, already-valid ParametricMotion rather
 * than raw system/equations, so a bad expression never gets the chance
 * to allocate a WebGL context here - the caller validates first (see
 * ProblemLibraryModule's Apply Equations handler) and only builds this
 * once that succeeds.
 */
export class EquationPreview {
  /**
   * @param {HTMLElement} parent - container to mount into; must already
   *   have a non-zero size (e.g. not `hidden`) when this runs
   * @param {import('../../math/ParametricMotion.js').ParametricMotion} motion
   * @param {'cartesian'|'cylindrical'|'spherical'} system
   */
  constructor(parent, motion, system) {
    this.viewport = new SceneViewport(parent);
    const scene = this.viewport.sceneManager.scene;

    this.motion = motion;
    this.system = system;
    this.t = 0;

    this.particle = new Particle(scene);
    this.trail = new TrajectoryTrail(scene);
    this.cylindricalHelper = system === 'cylindrical' ? new CylindricalHelper(scene) : null;
    this.sphericalHelper = system === 'spherical' ? new SphericalHelper(scene) : null;
    if (this.cylindricalHelper) this.cylindricalHelper.setVisible(true);
    if (this.sphericalHelper) this.sphericalHelper.setVisible(true);

    this._onFrame = this._onFrame.bind(this);
    this.viewport.sceneManager.addFrameListener(this._onFrame);

    this._syncToT(); // draw t=0 immediately, before the first animated frame
  }

  _onFrame(delta) {
    this.t += delta * SPEED;
    if (this.t > T_MAX) {
      this.t = 0;
      this.trail.reset();
    }
    this._syncToT();
  }

  _syncToT() {
    const position = this.motion.positionAt(this.t);
    if (!isFiniteVector(position)) return; // momentarily undefined (e.g. divide-by-zero) - skip, keep looping

    this.particle.setPosition(position);
    this.trail.addPoint(position);

    if (this.cylindricalHelper) this.cylindricalHelper.update(position, cartesianToCylindrical(position));
    if (this.sphericalHelper) this.sphericalHelper.update(position, cartesianToSpherical(position));
  }

  /** Tears down the scene and frees its WebGL context - callers must call this before discarding the instance. */
  dispose() {
    this.viewport.sceneManager.removeFrameListener(this._onFrame);
    this.particle.dispose();
    this.trail.dispose();
    if (this.cylindricalHelper) this.cylindricalHelper.dispose();
    if (this.sphericalHelper) this.sphericalHelper.dispose();
    this.viewport.dispose();
  }
}

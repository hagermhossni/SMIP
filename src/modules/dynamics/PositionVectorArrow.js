import * as THREE from 'three';
import { toRenderVector } from '../../math/vectorMath.js';

const ORIGIN = new THREE.Vector3(0, 0, 0);
const DEFAULT_DIRECTION = new THREE.Vector3(0, 1, 0);

/**
 * PositionVectorArrow
 * ----------------------------------------------------------------------
 * Draws the position vector from the origin to the particle's current
 * location. Unlike VectorArrow (velocity/acceleration, anchored *at*
 * the moving particle), this vector is always anchored at the origin -
 * it's the vector *to* the particle, not a quantity carried *by* it -
 * so it gets its own small class rather than reusing VectorArrow with
 * origin=particle.
 *
 * The 3D scene stays numbers-free (Phase 6): this class only draws the
 * arrow itself. Its symbol ("r" or "\u03C1") and live magnitude are
 * reported by DynamicsModule to the sidebar's Position Information
 * section instead of being drawn here.
 */
export class PositionVectorArrow {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [options]
   * @param {number} [options.color=0xf1f5f9] - distinct from velocity/acceleration/helper colors
   * @param {number} [options.minLength=0.001]
   */
  constructor(scene, options = {}) {
    this.color = options.color ?? 0xf1f5f9;
    this.minLength = options.minLength ?? 0.001;
    this.visible = true;
    this._hasVector = false;

    this.arrow = new THREE.ArrowHelper(DEFAULT_DIRECTION, ORIGIN, this.minLength, this.color);
    this.arrow.visible = false;

    this.scene = scene;
    this.scene.add(this.arrow);
  }

  /**
   * @param {{x:number, y:number, z:number}} position - the particle's current position (the vector's tip), math space
   * @param {number} magnitude - precomputed |position|, so this class never has to know how to compute it
   */
  update(position, magnitude) {
    if (!Number.isFinite(magnitude) || magnitude < 1e-9) {
      this._hasVector = false;
      this.arrow.visible = false;
      return;
    }

    const renderPosition = toRenderVector(position);
    this._direction = this._direction ?? new THREE.Vector3();
    this._direction
      .set(renderPosition.x, renderPosition.y, renderPosition.z)
      .divideScalar(magnitude);

    const headLength = Math.min(magnitude * 0.12, 0.4);
    const headWidth = Math.min(magnitude * 0.09, 0.25);
    this.arrow.setDirection(this._direction);
    this.arrow.setLength(Math.max(magnitude, this.minLength), headLength, headWidth);

    this._hasVector = true;
    this.arrow.visible = this.visible;
  }

  /** @param {boolean} visible - user-facing show/hide toggle */
  setVisible(visible) {
    this.visible = visible;
    this.arrow.visible = visible && this._hasVector;
  }

  dispose() {
    this.scene.remove(this.arrow);
    this.arrow.dispose();
  }
}

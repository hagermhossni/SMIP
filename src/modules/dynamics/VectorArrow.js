import * as THREE from 'three';
import { toRenderVector } from '../../math/vectorMath.js';
import { createTextSprite, disposeTextSprite } from '../../core/TextSprite.js';

const ZERO = new THREE.Vector3(0, 0, 0);
const DEFAULT_DIRECTION = new THREE.Vector3(0, 1, 0);

// How far past the arrow's own tip the label sprite sits, in scene
// units - just enough that the glyph clears the arrowhead instead of
// overlapping it.
const LABEL_TIP_OFFSET = 0.35;

/**
 * VectorArrow
 * ----------------------------------------------------------------------
 * A single THREE.ArrowHelper anchored to the moving particle, used to
 * visualize a per-frame vector quantity (velocity, acceleration, ...)
 * as a directional arrow. This is Dynamics-specific visual logic - like
 * Particle.js and TrajectoryTrail.js, it knows about Three.js meshes
 * but nothing about ParametricMotion, playback state, or the panel.
 *
 * Raw velocity/acceleration magnitudes rarely match the scene's spatial
 * scale (grid units), so the arrow length is the vector's magnitude
 * times a fixed `scale` factor - long enough to read as a direction,
 * short enough not to dominate the viewport. This means arrow length is
 * only *proportional* to the physical magnitude, not equal to it; the
 * numeric magnitude is what the readout panel is for.
 *
 * When `options.label` is given, a small always-camera-facing symbol
 * sprite (same fixed-teaching-symbol pattern as CylindricalHelper/
 * SphericalHelper's r/theta/phi/rho labels - see core/TextSprite.js) is
 * drawn just past the arrow's tip, in the arrow's own color, so two
 * arrows of similar length/direction can still be told apart at a
 * glance (e.g. "V" for velocity vs "a" for acceleration). Like those
 * other labels, it's a fixed symbol only - never a live number.
 */
export class VectorArrow {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [options]
   * @param {number} [options.color=0xffffff]
   * @param {number} [options.scale=1] - multiplies raw magnitude to get arrow length
   * @param {number} [options.minLength=0.001] - floor so a tiny vector still shows a visible stub
   * @param {string} [options.label] - optional fixed symbol drawn at the arrow's tip (e.g. "V", "a")
   * @param {string} [options.labelColor] - CSS color for the label; defaults to match `color`
   */
  constructor(scene, options = {}) {
    this.color = options.color ?? 0xffffff;
    this.scale = options.scale ?? 1;
    this.minLength = options.minLength ?? 0.001;
    this.visible = true; // user-facing visibility toggle

    this.arrow = new THREE.ArrowHelper(DEFAULT_DIRECTION, ZERO, this.minLength, this.color);
    this.arrow.visible = false; // nothing to show until the first update()
    this._hasVector = false; // whether the last update() had a valid, non-zero vector

    if (options.label) {
      const labelColor = options.labelColor ?? cssColor(this.color);
      this.label = createTextSprite(options.label, { color: labelColor, scale: 0.5, fontSize: 80 });
      this.label.visible = false;
    }

    this.scene = scene;
    this.scene.add(this.arrow);
    if (this.label) this.scene.add(this.label);
  }

  /**
   * Repositions the arrow at `origin` and points it along `vector`,
   * scaling its length to the vector's magnitude.
   * @param {{x:number, y:number, z:number}} origin - the particle's current position
   * @param {{x:number, y:number, z:number}} vector - the quantity to display (velocity or acceleration)
   */
  update(origin, vector) {
    const rawLength = Math.sqrt(
      vector.x * vector.x + vector.y * vector.y + vector.z * vector.z
    );

    // A (near-)zero vector has no defined direction - hide rather than
    // point an arrow of length ~0 in an arbitrary direction.
    if (!Number.isFinite(rawLength) || rawLength < 1e-9) {
      this._hasVector = false;
      this.arrow.visible = false;
      if (this.label) this.label.visible = false;
      return;
    }

    // toRenderVector is a pure rotation (no translation/scaling), so it
    // preserves length - dividing the transformed vector by the
    // already-computed math-space rawLength still yields a unit vector.
    const renderVector = toRenderVector(vector);
    this._direction = this._direction ?? new THREE.Vector3();
    this._direction.set(renderVector.x, renderVector.y, renderVector.z).divideScalar(rawLength);

    const length = Math.max(rawLength * this.scale, this.minLength);
    const headLength = Math.min(length * 0.25, 0.4);
    const headWidth = Math.min(length * 0.18, 0.25);

    const renderOrigin = toRenderVector(origin);
    this.arrow.position.set(renderOrigin.x, renderOrigin.y, renderOrigin.z);
    this.arrow.setDirection(this._direction);
    this.arrow.setLength(length, headLength, headWidth);

    this._hasVector = true;
    this.arrow.visible = this.visible;

    if (this.label) {
      // Just past the arrow's own tip, along the same direction, so the
      // glyph clears the arrowhead instead of overlapping it.
      const tipDist = length + LABEL_TIP_OFFSET;
      this.label.position.set(
        renderOrigin.x + this._direction.x * tipDist,
        renderOrigin.y + this._direction.y * tipDist,
        renderOrigin.z + this._direction.z * tipDist
      );
      this.label.visible = this.visible;
    }
  }

  /** @param {boolean} visible - user-facing show/hide toggle */
  setVisible(visible) {
    this.visible = visible;
    // Reflects immediately using the last computed vector, rather than
    // waiting for the next update() to reveal a just-toggled-on arrow.
    this.arrow.visible = visible && this._hasVector;
    if (this.label) this.label.visible = visible && this._hasVector;
  }

  dispose() {
    this.scene.remove(this.arrow);
    this.arrow.dispose();
    if (this.label) {
      this.scene.remove(this.label);
      disposeTextSprite(this.label);
    }
  }
}

/** @param {number} hex - a 0xRRGGBB color @returns {string} the equivalent CSS hex color string */
function cssColor(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

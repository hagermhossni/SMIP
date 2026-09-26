import * as THREE from 'three';
import { toRenderVector } from '../math/vectorMath.js';
import { createTextSprite, disposeTextSprite } from './TextSprite.js';

// One entry per axis, in math space (Z is vertical/up; X and Y are
// horizontal - see math/vectorMath.js for how this gets remapped onto
// Three.js's own Y-up engine convention). Colors match SceneManager's
// axis line colors and the sidebar's axis legend.
const AXIS_DEFS = [
  { dir: { x: 1, y: 0, z: 0 }, hex: 0xf2545b, letter: 'X' },
  { dir: { x: 0, y: 1, z: 0 }, hex: 0x4fd69c, letter: 'Y' },
  { dir: { x: 0, y: 0, z: 1 }, hex: 0x4fa8ff, letter: 'Z' }, // (vertical)
];

// Spacing (in scene units) between tick marks. axesLength=10 with an
// interval of 2 gives 5 ticks per direction per axis - enough to read
// the scale without crowding the viewport.
const TICK_INTERVAL = 2;
const TICK_MARK_HALF_LENGTH = 0.16;

// How far past the end of each axis line its letter sprite sits, and how
// far the "O" origin label sits from the origin dot itself (offset to
// the side so it doesn't sit on top of the dot or any axis line).
const AXIS_LABEL_OFFSET = 0.7;
const ORIGIN_LABEL_OFFSET = { x: -0.35, y: -0.35, z: 0.3 };

/**
 * AxisAnnotations
 * ----------------------------------------------------------------------
 * Adds the permanent teaching annotations around SceneManager's grid +
 * colored axes: the X/Y/Z axis names and an "O" origin label (as
 * camera-facing text sprites - see core/TextSprite.js), a small dot at
 * the origin, and tick lines along each axis. Built once in
 * SceneManager's constructor (so every module - Dynamics, Geometry, and
 * later ones - gets it automatically), never touched per-frame; the
 * only "live" behavior is the two visibility toggles modules wire up to
 * their own UI. No live/numeric value is ever drawn here - every number
 * (position, camera coordinates, etc.) stays in the sidebar's Data
 * Panel; only the fixed symbols above.
 *
 * Two independently toggleable groups, matching the two toggles exposed
 * in the sidebar's Display Options section:
 *   - markerGroup: the origin dot + "O" label + X/Y/Z axis letters ("Axis Labels")
 *   - scaleGroup: the tick marks ("Axis Ticks")
 */
export class AxisAnnotations {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [options]
   * @param {number} [options.length=10] - matches SceneManager's axesLength
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.length = options.length ?? 10;

    this.markerGroup = new THREE.Group();
    this.scaleGroup = new THREE.Group();
    this.group = new THREE.Group();
    this.group.add(this.markerGroup, this.scaleGroup);
    this.scene.add(this.group);

    this._tickGeometries = [];
    this._tickMaterials = [];
    this._labelSprites = [];

    this._buildOriginMarker();
    this._buildAxisLabels();
    this._buildTicks();
  }

  _buildOriginMarker() {
    const geometry = new THREE.SphereGeometry(0.07, 16, 12);
    const material = new THREE.MeshBasicMaterial({ color: 0xe6edf3 });
    this.originDot = new THREE.Mesh(geometry, material);
    this.markerGroup.add(this.originDot);

    const originLabel = createTextSprite('O', { color: '#e6edf3', scale: 0.45 });
    const pos = toRenderVector(ORIGIN_LABEL_OFFSET);
    originLabel.position.set(pos.x, pos.y, pos.z);
    this.markerGroup.add(originLabel);
    this._labelSprites.push(originLabel);
  }

  _buildAxisLabels() {
    AXIS_DEFS.forEach(({ dir, hex, letter }) => {
      const color = `#${hex.toString(16).padStart(6, '0')}`;
      const sprite = createTextSprite(letter, { color, scale: 0.6 });
      const mathPos = scale(dir, this.length + AXIS_LABEL_OFFSET);
      const pos = toRenderVector(mathPos);
      sprite.position.set(pos.x, pos.y, pos.z);
      this.markerGroup.add(sprite);
      this._labelSprites.push(sprite);
    });
  }

  _buildTicks() {
    AXIS_DEFS.forEach(({ dir, hex }) => {
      const material = new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: 0.55 });
      this._tickMaterials.push(material);

      const [perpA] = perpendicularsFor(dir);

      for (let n = -this.length; n <= this.length; n += TICK_INTERVAL) {
        if (n === 0) continue; // the origin marker already covers this point

        const center = scale(dir, n);
        const p1 = toRenderVector(add(center, scale(perpA, TICK_MARK_HALF_LENGTH)));
        const p2 = toRenderVector(add(center, scale(perpA, -TICK_MARK_HALF_LENGTH)));

        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(p1.x, p1.y, p1.z),
          new THREE.Vector3(p2.x, p2.y, p2.z),
        ]);
        this._tickGeometries.push(geometry);
        this.scaleGroup.add(new THREE.Line(geometry, material));
      }
    });
  }

  /** @param {boolean} visible - the origin marker dot */
  setLabelsVisible(visible) {
    this.markerGroup.visible = visible;
  }

  /** @param {boolean} visible - tick marks along the three axes */
  setScaleVisible(visible) {
    this.scaleGroup.visible = visible;
  }

  dispose() {
    this.scene.remove(this.group);

    this.originDot.geometry.dispose();
    this.originDot.material.dispose();

    this._labelSprites.forEach((sprite) => disposeTextSprite(sprite));

    this._tickGeometries.forEach((geometry) => geometry.dispose());
    this._tickMaterials.forEach((material) => material.dispose());
  }
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(v, s) {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

/**
 * @param {{x:number,y:number,z:number}} axisDir - math-space unit vector along an axis
 * @returns {{x:number,y:number,z:number}[]} two unit vectors perpendicular to axisDir,
 *   used to offset a tick mark away from the axis line itself
 */
function perpendicularsFor(axisDir) {
  if (axisDir.x === 1) return [{ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }];
  if (axisDir.y === 1) return [{ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }];
  return [{ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }];
}

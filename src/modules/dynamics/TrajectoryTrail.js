import * as THREE from 'three';
import { toRenderVector } from '../../math/vectorMath.js';

/**
 * TrajectoryTrail
 * ----------------------------------------------------------------------
 * Draws the path the particle has traveled as a line, built from a
 * pre-allocated buffer so points can be appended every frame without
 * creating garbage (no new arrays/geometries per frame).
 *
 * Trade-off (documented, not hidden): the buffer has a fixed capacity
 * (`maxPoints`). Once reached, the trail simply stops growing further -
 * appropriate for an educational demo where trails are reset often via
 * the Reset control, rather than shifting/re-indexing a ring buffer.
 */
export class TrajectoryTrail {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [options]
   * @param {number} [options.maxPoints=4000]
   * @param {number} [options.color=0x4fa8ff]
   */
  constructor(scene, options = {}) {
    this.maxPoints = options.maxPoints ?? 4000;
    const color = options.color ?? 0x4fa8ff;

    this.positions = new Float32Array(this.maxPoints * 3);
    this.count = 0;

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setDrawRange(0, 0);

    // Two lines sharing the same geometry/positions: a faint, low-opacity
    // "halo" copy drawn first, then a crisp, fully-opaque "core" copy on
    // top. Plain THREE.Line ignores linewidth on most WebGL backends, so
    // a single line always renders hairline-thin regardless of any width
    // value - layering a soft halo behind the core is what reads as a
    // smoother, easier-to-follow trajectory without adding a new
    // dependency (e.g. Line2/fat-lines) or touching any math.
    this.haloMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22 });
    this.material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
    this.haloLine = new THREE.Line(this.geometry, this.haloMaterial);
    this.line = new THREE.Line(this.geometry, this.material);
    this.haloLine.renderOrder = 0;
    this.line.renderOrder = 1;

    this.group = new THREE.Group();
    this.group.add(this.haloLine, this.line);

    this.scene = scene;
    this.scene.add(this.group);
  }

  /** @param {{x:number, y:number, z:number}} point - math space (Z up) */
  addPoint(point) {
    if (this.count >= this.maxPoints) return; // capped, see class doc

    const r = toRenderVector(point);
    const i = this.count * 3;
    this.positions[i] = r.x;
    this.positions[i + 1] = r.y;
    this.positions[i + 2] = r.z;
    this.count += 1;

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.setDrawRange(0, this.count);
  }

  /** Clears the trail back to empty, ready for a fresh run. */
  reset() {
    this.count = 0;
    this.geometry.setDrawRange(0, 0);
  }

  /** @param {boolean} visible - user-facing show/hide toggle */
  setVisible(visible) {
    this.group.visible = visible;
  }

  dispose() {
    this.scene.remove(this.group);
    this.geometry.dispose();
    this.material.dispose();
    this.haloMaterial.dispose();
  }
}

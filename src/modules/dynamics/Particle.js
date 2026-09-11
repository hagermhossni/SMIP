import * as THREE from 'three';
import { toRenderVector } from '../../math/vectorMath.js';

/**
 * Particle
 * ----------------------------------------------------------------------
 * A small sphere mesh representing the moving point in space. This is
 * Dynamics-specific visual logic (not generic enough for core/), so it
 * lives inside modules/dynamics/. `position` is always given in math
 * space (Z up); see math/vectorMath.js's toRenderVector for why/how
 * this gets remapped before reaching Three.js.
 */
export class Particle {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [options]
   * @param {number} [options.radius=0.28]
   * @param {number} [options.color=0xe8a33d] - matches --smip-accent
   */
  constructor(scene, options = {}) {
    const radius = options.radius ?? 0.28;
    const color = options.color ?? 0xe8a33d;

    this.geometry = new THREE.SphereGeometry(radius, 24, 16);
    this.material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.scene = scene;
    this.scene.add(this.mesh);
  }

  /** @param {{x:number, y:number, z:number}} position - math space (Z up) */
  setPosition(position) {
    const r = toRenderVector(position);
    this.mesh.position.set(r.x, r.y, r.z);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}

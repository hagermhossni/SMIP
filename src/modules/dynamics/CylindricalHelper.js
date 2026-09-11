import * as THREE from 'three';
import { ringPoints, azimuthalArcPoints, ANGLE_ARC_RADIUS } from '../../math/coordinateSystems.js';
import { toRenderVector } from '../../math/vectorMath.js';
import { createTextSprite, disposeTextSprite } from '../../core/TextSprite.js';

const HELPER_COLOR = 0xffd166;
const LABEL_COLOR = '#ffd166';

/**
 * CylindricalHelper
 * ----------------------------------------------------------------------
 * Draws the cylindrical (rho, phi, z) decomposition of the particle's
 * current position as line elements anchored to the origin/z-axis:
 *   - the ground-projection line: from the origin O, IN THE XY PLANE
 *     (z=0), out to P' = (x, y, 0) - the particle P's own projection
 *     onto the XY plane. THIS is rho: the distance from O to the
 *     particle's projection onto the XY plane, per definition, so it
 *     is drawn as the solid, primary line (and is what the rho label
 *     tracks) and also gives the phi arc below something real to
 *     terminate on
 *   - a dashed helper line, at the particle's own height z, from the
 *     z-axis out to the particle - the same direction/length as the
 *     ground-projection line above, just translated up to the
 *     particle's height so the particle's horizontal offset from the
 *     z-axis is visible at a glance (a reference aid, not rho itself)
 *   - a dashed height line along the z-axis up to the particle's z
 *   - a ring at the particle's height, radius rho (the "constant rho, z" locus)
 *   - phi arc: sweeps from angle 0 to phi, IN THE XY PLANE (z=0),
 *     centered on the origin - so it starts exactly on the real
 *     positive X-axis (which also passes through the origin at z=0)
 *     and ends exactly on the ground-projection line's direction,
 *     rather than floating disconnected from either
 * The arc's radius is capped at rho itself, so it never overshoots past
 * the point where the ground-projection line actually ends.
 *
 * Also places three larger, always-camera-facing symbol labels -
 * "\u03C1", "\u03C6", "z" (see core/TextSprite.js) - beside the radius
 * line, angle arc, and height line respectively, so students can tell
 * which line represents which quantity. These are fixed symbols only,
 * repositioned each frame to track the particle; the live numeric
 * rho/phi/z values themselves are reported to the sidebar's Coordinate
 * Systems section instead of being drawn in the scene.
 *
 * Like Particle.js/TrajectoryTrail.js, this is Dynamics-specific visual
 * logic - it knows about Three.js meshes but nothing about
 * ParametricMotion, playback state, or the panel. DynamicsModule feeds
 * it a position and the already-converted cylindrical coordinates
 * every frame; only visible while the Cylindrical coordinate view is
 * selected AND the "Cylindrical Helpers" toggle is on.
 *
 * The height line and ground-projection line are both dashed (distinct
 * from the solid radius line/ring/arc) so they read as reference/
 * measurement aids rather than the radius itself - THREE.Line dashes
 * require computeLineDistances() to be called after every geometry
 * change, so they share their own material separate from the solid lines.
 */
export class CylindricalHelper {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [options]
   * @param {number} [options.color=0xffd166]
   */
  constructor(scene, options = {}) {
    this.color = options.color ?? HELPER_COLOR;
    this.material = new THREE.LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.85,
    });
    this.dashedMaterial = new THREE.LineDashedMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.85,
      dashSize: 0.22,
      gapSize: 0.14,
    });

    // Dashed helper line, at the particle's height z - NOT rho itself,
    // just a reference aid (see class doc above), so it shares the
    // dashed material with the height line.
    this.radiusLine = new THREE.Line(new THREE.BufferGeometry(), this.dashedMaterial);
    this.heightLine = new THREE.Line(new THREE.BufferGeometry(), this.dashedMaterial);
    this.radiusRing = new THREE.Line(new THREE.BufferGeometry(), this.material);
    this.phiArc = new THREE.Line(new THREE.BufferGeometry(), this.material);
    // Ground-projection of the particle onto the XY plane (z=0), from
    // the origin O to P' = (x, y, 0) - this IS rho by definition, so it
    // is the solid, primary line and gives the phi arc (also in the XY
    // plane) a real drawn line to terminate on at angle phi.
    this.groundProjectionLine = new THREE.Line(new THREE.BufferGeometry(), this.material);

    // Larger than before (was 0.42) and rendered from a bigger canvas
    // font so the glyphs stay crisp at the larger on-screen size -
    // these are read-at-a-glance teaching symbols, so they should be at
    // least as legible as the axis letters (AxisAnnotations uses 0.6).
    const LABEL_SCALE = 0.62;
    const LABEL_FONT_SIZE = 92;
    this.rhoLabel = createTextSprite('\u03C1', { color: LABEL_COLOR, scale: LABEL_SCALE, fontSize: LABEL_FONT_SIZE });
    this.phiLabel = createTextSprite('\u03C6', { color: LABEL_COLOR, scale: LABEL_SCALE, fontSize: LABEL_FONT_SIZE });
    this.zLabel = createTextSprite('z', { color: LABEL_COLOR, scale: LABEL_SCALE, fontSize: LABEL_FONT_SIZE });

    this.group = new THREE.Group();
    this.group.add(
      this.radiusLine,
      this.heightLine,
      this.radiusRing,
      this.phiArc,
      this.groundProjectionLine,
      this.rhoLabel,
      this.phiLabel,
      this.zLabel
    );
    this.group.visible = false; // shown only when the Cylindrical view is selected

    this.scene = scene;
    this.scene.add(this.group);
  }

  /**
   * @param {{x:number, y:number, z:number}} position - math space
   * @param {{rho:number, phi:number, z:number}} cylindrical
   */
  update(position, cylindrical) {
    const { rho, phi, z } = cylindrical;

    // Dashed helper line at the particle's own height z - a reference
    // aid, translated up from the ground-projection line below, NOT
    // rho itself.
    this.radiusLine.geometry.setFromPoints(
      [{ x: 0, y: 0, z }, position].map(toRenderVector)
    );
    this.radiusLine.computeLineDistances(); // required for dashed lines after any geometry change
    this.heightLine.geometry.setFromPoints(
      [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z }].map(toRenderVector)
    );
    this.heightLine.computeLineDistances(); // required for dashed lines after any geometry change
    this.radiusRing.geometry.setFromPoints(ringPoints(rho, z).map(toRenderVector));

    // Ground projection of the particle P onto the XY plane (z=0): the
    // segment from O to P' = (x, y, 0) - this IS rho, the distance from
    // O to the particle's projection onto the XY plane.
    this.groundProjectionLine.geometry.setFromPoints(
      [{ x: 0, y: 0, z: 0 }, { x: position.x, y: position.y, z: 0 }].map(toRenderVector)
    );

    // Phi is the azimuth angle in the XY plane, measured from the
    // positive X-axis to the radial direction. The arc is centered on
    // the origin and drawn at z=0 - the XY plane - so it starts exactly
    // on the real X-axis (which passes through the same origin at the
    // same height) and, by capping its radius at rho, its far end always
    // lands exactly on the ground-projection line above rather than
    // overshooting past it or floating disconnected from both.
    const arcRadius = Math.min(ANGLE_ARC_RADIUS, Math.max(rho, 0.001));
    this.phiArc.geometry.setFromPoints(
      azimuthalArcPoints(phi, arcRadius, 0).map(toRenderVector)
    );

    // Label positions: the rho label tracks the midpoint of the
    // ground-projection line (z=0) - the line that actually represents
    // rho now - and the z label tracks the midpoint of the (dashed)
    // height line; the phi label sits in the same z=0 plane as the arc,
    // just past its sweep, offset further out than the arc itself so it
    // reads clearly without overlapping either the arc or the
    // ground-projection line.
    setSpritePosition(this.rhoLabel, toRenderVector({ x: position.x / 2, y: position.y / 2, z: 0 }));
    const phiMid = phi / 2;
    const phiLabelRadius = arcRadius + 0.5;
    setSpritePosition(
      this.phiLabel,
      toRenderVector({
        x: Math.cos(phiMid) * phiLabelRadius,
        y: Math.sin(phiMid) * phiLabelRadius,
        z: 0,
      })
    );
    setSpritePosition(this.zLabel, toRenderVector({ x: 0.35, y: 0.35, z: z / 2 }));
  }

  /** @param {boolean} visible - shown only while this coordinate view is selected */
  setVisible(visible) {
    this.group.visible = visible;
  }

  dispose() {
    this.scene.remove(this.group);
    [this.radiusLine, this.heightLine, this.radiusRing, this.phiArc, this.groundProjectionLine].forEach(
      (line) => line.geometry.dispose()
    );
    [this.rhoLabel, this.phiLabel, this.zLabel].forEach((sprite) => disposeTextSprite(sprite));
    this.material.dispose();
    this.dashedMaterial.dispose();
  }
}

/** @param {THREE.Sprite} sprite @param {{x:number,y:number,z:number}} renderPos */
function setSpritePosition(sprite, renderPos) {
  sprite.position.set(renderPos.x, renderPos.y, renderPos.z);
}

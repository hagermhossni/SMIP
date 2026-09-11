import * as THREE from 'three';
import {
  ringPoints,
  azimuthalArcPoints,
  meridianCirclePoints,
  polarArcPoints,
  ANGLE_ARC_RADIUS,
} from '../../math/coordinateSystems.js';
import { toRenderVector } from '../../math/vectorMath.js';
import { createTextSprite, disposeTextSprite } from '../../core/TextSprite.js';

const HELPER_COLOR = 0xa78bfa;
const LABEL_COLOR = '#a78bfa';

/**
 * SphericalHelper
 * ----------------------------------------------------------------------
 * Draws the spherical (r, theta, phi) decomposition of the particle's
 * current position as line elements anchored to the origin:
 *   - a radius line straight from the origin to the particle (r) -
 *     this is the position vector itself, so both angle arcs below
 *     share its exact starting vertex (the origin)
 *   - the ground-projection line: from the origin O, in the XY plane
 *     (z=0), out to P' = (x, y, 0) - the particle P's own projection
 *     onto the XY plane. Its length is r*sin(theta), NOT r - it is
 *     the projection of the radius vector r onto the XY plane, drawn
 *     dashed (a reference aid) since the radius line above is the
 *     real r. Also gives the phi arc below a real drawn segment to
 *     terminate on at angle phi.
 *   - the equatorial great circle of radius r (z=0 plane)
 *   - the meridian great circle of radius r through both poles, at
 *     the particle's azimuth (visualizes the "constant r" shell)
 *   - phi arc: sweeps 0 -> phi in the equatorial (XY) plane, from
 *     the +X axis - measured independently of theta, per convention
 *   - theta arc: sweeps from the +z axis (theta=0) -> theta, in the
 *     meridian plane, directly between the +Z axis and the radius line
 *     above
 * Both arcs are centered on the origin - the same vertex the +Z axis
 * passes through and the radius line starts from - and their radius is
 * capped at r itself, so neither arc floats independently or
 * overshoots past where the radius line actually ends: the theta arc's
 * far end always lands exactly on the radius line's direction, and its
 * near end always lands exactly on the +Z axis.
 *
 * Also places three larger, always-camera-facing symbol labels -
 * "r", "\u03B8", "\u03C6" (see core/TextSprite.js) - beside the
 * radius line, polar arc, and equatorial arc respectively, so students
 * can tell which line represents which quantity. These are fixed
 * symbols only, repositioned each frame to track the particle; the live
 * numeric r/theta/phi values themselves are reported to the sidebar's
 * Coordinate Systems section instead of being drawn in the scene.
 *
 * Like Particle.js/TrajectoryTrail.js, this is Dynamics-specific visual
 * logic - it knows about Three.js meshes but nothing about
 * ParametricMotion, playback state, or the panel. DynamicsModule feeds
 * it a position and the already-converted spherical coordinates every
 * frame; only visible while the Spherical coordinate view is selected
 * AND the "Spherical Helpers" toggle is on.
 */
export class SphericalHelper {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [options]
   * @param {number} [options.color=0xa78bfa]
   */
  constructor(scene, options = {}) {
    this.color = options.color ?? HELPER_COLOR;
    this.material = new THREE.LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.85,
    });
    // Dashed, like CylindricalHelper's ground-projection/height lines -
    // marks the projection line as a reference aid, distinct from the
    // real radius line (r) itself.
    this.dashedMaterial = new THREE.LineDashedMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.85,
      dashSize: 0.22,
      gapSize: 0.14,
    });

    this.radiusLine = new THREE.Line(new THREE.BufferGeometry(), this.material);
    // Ground projection of the radius vector r onto the XY plane: from
    // the origin O to P' = (x, y, 0), the projection of the particle P
    // itself onto that plane - NOT capped/rescaled to any arc radius.
    this.projectionLine = new THREE.Line(new THREE.BufferGeometry(), this.dashedMaterial);
    this.equatorCircle = new THREE.Line(new THREE.BufferGeometry(), this.material);
    this.meridianCircle = new THREE.Line(new THREE.BufferGeometry(), this.material);
    this.phiArc = new THREE.Line(new THREE.BufferGeometry(), this.material);
    this.thetaArc = new THREE.Line(new THREE.BufferGeometry(), this.material);

    // Larger than before (was 0.42) and rendered from a bigger canvas
    // font so the glyphs stay crisp at the larger on-screen size -
    // these are read-at-a-glance teaching symbols, so they should be at
    // least as legible as the axis letters (AxisAnnotations uses 0.6).
    const LABEL_SCALE = 0.62;
    const LABEL_FONT_SIZE = 92;
    this.rLabel = createTextSprite('r', { color: LABEL_COLOR, scale: LABEL_SCALE, fontSize: LABEL_FONT_SIZE });
    this.thetaLabel = createTextSprite('\u03B8', { color: LABEL_COLOR, scale: LABEL_SCALE, fontSize: LABEL_FONT_SIZE });
    this.phiLabel = createTextSprite('\u03C6', { color: LABEL_COLOR, scale: LABEL_SCALE, fontSize: LABEL_FONT_SIZE });

    this.group = new THREE.Group();
    this.group.add(
      this.radiusLine,
      this.projectionLine,
      this.equatorCircle,
      this.meridianCircle,
      this.phiArc,
      this.thetaArc,
      this.rLabel,
      this.thetaLabel,
      this.phiLabel
    );
    this.group.visible = false; // shown only when the Spherical view is selected

    this.scene = scene;
    this.scene.add(this.group);
  }

  /**
   * @param {{x:number, y:number, z:number}} position - math space
   * @param {{r:number, theta:number, phi:number}} spherical
   */
  update(position, spherical) {
    const { r, theta, phi } = spherical;

    this.radiusLine.geometry.setFromPoints(
      [{ x: 0, y: 0, z: 0 }, position].map(toRenderVector)
    );

    // Projection of r onto the XY plane: from O to P' = (x, y, 0), the
    // particle's own projection onto that plane - independent of the
    // angle-arc radius below, so its length is the real r*sin(theta).
    this.projectionLine.geometry.setFromPoints(
      [{ x: 0, y: 0, z: 0 }, { x: position.x, y: position.y, z: 0 }].map(toRenderVector)
    );
    this.projectionLine.computeLineDistances(); // required for dashed lines after any geometry change

    this.equatorCircle.geometry.setFromPoints(ringPoints(r, 0).map(toRenderVector));
    this.meridianCircle.geometry.setFromPoints(meridianCirclePoints(phi, r).map(toRenderVector));

    // Both arcs are centered on the origin - the same vertex the radius
    // line (r, the position vector) starts from - and capped at r
    // itself so neither ever overshoots past where that line actually
    // ends. The theta arc in particular sweeps exactly from the +Z axis
    // (which also passes through the origin) to the radius line's own
    // direction, so it visibly connects the two vectors it measures
    // rather than floating at an unrelated size.
    const arcRadius = Math.min(ANGLE_ARC_RADIUS, Math.max(r, 0.001));
    this.phiArc.geometry.setFromPoints(
      azimuthalArcPoints(phi, arcRadius, 0).map(toRenderVector)
    );
    this.thetaArc.geometry.setFromPoints(
      polarArcPoints(phi, theta, arcRadius).map(toRenderVector)
    );

    // Label positions: midpoint of the radius line, just past the phi
    // arc's sweep (equatorial plane), and just past the theta arc's
    // sweep (meridian plane, measured down from +z) - offset further
    // out than the arcs themselves so the glyphs clear both the arc and
    // the radius line instead of overlapping them.
    setSpritePosition(this.rLabel, toRenderVector({ x: position.x / 2, y: position.y / 2, z: position.z / 2 }));
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
    const thetaMid = theta / 2;
    const thetaLabelRadius = arcRadius + 0.5;
    setSpritePosition(
      this.thetaLabel,
      toRenderVector({
        x: Math.cos(phi) * Math.sin(thetaMid) * thetaLabelRadius,
        y: Math.sin(phi) * Math.sin(thetaMid) * thetaLabelRadius,
        z: Math.cos(thetaMid) * thetaLabelRadius,
      })
    );
  }

  /** @param {boolean} visible - shown only while this coordinate view is selected */
  setVisible(visible) {
    this.group.visible = visible;
  }

  dispose() {
    this.scene.remove(this.group);
    [this.radiusLine, this.projectionLine, this.equatorCircle, this.meridianCircle, this.phiArc, this.thetaArc].forEach(
      (line) => line.geometry.dispose()
    );
    [this.rLabel, this.thetaLabel, this.phiLabel].forEach((sprite) => disposeTextSprite(sprite));
    this.material.dispose();
    this.dashedMaterial.dispose();
  }
}

/** @param {THREE.Sprite} sprite @param {{x:number,y:number,z:number}} renderPos */
function setSpritePosition(sprite, renderPos) {
  sprite.position.set(renderPos.x, renderPos.y, renderPos.z);
}

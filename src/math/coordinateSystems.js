/**
 * coordinateSystems
 * ----------------------------------------------------------------------
 * Pure computation for Phase 4: converts a Cartesian {x,y,z} position
 * into cylindrical and spherical coordinates, plus generates the plain
 * {x,y,z} point arrays used to draw the cylindrical/spherical coordinate
 * helpers. No Three.js or DOM dependency - CylindricalHelper.js and
 * SphericalHelper.js feed these point arrays straight into
 * THREE.BufferGeometry.setFromPoints(), which accepts plain {x,y,z}
 * objects just as well as THREE.Vector3 instances.
 *
 * CONVENTION (fixed, ISO/physics naming - do not rename or swap):
 *   Spherical:   r     = radial distance from the origin
 *                theta = polar angle, measured from the +z axis
 *                phi   = azimuthal angle, in the xy-plane, from the +x axis
 *     x = r*sin(theta)*cos(phi), y = r*sin(theta)*sin(phi), z = r*cos(theta)
 *
 *   Cylindrical: rho   = radial distance from the z-axis
 *                phi   = azimuthal angle, in the xy-plane, from the +x axis
 *                z     = vertical coordinate
 *     x = rho*cos(phi), y = rho*sin(phi), z = z
 *
 * Cylindrical and spherical share the same azimuthal angle phi
 * (atan2(y, x)). Spherical's theta is the polar angle from +z (0 at the
 * pole, PI/2 at the equator). r is never used as a name in Cylindrical,
 * and theta is never used as a substitute for phi in Cylindrical.
 */

// Fixed display radius for the theta/phi angle-indicator arcs. These
// arcs exist to show an *angle*, not a distance, so they intentionally
// don't scale with r/rho - otherwise a large-radius particle would draw
// an arc too big to read, and a near-zero-radius one would draw an arc
// too small to see.
export const ANGLE_ARC_RADIUS = 1.4;

const ARC_SEGMENTS = 48;
const RING_SEGMENTS = 96;

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

/**
 * @param {number} theta - any angle in radians
 * @returns {number} the equivalent angle normalized to [0, 2*PI)
 */
export function normalizeAngle(theta) {
  const twoPi = Math.PI * 2;
  return ((theta % twoPi) + twoPi) % twoPi;
}

/**
 * @param {{x:number, y:number, z:number}} position
 * @returns {{rho:number, phi:number, z:number}}
 */
export function cartesianToCylindrical({ x, y, z }) {
  const rho = Math.sqrt(x * x + y * y);
  const phi = normalizeAngle(Math.atan2(y, x));
  return { rho, phi, z };
}

/**
 * @param {{x:number, y:number, z:number}} position
 * @returns {{r:number, theta:number, phi:number}}
 */
export function cartesianToSpherical({ x, y, z }) {
  const r = Math.sqrt(x * x + y * y + z * z);
  const phi = normalizeAngle(Math.atan2(y, x));
  // acos is only defined on [-1, 1]; clamp guards against z/r landing
  // microscopically outside that range from floating-point round-off
  // (which would otherwise produce theta = NaN).
  const theta = r < 1e-9 ? 0 : Math.acos(clamp(z / r, -1, 1));
  return { r, theta, phi };
}

/**
 * Inverse of cartesianToCylindrical - used when the user enters motion
 * equations in cylindrical form (rho(t), phi(t), z(t)) so the rest of
 * the app (ParametricMotion, rendering, trails) can keep working
 * exclusively in Cartesian.
 * @param {{rho:number, phi:number, z:number}} cylindrical
 * @returns {{x:number, y:number, z:number}}
 */
export function cylindricalToCartesian({ rho, phi, z }) {
  return { x: rho * Math.cos(phi), y: rho * Math.sin(phi), z };
}

/**
 * Inverse of cartesianToSpherical - used when the user enters motion
 * equations in spherical form (r(t), theta(t), phi(t)).
 * @param {{r:number, theta:number, phi:number}} spherical
 * @returns {{x:number, y:number, z:number}}
 */
export function sphericalToCartesian({ r, theta, phi }) {
  const sinTheta = Math.sin(theta);
  return {
    x: r * sinTheta * Math.cos(phi),
    y: r * sinTheta * Math.sin(phi),
    z: r * Math.cos(theta),
  };
}

/**
 * A full horizontal circle of points at the given height, centered on
 * the z-axis - the cylindrical "constant r, constant z" ring, and also
 * used as the spherical equatorial great circle (height=0, radius=rho).
 * @param {number} radius
 * @param {number} height
 * @param {number} [segments=RING_SEGMENTS]
 * @returns {{x:number,y:number,z:number}[]}
 */
export function ringPoints(radius, height, segments = RING_SEGMENTS) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push({ x: radius * Math.cos(a), y: radius * Math.sin(a), z: height });
  }
  return points;
}

/**
 * An arc of points sweeping the azimuthal angle from 0 to `phi`, at
 * the given radius and height - visualizes cylindrical/spherical phi.
 * @param {number} phi
 * @param {number} radius
 * @param {number} height
 * @param {number} [segments=ARC_SEGMENTS]
 * @returns {{x:number,y:number,z:number}[]}
 */
export function azimuthalArcPoints(phi, radius, height, segments = ARC_SEGMENTS) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * phi;
    points.push({ x: radius * Math.cos(a), y: radius * Math.sin(a), z: height });
  }
  return points;
}

/**
 * A full great circle of the given radius, lying in the vertical plane
 * at azimuth `phi` (the plane containing the z-axis and the
 * particle's azimuthal direction) - the spherical "constant r"
 * meridian, passing through both poles.
 * @param {number} phi
 * @param {number} radius
 * @param {number} [segments=RING_SEGMENTS]
 * @returns {{x:number,y:number,z:number}[]}
 */
export function meridianCirclePoints(phi, radius, segments = RING_SEGMENTS) {
  const points = [];
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const horizontal = radius * Math.sin(theta);
    points.push({ x: horizontal * cosPhi, y: horizontal * sinPhi, z: radius * Math.cos(theta) });
  }
  return points;
}

/**
 * An arc of points sweeping the polar angle from the +z axis (theta=0)
 * to `theta`, within the meridian plane at azimuth `phi` - visualizes
 * spherical theta.
 * @param {number} phi
 * @param {number} theta
 * @param {number} radius
 * @param {number} [segments=ARC_SEGMENTS]
 * @returns {{x:number,y:number,z:number}[]}
 */
export function polarArcPoints(phi, theta, radius, segments = ARC_SEGMENTS) {
  const points = [];
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  for (let i = 0; i <= segments; i++) {
    const p = (i / segments) * theta;
    const horizontal = radius * Math.sin(p);
    points.push({ x: horizontal * cosPhi, y: horizontal * sinPhi, z: radius * Math.cos(p) });
  }
  return points;
}

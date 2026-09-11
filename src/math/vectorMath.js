/**
 * vectorMath
 * ----------------------------------------------------------------------
 * Tiny, dependency-free helpers for working with plain {x,y,z} vectors.
 * Lives in src/math/ alongside ParametricMotion/expressionCompiler
 * because it is pure computation with no Three.js or DOM dependency -
 * modules format/render these values, they don't compute them.
 */

/**
 * @param {{x:number, y:number, z:number}} v
 * @returns {number} Euclidean length of v
 */
export function magnitude(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * @param {{x:number, y:number, z:number}} v
 * @returns {boolean} true only if all three components are finite numbers
 */
export function isFiniteVector(v) {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

/**
 * MATH-SPACE <-> RENDER-SPACE CONVENTION
 * ----------------------------------------------------------------------
 * Every module in src/math/ and every equation the user types works in
 * "math space": a standard right-handed frame where Z is the vertical
 * (up) axis and X/Y span the horizontal plane - the convention used in
 * calculus/physics textbooks (see coordinateSystems.js).
 *
 * Three.js's own engine convention is Y-up. Rather than fight that (and
 * rather than scatter the distinction across every file that builds
 * geometry), exactly one linear remap is defined here, and every
 * Three.js-facing class (Particle, TrajectoryTrail, VectorArrow,
 * CylindricalHelper, SphericalHelper, PositionVectorArrow, SceneManager)
 * calls toRenderVector() on a math-space point/direction immediately
 * before handing it to Three.js. Nothing else in the app ever needs to
 * think about the remap - ParametricMotion, coordinateSystems.js, and
 * the sidebar readouts all stay purely in math space.
 *
 * The remap is a 90-degree rotation about the X axis (X'=X, Y'=Z,
 * Z'=-Y), which keeps the frame right-handed (X * Y = Z holds in both
 * spaces) - so it's a pure relabeling of "which way is up", not a
 * mirror flip. Because it's a rotation (no translation, no scaling),
 * it applies identically to points and to direction vectors, and it
 * preserves length/magnitude exactly.
 */

/**
 * @param {{x:number, y:number, z:number}} v - a math-space point or direction
 * @returns {{x:number, y:number, z:number}} the equivalent Three.js (Y-up) coordinates
 */
export function toRenderVector(v) {
  return { x: v.x, y: v.z, z: -v.y };
}

/**
 * Inverse of toRenderVector() - converts a Three.js (Y-up) point or
 * direction, such as the camera's live position, back into math space
 * for display in the sidebar.
 * @param {{x:number, y:number, z:number}} v
 * @returns {{x:number, y:number, z:number}}
 */
export function fromRenderVector(v) {
  return { x: v.x, y: -v.z, z: v.y };
}

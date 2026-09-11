import * as THREE from 'three';

/**
 * TextSprite
 * ----------------------------------------------------------------------
 * Small helper for building camera-facing text labels (THREE.Sprite +
 * a canvas texture) inside a 3D scene. Used only for the fixed teaching
 * symbols the scene renders permanently - axis names (X/Y/Z), the origin
 * marker (O), and the coordinate-symbol labels drawn by
 * CylindricalHelper/SphericalHelper (r, \u03B8, z, \u03C1, \u03C6).
 *
 * Deliberately NOT used for any live/numeric value - those always stay
 * in the sidebar's Data Panel (see AxisAnnotations/CylindricalHelper/
 * SphericalHelper/MotionControls). A text sprite's content never
 * changes after creation; only its position is updated per frame where
 * needed (e.g. the coordinate-symbol labels, which track the particle).
 */

/**
 * @param {string} text
 * @param {object} [options]
 * @param {string} [options.color='#e6edf3'] - CSS color for the glyph fill
 * @param {number} [options.fontSize=64] - canvas font size in px (resolution, not scene scale)
 * @param {number} [options.scale=0.6] - sprite height in scene units
 * @returns {THREE.Sprite}
 */
export function createTextSprite(text, options = {}) {
  const {
    color = '#e6edf3',
    fontSize = 64,
    scale = 0.6,
  } = options;

  const font = `700 ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  const padding = fontSize * 0.5;
  const width = Math.ceil(ctx.measureText(text).width + padding * 2);
  const height = Math.ceil(fontSize * 1.5);
  canvas.width = width;
  canvas.height = height;

  // Re-apply font: sizing the canvas resets its 2D context state.
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  const aspect = width / height;
  sprite.scale.set(scale * aspect, scale, 1);
  sprite.renderOrder = 999; // always read on top of lines/rings/meshes

  return sprite;
}

/** @param {THREE.Sprite} sprite - disposes the sprite's texture + material (not its geometry - Sprite has none of its own) */
export function disposeTextSprite(sprite) {
  if (!sprite) return;
  sprite.material.map.dispose();
  sprite.material.dispose();
}

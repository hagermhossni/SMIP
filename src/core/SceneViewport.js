import { SceneManager } from './SceneManager.js';

/**
 * SceneViewport
 * ----------------------------------------------------------------------
 * Wraps a SceneManager with the shared visual chrome used around every
 * 3D scene in SMIP: corner brackets giving the viewport its "instrument
 * console" frame. This is what gives the platform a consistent feel
 * across the Dynamics and Geometry modules.
 *
 * This viewport no longer renders a live camera x/y/z text readout -
 * the camera position is reported to the sidebar's Scene Settings
 * section instead, via `sceneManager.camera.position` (exposed below),
 * which the module polls each frame. It does render one small static
 * HTML overlay: a short explanatory box naming the active coordinate
 * system's symbols (rho/phi/z or r/theta/phi) - see setCoordLegend()
 * below. That box only ever shows fixed symbol/meaning text, never a
 * live number.
 *
 * Modules use this instead of SceneManager directly whenever they want
 * the standard framed viewport. `viewport.sceneManager` still exposes
 * the underlying SceneManager (scene, camera, controls, etc.).
 */
export class SceneViewport {
  /**
   * @param {HTMLElement} parent - element to mount the viewport into
   * @param {object} [sceneOptions] - forwarded to SceneManager
   */
  constructor(parent, sceneOptions = {}) {
    this.parent = parent;

    this.el = document.createElement('div');
    this.el.className = 'scene-container';
    parent.appendChild(this.el);

    this._buildHudChrome();
    this._buildCoordLegend();

    this.sceneManager = new SceneManager(this.el, sceneOptions);
  }

  _buildHudChrome() {
    ['tl', 'tr', 'bl', 'br'].forEach((corner) => {
      const el = document.createElement('div');
      el.className = `scene-hud-corner scene-hud-corner--${corner}`;
      this.el.appendChild(el);
    });
  }

  _buildCoordLegend() {
    this.coordLegendEl = document.createElement('div');
    this.coordLegendEl.className = 'scene-legend-box';
    this.coordLegendEl.hidden = true;
    this.el.appendChild(this.coordLegendEl);
  }

  /**
   * Shows (or updates) the small in-scene box explaining the active
   * coordinate system's symbols, e.g. "r = radial distance". Pass an
   * empty/missing `rows` to hide it entirely (used for Cartesian, whose
   * axis letters are already labeled directly on the axes - see
   * AxisAnnotations).
   * @param {string} title - e.g. 'Cylindrical' or 'Spherical'
   * @param {{symbol: string, meaning: string}[]} [rows]
   */
  setCoordLegend(title, rows) {
    if (!rows || rows.length === 0) {
      this.coordLegendEl.hidden = true;
      return;
    }

    this.coordLegendEl.replaceChildren();

    const titleEl = document.createElement('div');
    titleEl.className = 'scene-legend-box__title';
    titleEl.textContent = title;
    this.coordLegendEl.appendChild(titleEl);

    rows.forEach(({ symbol, meaning }) => {
      const row = document.createElement('div');
      row.className = 'scene-legend-box__row';

      const symbolEl = document.createElement('span');
      symbolEl.className = 'scene-legend-box__symbol';
      symbolEl.textContent = symbol;

      const meaningEl = document.createElement('span');
      meaningEl.className = 'scene-legend-box__meaning';
      meaningEl.textContent = meaning;

      row.append(symbolEl, meaningEl);
      this.coordLegendEl.appendChild(row);
    });

    this.coordLegendEl.hidden = false;
  }

  /** Tear down the scene and remove all DOM elements this viewport created. */
  dispose() {
    this.sceneManager.dispose();
    if (this.el.parentElement) {
      this.el.parentElement.removeChild(this.el);
    }
  }
}

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AxisAnnotations } from './AxisAnnotations.js';
import { toRenderVector } from '../math/vectorMath.js';

/**
 * SceneManager
 * ----------------------------------------------------------------------
 * A self-contained, reusable Three.js scene: renderer + camera + controls
 * + a reference grid + colored axes, with automatic resize handling and
 * an internal render loop.
 *
 * This is the single building block every SMIP module (Spatial Dynamics,
 * Spatial Geometry, and later physics modules) mounts its own visuals into.
 * Modules should never create a THREE.Scene / WebGLRenderer directly -
 * they should instantiate a SceneManager and add their own objects to
 * `sceneManager.scene`.
 *
 * Usage:
 *   const sceneManager = new SceneManager(containerEl);
 *   sceneManager.scene.add(myMesh);
 *   // ...later, when the module unmounts:
 *   sceneManager.dispose();
 */
export class SceneManager {
  /**
   * @param {HTMLElement} container - element the canvas will fill (must be positioned, e.g. position: absolute/relative)
   * @param {object} [options]
   * @param {number} [options.gridSize=20] - width/depth of the reference grid, in scene units
   * @param {number} [options.gridDivisions=20] - number of grid divisions
   * @param {number} [options.axesLength=10] - length of each axis line
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      gridSize: 20,
      gridDivisions: 20,
      axesLength: 10,
      ...options,
    };

    this._onResize = this._onResize.bind(this);
    this._animate = this._animate.bind(this);
    this._frameId = null;
    this._clock = new THREE.Clock();
    // Multiple independent listeners can subscribe to the render loop
    // (e.g. a module's animation logic), rather than a single
    // overwritable `onFrame` callback.
    this._frameListeners = [];

    this._initScene();
    this._initCamera();
    this._initRenderer();
    this._initControls();
    this._initGrid();
    this._initAxes();
    this._initAxisAnnotations();
    this._initLights();

    // A ResizeObserver (rather than only a window 'resize' listener)
    // catches every reason the container's own size can change: a
    // browser/window resize, but also the sidebar being dragged wider/
    // narrower or collapsed/expanded, which changes this.container's
    // clientWidth via CSS flex layout without the window itself
    // resizing. This is what keeps the Three.js scene responsive to
    // sidebar resizing (Phase 6 requirement).
    this._resizeObserver = new ResizeObserver(this._onResize);
    this._resizeObserver.observe(this.container);
    this._animate();
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1117); // matches --smip-bg
  }

  _initCamera() {
    const { clientWidth, clientHeight } = this.container;
    this.camera = new THREE.PerspectiveCamera(
      50,
      clientWidth / Math.max(clientHeight, 1),
      0.1,
      1000
    );
    this.camera.position.set(10, 8, 12);
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._resizeRendererToContainer();
    this.container.appendChild(this.renderer.domElement);
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 0, 0);
  }

  _initGrid() {
    // THREE.GridHelper lies in Three's own XZ plane (normal = Y, its
    // "up"). Since toRenderVector maps math Z (our vertical axis) onto
    // Three's Y, that plane is exactly math-space Z=0 - the XY plane,
    // as the standard convention requires - with no transform needed
    // here at all.
    const { gridSize, gridDivisions } = this.options;
    this.grid = new THREE.GridHelper(gridSize, gridDivisions, 0x3a4656, 0x1e2733);
    this.scene.add(this.grid);
  }

  _initAxes() {
    // Custom colored axes (X=red, Y=green, Z=blue) rather than the default
    // THREE.AxesHelper so colors stay consistent with the UI's axis legend.
    // Directions are defined in math space (Z vertical, X/Y horizontal)
    // and converted to Three's Y-up render space via toRenderVector -
    // see math/vectorMath.js for why. The result: Z (blue) is the axis
    // that points straight up in the viewport, and X/Y (red/green) lie
    // flat in the horizontal plane, matching the standard math/physics
    // convention.
    this.axesGroup = new THREE.Group();

    const axisDefs = [
      { dir: { x: 1, y: 0, z: 0 }, color: 0xf2545b }, // X - horizontal
      { dir: { x: 0, y: 1, z: 0 }, color: 0x4fd69c }, // Y - horizontal
      { dir: { x: 0, y: 0, z: 1 }, color: 0x4fa8ff }, // Z - vertical (up)
    ];

    const length = this.options.axesLength;

    axisDefs.forEach(({ dir, color }) => {
      const mathPoints = [
        { x: -dir.x * length, y: -dir.y * length, z: -dir.z * length },
        { x: dir.x * length, y: dir.y * length, z: dir.z * length },
      ];
      const renderPoints = mathPoints.map(toRenderVector);
      const geometry = new THREE.BufferGeometry().setFromPoints(renderPoints);
      const material = new THREE.LineBasicMaterial({ color });
      this.axesGroup.add(new THREE.Line(geometry, material));
    });

    this.scene.add(this.axesGroup);
  }

  /**
   * The origin marker and axis tick marks, layered on top of the axes
   * drawn in _initAxes() (see core/AxisAnnotations.js - no text is ever
   * rendered in the scene). Exposed as `this.axisAnnotations` so any
   * module can wire its own "Origin Marker"/"Axis Ticks" toggle UI to
   * setLabelsVisible()/setScaleVisible() without SceneManager needing
   * to know about that UI itself.
   */
  _initAxisAnnotations() {
    this.axisAnnotations = new AxisAnnotations(this.scene, { length: this.options.axesLength });
  }

  _initLights() {
    // Simple, neutral lighting - Phase 1 has no shaded/lit geometry yet,
    // but this keeps the scene ready for meshes added by later phases.
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(8, 12, 6);
    this.scene.add(ambient, directional);
  }

  _resizeRendererToContainer() {
    const { clientWidth, clientHeight } = this.container;
    this.renderer.setSize(clientWidth, clientHeight, false);
  }

  // Called by the ResizeObserver with an entries array; the actual
  // values are re-read from the DOM (clientWidth/clientHeight) rather
  // than trusted from the entry, since border-box/content-box
  // reporting differs across browsers and we only need the same
  // numbers _resizeRendererToContainer() already uses.
  _onResize() {
    const { clientWidth, clientHeight } = this.container;
    if (clientWidth === 0 || clientHeight === 0) return;

    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this._resizeRendererToContainer();
  }

  /**
   * Subscribe a function to run every rendered frame, called as
   * `fn(deltaSeconds, elapsedSeconds, sceneManager)`. Returns nothing;
   * pair with removeFrameListener(fn) using the same function reference
   * (e.g. in a module's unmount()) to avoid leaks.
   */
  addFrameListener(fn) {
    this._frameListeners.push(fn);
  }

  removeFrameListener(fn) {
    this._frameListeners = this._frameListeners.filter((l) => l !== fn);
  }

  _animate() {
    this._frameId = requestAnimationFrame(this._animate);
    const delta = this._clock.getDelta();
    const elapsed = this._clock.getElapsedTime();

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    this._frameListeners.forEach((fn) => fn(delta, elapsed, this));
  }

  /**
   * Tear down this scene completely: stops the render loop, disposes
   * GPU resources, removes the canvas, and removes event listeners.
   * Must be called when a module unmounts to avoid leaking WebGL contexts.
   */
  dispose() {
    cancelAnimationFrame(this._frameId);
    this._resizeObserver.disconnect();
    this._frameListeners = [];
    this.controls.dispose();
    if (this.axisAnnotations) this.axisAnnotations.dispose();

    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((m) => m.dispose());
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

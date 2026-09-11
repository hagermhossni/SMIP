import { SceneViewport } from '../../core/SceneViewport.js';
import { createModuleHeader } from '../../utils/dom.js';

/**
 * GeometryModule
 * ----------------------------------------------------------------------
 * Phase 1: foundation only. Mounts a standard 3D viewport (grid + axes +
 * orbit controls) with no geometry content yet.
 *
 * A later phase will add: points, lines, and planes in space, along with
 * distance/angle calculations, as objects added to
 * `this.viewport.sceneManager.scene`.
 */
export class GeometryModule {
  mount(container) {
    this.el = document.createElement('div');
    this.el.className = 'module-view';

    this.el.appendChild(
      createModuleHeader(
        'Spatial Geometry',
        'Points, lines, planes, distances, and angles - coming in a later build step.'
      )
    );

    container.appendChild(this.el);
    this.viewport = new SceneViewport(this.el);
  }

  unmount() {
    if (this.viewport) this.viewport.dispose();
    if (this.el && this.el.parentElement) this.el.parentElement.removeChild(this.el);
  }
}

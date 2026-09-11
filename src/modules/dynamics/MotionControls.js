import { Sidebar } from '../../core/Sidebar.js';
import { StepByStepDerivation } from './StepByStepDerivation.js';

// Per coordinate system, the three equation-input rows in entry order:
// which raw component key each field maps to (matches
// ParametricMotion's COMPONENT_KEYS) and the label shown beside it.
// Exported so other modules (e.g. the Problem Library's Add Problem
// form) can build an identical equation-input UI without duplicating
// or drifting from these definitions - this doesn't change anything
// about how Spatial Dynamics itself uses them.
export const EQUATION_FIELD_DEFS = {
  cartesian: [
    { key: 'x', label: 'x(t) =' },
    { key: 'y', label: 'y(t) =' },
    { key: 'z', label: 'z(t) =' },
  ],
  cylindrical: [
    { key: 'rho', label: '\u03C1(t) =' },
    { key: 'phi', label: '\u03C6(t) =' },
    { key: 'z', label: 'z(t) =' },
  ],
  spherical: [
    { key: 'r', label: 'r(t) =' },
    { key: 'theta', label: '\u03B8(t) =' },
    { key: 'phi', label: '\u03C6(t) =' },
  ],
};

/**
 * MotionControls
 * ----------------------------------------------------------------------
 * Builds the Spatial Dynamics module's TWO side panels - a left Controls
 * panel and a right Data panel, each its own Sidebar (see core/Sidebar.js)
 * - plus one standalone, full-width panel (`derivationPanelEl`, see
 * _buildStepByStepDerivationPanel below) - and reports user intent
 * through callbacks; it has no knowledge of Three.js, ParametricMotion,
 * or animation state. DynamicsModule owns all of that, appends
 * `leftEl`/`rightEl` on either side of the 3D scene and `derivationPanelEl`
 * below it (see DynamicsModule.mount), and decides what each callback does.
 *
 * LEFT panel ("Controls") - input/display-control only, in this order:
 *   - Coordinate System Selection: the Cartesian/Cylindrical/Spherical
 *     selector, which drives the Equation Input labels below it and
 *     which helper is drawn in the 3D scene.
 *   - Equation Input: the three equation-input fields (labeled to match
 *     whichever coordinate system is selected above) + Apply + error
 *     message.
 *   - Simulation Settings: animation speed, maximum time, Start/Pause/Reset.
 *   - Display Position: the position-vector visibility toggle (moved
 *     here from the right panel's Display Options - it's a display
 *     control, so it belongs beside the other controls).
 *   - Display Trajectory: the trajectory-trail visibility toggle (also
 *     moved here from the right panel's Display Options, for the same
 *     reason as Display Position).
 *
 * RIGHT panel ("Data Panel") - every live number in the module, plus (at
 * the bottom) the visibility toggles that don't belong on the left
 * panel's other input sections:
 *   - Position: live t/x/y/z.
 *   - Velocity: components + magnitude.
 *   - Acceleration: components + magnitude.
 *   - Trajectory Information: current time + path information (active
 *     coordinate system, t range).
 *   - Coordinate Information: the same position in all three systems
 *     side by side (Cartesian/Cylindrical/Spherical values).
 *   - Camera: the live camera position. Currently hidden (not deleted -
 *     see _buildCameraSection).
 *   - Display Options: Velocity/Acceleration Vector visibility,
 *     Cylindrical/Spherical Helpers, and the scene's Axis Labels
 *     (X/Y/Z + origin "O") / Axis Ticks. Not numeric data, but kept
 *     here (rather than dropped) since the left panel's other sections
 *     are strictly Coordinate System Selection/Equation Input/
 *     Simulation Settings. (Position Vector and Trajectory visibility
 *     now live in the left panel's own Display Position/Display
 *     Trajectory sections instead.)
 *
 * No live numeric value is ever drawn in the 3D scene itself - only the
 * fixed teaching symbols (axis letters, "O", rho/phi/z, r/theta/phi -
 * see AxisAnnotations/CylindricalHelper/SphericalHelper). Every number
 * lives in this Data Panel.
 */
export class MotionControls {
  /**
   * @param {object} config
   * @param {'cartesian'|'cylindrical'|'spherical'} config.defaultSystem
   * @param {object} config.defaultEquationsBySystem - keyed by system, each an equations object
   * @param {number} config.defaultTMax
   * @param {number} config.defaultSpeed
   * @param {object} config.callbacks
   * @param {(payload: {system: string, equations: object}) => void} config.callbacks.onApplyEquations
   * @param {() => void} config.callbacks.onPlay
   * @param {() => void} config.callbacks.onPause
   * @param {() => void} config.callbacks.onReset
   * @param {(params: {tMax?: number, speed?: number}) => void} config.callbacks.onParamsChange
   * @param {(visible: boolean) => void} config.callbacks.onToggleTrajectory
   * @param {(visible: boolean) => void} config.callbacks.onToggleVelocity
   * @param {(visible: boolean) => void} config.callbacks.onToggleAcceleration
   * @param {(visible: boolean) => void} config.callbacks.onTogglePositionVector
   * @param {(visible: boolean) => void} config.callbacks.onToggleAxisLabels - origin marker + axis letters
   * @param {(visible: boolean) => void} config.callbacks.onToggleAxisScale - axis ticks
   * @param {(visible: boolean) => void} config.callbacks.onToggleCylindricalHelpers
   * @param {(visible: boolean) => void} config.callbacks.onToggleSphericalHelpers
   * @param {(system: 'cartesian'|'cylindrical'|'spherical') => void} config.callbacks.onSelectCoordinateSystem
   */
  constructor({ defaultSystem, defaultEquationsBySystem, defaultTMax, defaultSpeed, callbacks }) {
    this.callbacks = callbacks;
    this.defaultEquationsBySystem = defaultEquationsBySystem;
    this.currentSystem = defaultSystem;

    this.leftSidebar = new Sidebar({
      title: 'Controls',
      side: 'left',
      defaultWidth: 300,
      minWidth: 260,
      maxWidth: 460,
    });
    this.rightSidebar = new Sidebar({
      title: 'Data Panel',
      side: 'right',
      defaultWidth: 300,
      minWidth: 260,
      maxWidth: 460,
    });
    this.leftEl = this.leftSidebar.el;
    this.rightEl = this.rightSidebar.el;
    this.derivation = new StepByStepDerivation();

    // Left panel - input/display-control only, in the exact required order.
    this._buildCoordinateSystemSelectionSection(defaultSystem);
    this._buildEquationInputSection();
    this._buildSimulationSettingsSection(defaultTMax, defaultSpeed);
    this._buildDisplayPositionSection();
    this._buildDisplayTrajectorySection();

    // Right panel - every live number, plus the display toggles.
    this._buildPositionSection();
    this._buildVelocitySection();
    this._buildAccelerationSection();
    this._buildStepByStepDerivationPanel();
    this._buildTrajectoryInformationSection();
    this._buildCoordinateInformationSection();
    this._buildCameraSection();
    this._buildDisplayOptionsSection();

    this._setEquationFields(defaultSystem, defaultEquationsBySystem[defaultSystem]);
    this.setSelectedCoordinateSystem(defaultSystem);
    this.setPlaying(false);
  }

  // ==================== LEFT PANEL: Controls ====================

  // --- 1. Coordinate System Selection ---
  _buildCoordinateSystemSelectionSection(defaultSystem) {
    const section = this.leftSidebar.addSection('Coordinate System Selection', { defaultOpen: true });

    const selectorRow = document.createElement('div');
    selectorRow.className = 'motion-panel__toggles';
    const cartesianRadio = this._radio('coordinate-system', 'Cartesian', 'cartesian', defaultSystem === 'cartesian', (system) =>
      this._onSelectSystem(system)
    );
    const cylindricalRadio = this._radio('coordinate-system', 'Cylindrical', 'cylindrical', defaultSystem === 'cylindrical', (system) =>
      this._onSelectSystem(system)
    );
    const sphericalRadio = this._radio('coordinate-system', 'Spherical', 'spherical', defaultSystem === 'spherical', (system) =>
      this._onSelectSystem(system)
    );
    selectorRow.append(cartesianRadio, cylindricalRadio, sphericalRadio);
    section.bodyEl.appendChild(selectorRow);
  }

  _onSelectSystem(system) {
    // Switching systems resets the equation fields to that system's
    // defaults (the previous fields' values don't mean anything in the
    // new system) - DynamicsModule mirrors this by resetting playback
    // and ParametricMotion's own equations to match.
    this._setEquationFields(system, this.defaultEquationsBySystem[system]);
    this.callbacks.onSelectCoordinateSystem(system);
  }

  // --- 2. Equation Input ---
  _buildEquationInputSection() {
    const section = this.leftSidebar.addSection('Equation Input', { defaultOpen: true });

    this.equationRows = [];
    for (let i = 0; i < 3; i++) {
      const row = document.createElement('div');
      row.className = 'motion-panel__row';

      const label = document.createElement('label');
      label.className = 'motion-panel__label';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'motion-panel__input';
      input.spellcheck = false;

      row.append(label, input);
      section.bodyEl.appendChild(row);
      this.equationRows.push({ row, label, input });
    }

    this.errorEl = document.createElement('div');
    this.errorEl.className = 'motion-panel__error';
    this.errorEl.hidden = true;
    section.bodyEl.appendChild(this.errorEl);

    const applyBtn = this._button('Apply Equations', () => {
      const equations = {};
      const fieldDefs = EQUATION_FIELD_DEFS[this.currentSystem];
      fieldDefs.forEach(({ key }, i) => {
        equations[key] = this.equationRows[i].input.value;
      });
      this.callbacks.onApplyEquations({ system: this.currentSystem, equations });
    });
    applyBtn.classList.add('motion-panel__button--primary');
    section.bodyEl.appendChild(applyBtn);
  }

  /**
   * Relabels the three equation rows for `system` and fills them with
   * `equations` (usually that system's defaults, e.g. right after the
   * coordinate-system selector changes).
   * @param {'cartesian'|'cylindrical'|'spherical'} system
   * @param {object} equations
   */
  _setEquationFields(system, equations) {
    const fieldDefs = EQUATION_FIELD_DEFS[system];
    fieldDefs.forEach(({ key, label }, i) => {
      const { label: labelEl, input } = this.equationRows[i];
      labelEl.textContent = label;
      input.value = equations[key];
      input.setAttribute('aria-label', `${label} equation`);
    });
  }

  // --- 3. Simulation Settings ---
  _buildSimulationSettingsSection(defaultTMax, defaultSpeed) {
    const section = this.leftSidebar.addSection('Simulation Settings', { defaultOpen: true });

    const speedLabel = document.createElement('label');
    speedLabel.className = 'motion-panel__label';
    speedLabel.textContent = 'Animation Speed';
    this.speedInput = document.createElement('input');
    this.speedInput.type = 'number';
    this.speedInput.className = 'motion-panel__input motion-panel__input--narrow';
    this.speedInput.min = '0.1';
    this.speedInput.step = '0.1';
    this.speedInput.value = String(defaultSpeed);
    this.speedInput.addEventListener('change', () => {
      const value = Number(this.speedInput.value);
      if (Number.isFinite(value) && value > 0) {
        this.callbacks.onParamsChange({ speed: value });
      } else {
        this.speedInput.value = String(defaultSpeed);
      }
    });
    const speedRow = document.createElement('div');
    speedRow.className = 'motion-panel__row';
    speedRow.append(speedLabel, this.speedInput);
    section.bodyEl.appendChild(speedRow);

    const tMaxLabel = document.createElement('label');
    tMaxLabel.className = 'motion-panel__label';
    tMaxLabel.textContent = 'Maximum Time';
    this.tMaxInput = document.createElement('input');
    this.tMaxInput.type = 'number';
    this.tMaxInput.className = 'motion-panel__input motion-panel__input--narrow';
    this.tMaxInput.min = '1';
    this.tMaxInput.step = '1';
    this.tMaxInput.value = String(defaultTMax);
    this.tMaxInput.addEventListener('change', () => {
      const value = Number(this.tMaxInput.value);
      if (Number.isFinite(value) && value > 0) {
        this.callbacks.onParamsChange({ tMax: value });
      } else {
        this.tMaxInput.value = String(defaultTMax);
      }
    });
    const tMaxRow = document.createElement('div');
    tMaxRow.className = 'motion-panel__row';
    tMaxRow.append(tMaxLabel, this.tMaxInput);
    section.bodyEl.appendChild(tMaxRow);

    const buttonsRow = document.createElement('div');
    buttonsRow.className = 'motion-panel__buttons';
    this.playBtn = this._button('Start', () => this.callbacks.onPlay());
    this.pauseBtn = this._button('Pause', () => this.callbacks.onPause());
    this.resetBtn = this._button('Reset', () => this.callbacks.onReset());
    buttonsRow.append(this.playBtn, this.pauseBtn, this.resetBtn);
    section.bodyEl.appendChild(buttonsRow);
  }

  // --- 4. Display Position ---
  _buildDisplayPositionSection() {
    const section = this.leftSidebar.addSection('Display Position', { defaultOpen: true });

    const positionVectorToggle = this._checkbox('Show Position Vector', true, (checked) =>
      this.callbacks.onTogglePositionVector(checked)
    );
    section.bodyEl.appendChild(positionVectorToggle);
  }

  // --- 5. Display Trajectory ---
  _buildDisplayTrajectorySection() {
    const section = this.leftSidebar.addSection('Display Trajectory', { defaultOpen: true });

    const trajectoryToggle = this._checkbox('Show Trajectory', true, (checked) =>
      this.callbacks.onToggleTrajectory(checked)
    );
    section.bodyEl.appendChild(trajectoryToggle);
  }

  // ==================== RIGHT PANEL: Data Panel ====================

  // --- Position ---
  _buildPositionSection() {
    const section = this.rightSidebar.addSection('Position', { defaultOpen: true });

    const heading = document.createElement('div');
    heading.className = 'motion-panel__heading';
    heading.textContent = 'Current Coordinates';
    section.bodyEl.appendChild(heading);

    this.readoutEl = document.createElement('div');
    this.readoutEl.className = 'motion-panel__readout';
    section.bodyEl.appendChild(this.readoutEl);
  }

  // --- Velocity ---
  _buildVelocitySection() {
    const section = this.rightSidebar.addSection('Velocity', { defaultOpen: true });

    this.velocityReadoutEl = document.createElement('div');
    this.velocityReadoutEl.className = 'motion-panel__readout motion-panel__readout--velocity';
    section.bodyEl.appendChild(this.velocityReadoutEl);
  }

  // --- Acceleration ---
  _buildAccelerationSection() {
    const section = this.rightSidebar.addSection('Acceleration', { defaultOpen: true });

    this.accelerationReadoutEl = document.createElement('div');
    this.accelerationReadoutEl.className = 'motion-panel__readout motion-panel__readout--acceleration';
    section.bodyEl.appendChild(this.accelerationReadoutEl);
  }

  // --- Step-by-Step Derivation (new, purely additive - see StepByStepDerivation.js) ---
  // Unlike every other section, this one is NOT added into rightSidebar:
  // it's built as its own standalone, full-width panel (`derivationPanelEl`)
  // so DynamicsModule can place it directly below the 3D scene instead of
  // tucking it into the narrow Data Panel column - it needs the extra
  // width to lay its steps out side by side (see .derivation-panel in
  // style.css). DynamicsModule owns where derivationPanelEl actually gets
  // appended in the DOM (see DynamicsModule.mount).
  _buildStepByStepDerivationPanel() {
    const panel = document.createElement('section');
    panel.className = 'derivation-panel';

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'derivation-panel__header';

    const titleEl = document.createElement('span');
    titleEl.className = 'derivation-panel__title';
    titleEl.textContent = 'Step-by-Step Derivation';

    const chevron = document.createElement('span');
    chevron.className = 'derivation-panel__chevron';
    chevron.textContent = '\u203A'; // ›
    chevron.setAttribute('aria-hidden', 'true');

    header.append(titleEl, chevron);

    const body = document.createElement('div');
    body.className = 'derivation-panel__body';

    const setOpen = (open) => {
      panel.classList.toggle('is-open', open);
      header.setAttribute('aria-expanded', String(open));
    };
    header.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
    // Open by default - now that it sits in its own space below the
    // scene instead of competing for room in the Data Panel, there's no
    // need to start it collapsed.
    setOpen(true);

    panel.append(header, body);
    this.derivationPanelEl = panel;
    this.derivation.mount(body);
  }

  // --- Trajectory Information ---
  _buildTrajectoryInformationSection() {
    const section = this.rightSidebar.addSection('Trajectory Information', { defaultOpen: false });

    this.trajectoryTimeEl = document.createElement('div');
    this.trajectoryTimeEl.className = 'motion-panel__readout';
    section.bodyEl.appendChild(this.trajectoryTimeEl);

    const pathHeading = document.createElement('div');
    pathHeading.className = 'motion-panel__heading';
    pathHeading.textContent = 'Path Information';
    section.bodyEl.appendChild(pathHeading);

    this.pathInfoEl = document.createElement('div');
    this.pathInfoEl.className = 'motion-panel__readout';
    section.bodyEl.appendChild(this.pathInfoEl);
  }

  // --- Coordinate Information ---
  _buildCoordinateInformationSection() {
    const section = this.rightSidebar.addSection('Coordinate Information', { defaultOpen: false });

    this.coordHeadings = {};

    this.coordHeadings.cartesian = this._coordHeading('Cartesian');
    section.bodyEl.appendChild(this.coordHeadings.cartesian);
    this.cartesianReadoutEl = document.createElement('div');
    this.cartesianReadoutEl.className = 'motion-panel__readout';
    section.bodyEl.appendChild(this.cartesianReadoutEl);

    this.coordHeadings.cylindrical = this._coordHeading('Cylindrical');
    section.bodyEl.appendChild(this.coordHeadings.cylindrical);
    this.cylindricalReadoutEl = document.createElement('div');
    this.cylindricalReadoutEl.className = 'motion-panel__readout';
    section.bodyEl.appendChild(this.cylindricalReadoutEl);

    this.coordHeadings.spherical = this._coordHeading('Spherical');
    section.bodyEl.appendChild(this.coordHeadings.spherical);
    this.sphericalReadoutEl = document.createElement('div');
    this.sphericalReadoutEl.className = 'motion-panel__readout';
    section.bodyEl.appendChild(this.sphericalReadoutEl);
  }

  // --- Camera ---
  // Hidden for now (not currently needed) - the section and its readout
  // element are still built and kept updated every frame (see
  // DynamicsModule._onFrame -> updateCameraReadout) so the underlying
  // camera-tracking code is untouched and the panel can be restored by
  // simply removing the `display: none` below.
  _buildCameraSection() {
    const section = this.rightSidebar.addSection('Camera', { defaultOpen: false });
    section.el.style.display = 'none';

    this.cameraReadoutEl = document.createElement('div');
    this.cameraReadoutEl.className = 'motion-panel__readout';
    section.bodyEl.appendChild(this.cameraReadoutEl);
  }

  // --- Display Options (not numeric data, kept here since the left
  // panel's other sections are strictly Coordinate System Selection/
  // Equation Input/Simulation Settings; Position Vector and Trajectory
  // visibility live in the left panel's own Display Position/Display
  // Trajectory sections instead) ---
  _buildDisplayOptionsSection() {
    const section = this.rightSidebar.addSection('Display Options', { defaultOpen: false });

    const overlaysHeading = document.createElement('div');
    overlaysHeading.className = 'motion-panel__heading';
    overlaysHeading.textContent = 'Overlays';
    section.bodyEl.appendChild(overlaysHeading);

    const overlaysRow = document.createElement('div');
    overlaysRow.className = 'motion-panel__toggles';
    const velocityToggle = this._checkbox('Velocity Vector', true, (checked) =>
      this.callbacks.onToggleVelocity(checked)
    );
    const accelerationToggle = this._checkbox('Acceleration Vector', true, (checked) =>
      this.callbacks.onToggleAcceleration(checked)
    );
    overlaysRow.append(velocityToggle, accelerationToggle);
    section.bodyEl.appendChild(overlaysRow);

    const helpersHeading = document.createElement('div');
    helpersHeading.className = 'motion-panel__heading';
    helpersHeading.textContent = 'Coordinate Helpers';
    section.bodyEl.appendChild(helpersHeading);

    const helpersRow = document.createElement('div');
    helpersRow.className = 'motion-panel__toggles';
    const cylindricalHelpersToggle = this._checkbox('Cylindrical Helpers', true, (checked) =>
      this.callbacks.onToggleCylindricalHelpers(checked)
    );
    const sphericalHelpersToggle = this._checkbox('Spherical Helpers', true, (checked) =>
      this.callbacks.onToggleSphericalHelpers(checked)
    );
    helpersRow.append(cylindricalHelpersToggle, sphericalHelpersToggle);
    section.bodyEl.appendChild(helpersRow);

    const axesHeading = document.createElement('div');
    axesHeading.className = 'motion-panel__heading';
    axesHeading.textContent = 'Axes';
    section.bodyEl.appendChild(axesHeading);

    const axesRow = document.createElement('div');
    axesRow.className = 'motion-panel__toggles';
    const axisLabelsToggle = this._checkbox('Axis Labels (X, Y, Z, O)', true, (checked) =>
      this.callbacks.onToggleAxisLabels(checked)
    );
    const ticksToggle = this._checkbox('Axis Ticks', true, (checked) =>
      this.callbacks.onToggleAxisScale(checked)
    );
    axesRow.append(axisLabelsToggle, ticksToggle);
    section.bodyEl.appendChild(axesRow);

    // Axis color legend - the 3D scene's axis lines are colored but
    // never labeled with color names; this is the one place that tells
    // the student which color is which axis.
    const legend = document.createElement('div');
    legend.className = 'axis-legend';
    legend.innerHTML =
      '<span class="axis-legend__item"><span class="axis-legend__swatch axis-legend__swatch--x"></span>X (horizontal)</span>' +
      '<span class="axis-legend__item"><span class="axis-legend__swatch axis-legend__swatch--y"></span>Y (horizontal)</span>' +
      '<span class="axis-legend__item"><span class="axis-legend__swatch axis-legend__swatch--z"></span>Z (vertical)</span>';
    section.bodyEl.appendChild(legend);
  }

  // ==================== shared builders ====================

  _button(label, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'motion-panel__button';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  /**
   * Builds a labeled checkbox for a visibility toggle.
   * @param {string} label
   * @param {boolean} defaultChecked
   * @param {(checked: boolean) => void} onChange
   * @returns {HTMLElement}
   */
  _checkbox(label, defaultChecked, onChange) {
    const wrapper = document.createElement('label');
    wrapper.className = 'motion-panel__toggle';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = defaultChecked;
    input.addEventListener('change', () => onChange(input.checked));

    const text = document.createElement('span');
    text.textContent = label;

    wrapper.append(input, text);
    return wrapper;
  }

  /**
   * Builds a labeled radio button, one of a mutually-exclusive group
   * sharing `name` - used for the coordinate-system selector.
   * @param {string} name - shared `name` attribute for the radio group
   * @param {string} label
   * @param {string} value
   * @param {boolean} defaultChecked
   * @param {(value: string) => void} onChange
   * @returns {HTMLElement}
   */
  _radio(name, label, value, defaultChecked, onChange) {
    const wrapper = document.createElement('label');
    wrapper.className = 'motion-panel__toggle';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = value;
    input.checked = defaultChecked;
    input.addEventListener('change', () => {
      if (input.checked) onChange(value);
    });

    const text = document.createElement('span');
    text.textContent = label;

    wrapper.append(input, text);
    return wrapper;
  }

  /**
   * Builds one of the small labeled headings above a coordinate-system
   * readout block (Cartesian/Cylindrical/Spherical) in the Coordinate
   * Information section, so the selected one can be highlighted via
   * setSelectedCoordinateSystem().
   * @param {string} label
   * @returns {HTMLElement}
   */
  _coordHeading(label) {
    const el = document.createElement('div');
    el.className = 'motion-panel__heading motion-panel__coord-heading';
    el.textContent = label;
    return el;
  }

  /** Reflects play/pause state in the button styling. */
  setPlaying(isPlaying) {
    this.playBtn.classList.toggle('is-active', isPlaying);
    this.pauseBtn.classList.toggle('is-active', !isPlaying);
  }

  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
  }

  clearError() {
    this.errorEl.hidden = true;
  }

  /** @param {number} t @param {{x:number,y:number,z:number}} position */
  updateReadout(t, position) {
    const fmt = (n) => n.toFixed(2).padStart(6, ' ');
    this.readoutEl.textContent =
      `t = ${fmt(t)}\nx = ${fmt(position.x)}\ny = ${fmt(position.y)}\nz = ${fmt(position.z)}`;

    // Trajectory Information's "current time" mirrors Position's t, and
    // Coordinate Information's Cartesian row mirrors this same x/y/z -
    // both are cheap re-displays of the numbers above, not new values.
    this.trajectoryTimeEl.textContent = `t = ${fmt(t)}`;
    this.cartesianReadoutEl.textContent =
      `x = ${fmt(position.x)}\ny = ${fmt(position.y)}\nz = ${fmt(position.z)}`;
  }

  /**
   * Updates the Trajectory Information section's "Path Information"
   * block with the currently-governing coordinate system and the t
   * range being played back over - both already-known state, just
   * surfaced here for a quick trajectory-level summary.
   * @param {'cartesian'|'cylindrical'|'spherical'} system
   * @param {number} tMax
   */
  updatePathInfo(system, tMax) {
    const label = system.charAt(0).toUpperCase() + system.slice(1);
    this.pathInfoEl.textContent = `system: ${label}\nt range: 0 to ${tMax}`;
  }

  /** @param {{x:number,y:number,z:number}} position - the camera's live position, in math space (Z up) */
  updateCameraReadout(position) {
    const fmt = (n) => n.toFixed(2).padStart(6, ' ');
    this.cameraReadoutEl.textContent =
      `x = ${fmt(position.x)}\ny = ${fmt(position.y)}\nz = ${fmt(position.z)}`;
  }

  /** @param {{rho:number, phi:number, z:number}} cylindrical */
  updateCylindricalReadout(cylindrical) {
    const fmt = (n) => n.toFixed(2).padStart(6, ' ');
    this.cylindricalReadoutEl.textContent =
      `\u03C1 = ${fmt(cylindrical.rho)}\n` +
      `\u03C6 = ${fmt(cylindrical.phi)} rad\n` +
      `z = ${fmt(cylindrical.z)}`;
  }

  /** @param {{r:number, theta:number, phi:number}} spherical */
  updateSphericalReadout(spherical) {
    const fmt = (n) => n.toFixed(2).padStart(6, ' ');
    this.sphericalReadoutEl.textContent =
      `r = ${fmt(spherical.r)}\n` +
      `\u03B8 = ${fmt(spherical.theta)} rad\n` +
      `\u03C6 = ${fmt(spherical.phi)} rad`;
  }

  /**
   * Highlights the heading of the currently-selected coordinate system
   * in the Coordinate Information section and updates the Equation
   * Input fields to match.
   * @param {'cartesian'|'cylindrical'|'spherical'} system
   */
  setSelectedCoordinateSystem(system) {
    this.currentSystem = system;
    Object.entries(this.coordHeadings).forEach(([key, el]) => {
      el.classList.toggle('is-selected', key === system);
    });
  }

  /**
   * @param {{x:number,y:number,z:number}|null} velocity - null if the
   *   derivative was non-finite at the current t (shows "—" instead)
   * @param {number|null} speed - velocity magnitude, or null to match
   */
  updateVelocityReadout(velocity, speed) {
    const fmt = (n) => (n === null ? '  \u2014  ' : n.toFixed(2).padStart(6, ' '));
    this.velocityReadoutEl.textContent =
      `vx = ${fmt(velocity && velocity.x)}\n` +
      `vy = ${fmt(velocity && velocity.y)}\n` +
      `vz = ${fmt(velocity && velocity.z)}\n` +
      `|v| = ${fmt(speed)}`;
  }

  /**
   * @param {{x:number,y:number,z:number}|null} acceleration - null if the
   *   derivative was non-finite at the current t (shows "—" instead)
   * @param {number|null} accelMagnitude - acceleration magnitude, or null to match
   */
  updateAccelerationReadout(acceleration, accelMagnitude) {
    const fmt = (n) => (n === null ? '  \u2014  ' : n.toFixed(2).padStart(6, ' '));
    this.accelerationReadoutEl.textContent =
      `ax = ${fmt(acceleration && acceleration.x)}\n` +
      `ay = ${fmt(acceleration && acceleration.y)}\n` +
      `az = ${fmt(acceleration && acceleration.z)}\n` +
      `|a| = ${fmt(accelMagnitude)}`;
  }

  /**
   * Recomputes the Step-by-Step Derivation section's static steps
   * (Given Equations / First & Second Derivatives / Velocity &
   * Acceleration Law). Call whenever equations are (re)applied or the
   * coordinate system changes - see StepByStepDerivation.setEquations.
   * @param {'cartesian'|'cylindrical'|'spherical'} system
   * @param {object} equations
   */
  setDerivationEquations(system, equations) {
    this.derivation.setEquations(system, equations);
  }

  /**
   * Refreshes the Step-by-Step Derivation section's live Substitution
   * and Final Result steps for the current t. `velocity`/`speed`/
   * `acceleration`/`accelMagnitude` should be exactly what was just
   * passed to updateVelocityReadout/updateAccelerationReadout, so the
   * Final Result step can never disagree with those sections.
   * @param {{t:number, velocity:({x:number,y:number,z:number}|null), speed:(number|null), acceleration:({x:number,y:number,z:number}|null), accelMagnitude:(number|null)}} payload
   */
  updateDerivation(payload) {
    this.derivation.update(payload);
  }

  dispose() {
    this.derivation.dispose();
    this.leftSidebar.dispose();
    this.rightSidebar.dispose();
    // Not owned by either Sidebar (see _buildStepByStepDerivationPanel),
    // so it needs its own removal here - Sidebar.dispose() only detaches
    // its own this.el.
    if (this.derivationPanelEl && this.derivationPanelEl.parentElement) {
      this.derivationPanelEl.parentElement.removeChild(this.derivationPanelEl);
    }
  }
}

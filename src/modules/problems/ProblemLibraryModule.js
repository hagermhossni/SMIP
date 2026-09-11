import { createModuleHeader } from '../../utils/dom.js';
import { EQUATION_FIELD_DEFS } from '../dynamics/MotionControls.js';
import { ParametricMotion } from '../../math/ParametricMotion.js';
import { EquationPreview } from './EquationPreview.js';
import { loadProblemsBySystem, saveProblem, deleteProblem } from './problemStore.js';
import { setPendingDynamicsProblem } from '../../app/pendingDynamicsProblem.js';

/**
 * ProblemLibraryModule
 * ----------------------------------------------------------------------
 * Four views, swapped in place inside the same panel (no router change,
 * no effect on the other modules):
 *   - "library" (default/home): just the three coordinate-system
 *     category cards. Clicking a card opens that category's own
 *     full-panel view - nothing else is shown on the home screen.
 *   - "category": a full-panel view scoped to one coordinate system -
 *     a Back button to the home screen, a "+" to add a new problem to
 *     this category, and the list of saved questions already in it.
 *     Each saved question is a row with its title, an Open button, and
 *     a Delete button; clicking either the title or Open goes to that
 *     question's "detail" view.
 *   - "detail": a full-panel view for one saved question - a Back
 *     button to its category view, the question's title, its
 *     description paragraph, its equations (read-only), and a
 *     "Show Details" button. That button hands the saved system/
 *     equations to app/pendingDynamicsProblem.js and navigates to the
 *     real Spatial Dynamics page (full page width), which picks them up
 *     and starts playing immediately - so Position, Velocity,
 *     Acceleration, Trajectory/Coordinate Information and every other
 *     Data Panel readout Spatial Dynamics normally provides are all
 *     there, not just a bare shape preview.
 *   - "add": the Add Problem form for whichever category's "+" was
 *     clicked - Problem Title, Problem Description, and Mathematical
 *     Equations. The category IS the coordinate system for the new
 *     problem (no separate coordinate-system picker on this form), and
 *     the equation fields reuse EQUATION_FIELD_DEFS from
 *     modules/dynamics/MotionControls.js - the exact same field
 *     labels/keys Spatial Dynamics uses. Back returns to that
 *     category's view.
 *
 * "Apply Equations" (in the Add Problem form) builds a real
 * ParametricMotion (the identical class Spatial Dynamics itself uses to
 * represent a motion, imported from math/ParametricMotion.js - not a
 * separate/simplified validator) and hands it to EquationPreview (see
 * EquationPreview.js), which plays it back in an embedded 3D scene built
 * from Spatial Dynamics' own core pieces (SceneViewport, Particle,
 * TrajectoryTrail, Cylindrical/SphericalHelper), so a problem can't be
 * saved until its equations have actually been run through that engine -
 * inline here, without touching any file under modules/dynamics/ or
 * navigating away from the Problem Library. "Show Details" is different:
 * it deliberately *does* navigate to modules/dynamics/DynamicsModule.js
 * itself (see the "detail" view above) so the student gets the complete
 * Spatial Dynamics experience, not just the Add form's lightweight
 * preview.
 *
 * Save Question only ever appears once Apply Equations has succeeded,
 * and disappears again (requiring a fresh Apply) the moment any of
 * Title/Description/the equation fields changes afterward - so a saved
 * record can never drift from equations that were actually applied and
 * visualized. Saving persists the problem via problemStore.js
 * (localStorage), so it survives a refresh or reopening the site, and
 * lists it under its category with an Open and a Delete button.
 */
const CATEGORIES = [
  {
    id: 'cartesian',
    title: 'Cartesian Coordinates',
    description: 'Problems described directly in x, y, z.',
  },
  {
    id: 'cylindrical',
    title: 'Cylindrical Coordinates',
    description: 'Problems described in \u03C1 (rho), \u03C6 (phi), z.',
  },
  {
    id: 'spherical',
    title: 'Spherical Coordinates',
    description: 'Problems described in r, \u03B8 (theta), \u03C6 (phi).',
  },
];

export class ProblemLibraryModule {
  mount(container) {
    this.el = document.createElement('div');
    this.el.className = 'module-view';

    this.el.appendChild(
      createModuleHeader(
        'Problem Library',
        'Instructor-created problems, organized by coordinate system.'
      )
    );

    this.panel = document.createElement('div');
    this.panel.className = 'module-view__panel';
    this.el.appendChild(this.panel);

    container.appendChild(this.el);
    this._renderLibraryView();
  }

  // ==================== Library (home / category cards) view ====================

  /**
   * Home screen: only the three coordinate-system cards, nothing else.
   * Picking one opens that category's own full-panel view.
   */
  _renderLibraryView() {
    this._disposeActivePreview();
    this.panel.replaceChildren();

    const intro = document.createElement('p');
    intro.className = 'problem-library__intro';
    intro.textContent =
      'The Problem Library collects practice problems by the coordinate system they\u2019re posed in. Choose a ' +
      'coordinate system to see its saved problems.';
    this.panel.appendChild(intro);

    const categoriesEl = document.createElement('div');
    categoriesEl.className = 'problem-library__categories';
    CATEGORIES.forEach((category) => {
      categoriesEl.appendChild(this._buildCategoryCard(category));
    });
    this.panel.appendChild(categoriesEl);
  }

  /**
   * One clickable home-screen card for a coordinate system - the entire
   * card opens that category's full-panel view (_renderCategoryView).
   * @param {{id: string, title: string, description: string}} category
   */
  _buildCategoryCard(category) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'problem-library__category problem-library__category-card';
    card.setAttribute('aria-label', `Open ${category.title} problems`);
    card.addEventListener('click', () => this._renderCategoryView(category));

    const title = document.createElement('h2');
    title.className = 'problem-library__category-title';
    title.textContent = category.title;

    const description = document.createElement('p');
    description.className = 'problem-library__category-description';
    description.textContent = category.description;

    card.append(title, description);
    return card;
  }

  // ==================== Category (full-panel question list) view ====================

  /**
   * Full-panel view scoped to one coordinate system: a Back button to
   * the home screen, this category's "+" (Add Problem), and the list of
   * questions already saved to it.
   * @param {{id: 'cartesian'|'cylindrical'|'spherical', title: string, description: string}} category
   */
  _renderCategoryView(category) {
    this._disposeActivePreview();
    this.panel.replaceChildren();

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'problem-form__back';
    backBtn.textContent = '\u2190 Back to Problem Library';
    backBtn.addEventListener('click', () => this._renderLibraryView());
    this.panel.appendChild(backBtn);

    const section = document.createElement('section');
    section.className = 'problem-library__category';

    const header = document.createElement('div');
    header.className = 'problem-library__category-header';

    const title = document.createElement('h2');
    title.className = 'problem-library__category-title';
    title.textContent = category.title;

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'problem-library__add-btn';
    addBtn.textContent = '+';
    addBtn.setAttribute('aria-label', `Add a new ${category.title} problem`);
    addBtn.title = `Add a new ${category.title} problem`;
    addBtn.addEventListener('click', () => this._renderAddProblemView(category));

    header.append(title, addBtn);

    const description = document.createElement('p');
    description.className = 'problem-library__category-description';
    description.textContent = category.description;

    const body = document.createElement('div');
    body.className = 'problem-library__category-body';

    const saved = loadProblemsBySystem(category.id);
    if (saved.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'problem-library__empty';
      empty.textContent = 'No problems yet in this category.';
      body.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'problem-library__saved-list';
      saved.forEach((problem) => list.appendChild(this._buildSavedProblemItem(category, problem)));
      body.appendChild(list);
    }

    section.append(header, description, body);
    this.panel.appendChild(section);
  }

  /**
   * One saved-question row: its title, an Open button, and a Delete
   * button. Clicking the title or Open both go to that question's
   * detail view (_renderDetailView).
   * @param {{id: string, title: string}} category
   * @param {object} problem - a saved record from problemStore
   */
  _buildSavedProblemItem(category, problem) {
    const item = document.createElement('li');
    item.className = 'problem-library__saved-item';

    const row = document.createElement('div');
    row.className = 'problem-library__saved-row';

    const info = document.createElement('div');
    info.className = 'problem-library__saved-info';

    const titleBtn = document.createElement('button');
    titleBtn.type = 'button';
    titleBtn.className = 'problem-library__saved-title';
    titleBtn.textContent = problem.title || 'Untitled problem';
    titleBtn.title = 'Open this problem';
    titleBtn.addEventListener('click', () => this._renderDetailView(category, problem));

    info.appendChild(titleBtn);

    if (problem.description) {
      const desc = document.createElement('p');
      desc.className = 'problem-library__saved-description';
      desc.textContent = problem.description;
      info.appendChild(desc);
    }

    const actions = document.createElement('div');
    actions.className = 'problem-library__saved-actions';

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'problem-library__open-btn';
    openBtn.textContent = 'Open';
    openBtn.setAttribute('aria-label', `Open "${problem.title || 'Untitled problem'}"`);
    openBtn.addEventListener('click', () => this._renderDetailView(category, problem));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'problem-library__delete-btn';
    deleteBtn.textContent = '\uD83D\uDDD1 Delete';
    deleteBtn.setAttribute('aria-label', `Delete "${problem.title || 'Untitled problem'}"`);
    deleteBtn.addEventListener('click', () => {
      deleteProblem(problem.id);
      this._renderCategoryView(category);
    });

    actions.append(openBtn, deleteBtn);
    row.append(info, actions);
    item.appendChild(row);
    return item;
  }

  // ==================== Detail (single question) view ====================

  /**
   * Full-panel view for one saved question: a Back button to its
   * category view, its title, its description paragraph, its equations
   * (read-only), and a "Show Details" button that hands those equations
   * to the real Spatial Dynamics page and navigates there (see
   * app/pendingDynamicsProblem.js) - so the question plays back at full
   * page width with Position/Velocity/Acceleration/Trajectory/
   * Coordinate Information and every other Data Panel readout Spatial
   * Dynamics normally provides, not a lightweight preview.
   * @param {{id: 'cartesian'|'cylindrical'|'spherical', title: string}} category
   * @param {object} problem - a saved record from problemStore
   */
  _renderDetailView(category, problem) {
    this._disposeActivePreview();
    this.panel.replaceChildren();

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'problem-form__back';
    backBtn.textContent = `\u2190 Back to ${category.title}`;
    backBtn.addEventListener('click', () => this._renderCategoryView(category));
    this.panel.appendChild(backBtn);

    const detail = document.createElement('div');
    detail.className = 'problem-detail';

    const title = document.createElement('h2');
    title.className = 'problem-form__title';
    title.textContent = problem.title || 'Untitled problem';
    detail.appendChild(title);

    if (problem.description) {
      const description = document.createElement('p');
      description.className = 'problem-detail__description';
      description.textContent = problem.description;
      detail.appendChild(description);
    }

    const eqField = document.createElement('div');
    eqField.className = 'problem-form__field';

    const eqLabel = document.createElement('div');
    eqLabel.className = 'motion-panel__heading';
    eqLabel.textContent = 'Mathematical Equations';
    eqField.appendChild(eqLabel);

    const fieldDefs = EQUATION_FIELD_DEFS[problem.system] || [];
    fieldDefs.forEach(({ key, label }) => {
      const row = document.createElement('div');
      row.className = 'problem-detail__equation-row';

      const rowLabel = document.createElement('span');
      rowLabel.className = 'motion-panel__label';
      rowLabel.textContent = label;

      const rowValue = document.createElement('span');
      rowValue.className = 'problem-detail__equation-value';
      rowValue.textContent = (problem.equations && problem.equations[key]) || '';

      row.append(rowLabel, rowValue);
      eqField.appendChild(row);
    });
    detail.appendChild(eqField);

    const errorEl = document.createElement('div');
    errorEl.className = 'motion-panel__error';
    errorEl.hidden = true;

    // --- Show Details: hands the saved equations to Spatial Dynamics
    // and navigates to its own full-width page (see
    // app/pendingDynamicsProblem.js), rather than a preview embedded
    // here - that's the only way to get its complete Data Panel
    // (Position, Velocity, Acceleration, Trajectory/Coordinate
    // Information, ...), not just the shape. ---
    const showBtn = document.createElement('button');
    showBtn.type = 'button';
    showBtn.className = 'motion-panel__button motion-panel__button--primary';
    showBtn.textContent = 'Show Details';
    showBtn.addEventListener('click', () => {
      // Saved equations were already validated at save time, but
      // re-check before navigating so a corrupted record fails quietly
      // here instead of arriving broken on the Spatial Dynamics page.
      try {
        new ParametricMotion(problem.system, problem.equations);
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
        return;
      }

      errorEl.hidden = true;
      setPendingDynamicsProblem({ system: problem.system, equations: problem.equations });
      window.location.hash = '#/dynamics';
    });

    detail.append(showBtn, errorEl);
    this.panel.appendChild(detail);
  }

  _disposeActivePreview() {
    if (this._activePreview) {
      this._activePreview.dispose();
      this._activePreview = null;
    }
  }

  // ==================== Add Problem view ====================

  /**
   * @param {{id: 'cartesian'|'cylindrical'|'spherical', title: string}} category
   *   - the category whose "+" was clicked; its id IS the new problem's
   *     coordinate system, determined automatically (no picker here).
   *     Back returns to this category's own view (not the home screen).
   */
  _renderAddProblemView(category) {
    this._disposeActivePreview();
    this.panel.replaceChildren();

    const form = document.createElement('div');
    form.className = 'problem-form';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'problem-form__back';
    backBtn.textContent = `\u2190 Back to ${category.title}`;
    backBtn.addEventListener('click', () => this._renderCategoryView(category));
    form.appendChild(backBtn);

    const title = document.createElement('h2');
    title.className = 'problem-form__title';
    title.textContent = `New ${category.title} Problem`;
    form.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'problem-form__subtitle';
    subtitle.textContent = `This problem will be added to the ${category.title} category.`;
    form.appendChild(subtitle);

    const titleField = this._buildTextField('Problem Title', 'text', 'e.g. Helical motion around the z-axis');
    const descriptionField = this._buildTextField(
      'Problem Description',
      'textarea',
      'Describe the problem, what the student should find, and any relevant context.'
    );
    form.append(titleField.element, descriptionField.element);
    form.appendChild(this._buildEquationField(category, titleField.input, descriptionField.input));

    this.panel.appendChild(form);
  }

  /**
   * @returns {{element: HTMLElement, input: HTMLInputElement|HTMLTextAreaElement}}
   *   a labeled title/description field, reusing Dynamics' input styling
   */
  _buildTextField(labelText, type, placeholder) {
    const field = document.createElement('div');
    field.className = 'problem-form__field';

    const label = document.createElement('div');
    label.className = 'motion-panel__heading';
    label.textContent = labelText;
    field.appendChild(label);

    const input =
      type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    if (type !== 'textarea') input.type = type;
    input.className = 'motion-panel__input motion-panel__input--text';
    if (type === 'textarea') input.classList.add('motion-panel__input--textarea');
    input.placeholder = placeholder;
    input.setAttribute('aria-label', labelText);
    field.appendChild(input);

    return { element: field, input };
  }

  /**
   * Builds the Mathematical Equations field: three rows labeled/keyed
   * exactly as EQUATION_FIELD_DEFS[system] defines them (the same lookup
   * Spatial Dynamics' own Equation Input section uses), an Apply
   * Equations button, and - appearing only after a successful apply - an
   * embedded 3D preview (EquationPreview) plus the Save Question button.
   * Editing any field afterward hides both again until Apply Equations
   * is re-run, so a saved problem always matches equations that were
   * actually applied and visualized.
   * @param {{id: 'cartesian'|'cylindrical'|'spherical', title: string}} category
   * @param {HTMLInputElement} titleInput
   * @param {HTMLTextAreaElement} descriptionInput
   * @returns {HTMLElement}
   */
  _buildEquationField(category, titleInput, descriptionInput) {
    const system = category.id;
    const wrapper = document.createElement('div');

    // --- equation inputs + Apply Equations ---
    const eqField = document.createElement('div');
    eqField.className = 'problem-form__field';

    const label = document.createElement('div');
    label.className = 'motion-panel__heading';
    label.textContent = 'Mathematical Equations';
    eqField.appendChild(label);

    const fieldDefs = EQUATION_FIELD_DEFS[system];
    const inputs = fieldDefs.map(({ key, label: rowLabel }) => {
      const row = document.createElement('div');
      row.className = 'motion-panel__row';

      const rowLabelEl = document.createElement('label');
      rowLabelEl.className = 'motion-panel__label';
      rowLabelEl.textContent = rowLabel;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'motion-panel__input';
      input.spellcheck = false;
      input.setAttribute('aria-label', `${rowLabel} equation`);

      row.append(rowLabelEl, input);
      eqField.appendChild(row);
      return { key, input };
    });

    const errorEl = document.createElement('div');
    errorEl.className = 'motion-panel__error';
    errorEl.hidden = true;
    eqField.appendChild(errorEl);

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'motion-panel__button motion-panel__button--primary';
    applyBtn.textContent = 'Apply Equations';
    eqField.appendChild(applyBtn);

    // --- 3D preview + Save Question (hidden until Apply succeeds) ---
    const previewField = document.createElement('div');
    previewField.className = 'problem-form__field';
    previewField.hidden = true;

    const previewLabel = document.createElement('div');
    previewLabel.className = 'motion-panel__heading';
    previewLabel.textContent = '3D Visualization';
    previewField.appendChild(previewLabel);

    const previewContainer = document.createElement('div');
    previewContainer.className = 'problem-library__preview';
    previewField.appendChild(previewContainer);

    const saveStatusEl = document.createElement('div');
    saveStatusEl.className = 'problem-library__save-status';
    saveStatusEl.hidden = true;

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'motion-panel__button motion-panel__button--primary problem-library__save-btn';
    saveBtn.textContent = 'Save Question';
    previewField.append(saveBtn, saveStatusEl);

    let appliedEquations = null;

    const hideSave = () => {
      appliedEquations = null;
      previewField.hidden = true;
      saveStatusEl.hidden = true;
      this._disposeActivePreview();
    };

    applyBtn.addEventListener('click', () => {
      const equations = Object.fromEntries(inputs.map(({ key, input }) => [key, input.value]));

      let motion;
      try {
        motion = new ParametricMotion(system, equations);
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
        hideSave();
        return;
      }

      errorEl.hidden = true;
      appliedEquations = equations;
      this._disposeActivePreview();
      previewField.hidden = false;
      saveStatusEl.hidden = true;
      this._activePreview = new EquationPreview(previewContainer, motion, system);
    });

    saveBtn.addEventListener('click', () => {
      if (!appliedEquations) return; // guarded by previewField being hidden otherwise, but keep this safe

      const problemTitle = titleInput.value.trim();
      if (!problemTitle) {
        saveStatusEl.textContent = 'Enter a problem title before saving.';
        saveStatusEl.hidden = false;
        titleInput.focus();
        return;
      }

      saveProblem({
        system,
        title: problemTitle,
        description: descriptionInput.value.trim(),
        equations: appliedEquations,
      });

      this._renderCategoryView(category);
    });

    // Editing anything after a successful Apply invalidates it - the
    // preview/Save Question only reappear once Apply Equations is run
    // again against the new values.
    [titleInput, descriptionInput, ...inputs.map(({ input }) => input)].forEach((el) => {
      el.addEventListener('input', () => {
        if (appliedEquations) hideSave();
      });
    });

    wrapper.append(eqField, previewField);
    return wrapper;
  }

  unmount() {
    this._disposeActivePreview();
    if (this.el && this.el.parentElement) this.el.parentElement.removeChild(this.el);
  }
}

const DEFAULT_WIDTH = 300;

/**
 * Sidebar
 * ----------------------------------------------------------------------
 * A generic, reusable sidebar shell used beside a 3D viewport:
 *   - draggable divider to resize its width, clamped to [minWidth, maxWidth]
 *   - a whole-sidebar collapse/expand toggle (collapses to a slim rail)
 *   - a vertically-scrollable content area
 *   - any number of independently collapsible Sections
 *
 * This class knows nothing about Spatial Dynamics, motion equations, or
 * coordinate systems - it only builds/manages the sidebar chrome itself.
 * MotionControls (or any future module) composes one of these and adds
 * its own Sections into it. Keeping this generic here (core/) rather
 * than inside modules/dynamics/ is what lets later phases/modules reuse
 * the exact same resizable/collapsible panel without copying code.
 *
 * Because resizing/collapsing changes this.el's width via plain CSS
 * (flex-basis), no explicit "notify the 3D scene" step is needed - the
 * SceneManager sitting in the sibling flex item watches its own
 * container with a ResizeObserver, so it picks up the new size on its
 * own (see SceneManager._initScene/_onResize).
 *
 * Pass `side: 'left'` to use this as a panel to the LEFT of the scene
 * instead of the default (right). This only flips which edge the
 * resizer/border sit on and which way dragging grows the panel - all
 * other behavior (collapse, sections, scrolling) is identical either
 * way.
 */
export class Sidebar {
  /**
   * @param {object} [options]
   * @param {number} [options.defaultWidth=300]
   * @param {number} [options.minWidth=240]
   * @param {number} [options.maxWidth=480]
   * @param {string} [options.title='Controls']
   * @param {'left'|'right'} [options.side='right'] - which side of the scene this panel sits on
   */
  constructor(options = {}) {
    this.minWidth = options.minWidth ?? 240;
    this.maxWidth = options.maxWidth ?? 480;
    this.width = clamp(options.defaultWidth ?? DEFAULT_WIDTH, this.minWidth, this.maxWidth);
    this.collapsed = false;
    this.sections = [];
    this.side = options.side === 'left' ? 'left' : 'right';

    this.el = document.createElement('aside');
    this.el.className = this.side === 'left' ? 'sidebar sidebar--left' : 'sidebar';
    this.el.style.width = `${this.width}px`;

    this._buildResizer();
    this._buildHeader(options.title ?? 'Controls');
    this._buildScrollableBody();

    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onContentScroll = this._onContentScroll.bind(this);
    this._onThumbPointerMove = this._onThumbPointerMove.bind(this);
    this._onThumbPointerUp = this._onThumbPointerUp.bind(this);
    this._updateScrollThumb = this._updateScrollThumb.bind(this);

    this.content.addEventListener('scroll', this._onContentScroll, { passive: true });
    // The thumb must be re-measured whenever the content's *scrollable*
    // size changes, not just when the visible container resizes:
    //   - this.body resizing (window resize, sidebar drag, collapse) -
    //     ResizeObserver reports that directly.
    //   - a section opening/closing, an equation error appearing, etc. -
    //     these change this.content's inner scrollHeight without
    //     changing this.content's own (fixed) box size, so a
    //     ResizeObserver on it would never fire; a MutationObserver
    //     watching for DOM/class changes inside it does.
    this._bodyResizeObserver = new ResizeObserver(this._updateScrollThumb);
    this._bodyResizeObserver.observe(this.body);
    this._contentMutationObserver = new MutationObserver(() =>
      requestAnimationFrame(this._updateScrollThumb)
    );
    this._contentMutationObserver.observe(this.content, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style'],
    });
    this._updateScrollThumb();
  }

  /**
   * Builds the scrollable region: a positioned wrapper (`this.body`,
   * the flex item that actually fills the remaining height below the
   * fixed header) containing the real scrollable content
   * (`this.content`, native overflow-y: auto - still fully usable with
   * the mouse wheel, trackpad, touch, and keyboard on its own) plus a
   * custom scrollbar track + thumb overlaid on top of it.
   *
   * The custom thumb exists because native scrollbar *appearance*
   * varies a lot across browsers/OSes (some hide it until hover, macOS
   * Safari mostly ignores the ::-webkit-scrollbar styling in
   * style.css, some OS settings auto-hide scrollbars entirely) - so a
   * purely CSS-styled native scrollbar can end up invisible even
   * though scrolling itself still works. This custom thumb is plain
   * DOM/CSS, always rendered the same way everywhere, is kept in sync
   * with the real scrollTop via the 'scroll' listener above, and can
   * also be dragged to scroll - so it's a genuinely functional control,
   * not just a decoration. The content's own native scrollbar is
   * hidden (see .sidebar__content in style.css) so the two never
   * double up visually; wheel/touch/keyboard scrolling is untouched.
   */
  _buildScrollableBody() {
    this.body = document.createElement('div');
    this.body.className = 'sidebar__body';

    this.content = document.createElement('div');
    this.content.className = 'sidebar__content';

    this.scrollbarTrack = document.createElement('div');
    this.scrollbarTrack.className = 'sidebar__scrollbar';
    this.scrollbarThumb = document.createElement('div');
    this.scrollbarThumb.className = 'sidebar__scrollbar-thumb';
    this.scrollbarThumb.addEventListener('pointerdown', (e) => this._onThumbPointerDown(e));
    this.scrollbarTrack.appendChild(this.scrollbarThumb);

    this.body.append(this.content, this.scrollbarTrack);
    this.el.appendChild(this.body);
  }

  _buildResizer() {
    this.resizer = document.createElement('div');
    this.resizer.className = 'sidebar__resizer';
    this.resizer.setAttribute('role', 'separator');
    this.resizer.setAttribute('aria-orientation', 'vertical');
    this.resizer.setAttribute('aria-label', 'Resize sidebar');
    this.resizer.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    this.el.appendChild(this.resizer);
  }

  _buildHeader(title) {
    const header = document.createElement('div');
    header.className = 'sidebar__header';

    const titleEl = document.createElement('span');
    titleEl.className = 'sidebar__title';
    titleEl.textContent = title;

    this.collapseBtn = document.createElement('button');
    this.collapseBtn.type = 'button';
    this.collapseBtn.className = 'sidebar__collapse-btn';
    this.collapseBtn.setAttribute('aria-label', 'Collapse sidebar');
    this.collapseBtn.textContent = this._collapseIcon(false);
    this.collapseBtn.addEventListener('click', () => this.setCollapsed(!this.collapsed));

    header.append(titleEl, this.collapseBtn);
    this.el.appendChild(header);
  }

  /**
   * Which way the collapse-button arrow points depends on which side of
   * the scene this panel sits on, so it always visually points toward
   * the edge the panel is about to collapse against.
   * @param {boolean} collapsed
   */
  _collapseIcon(collapsed) {
    const pointLeft = this.side === 'left' ? collapsed : !collapsed;
    return pointLeft ? '\u00AB' : '\u00BB'; // « : »
  }

  _onPointerDown(e) {
    if (this.collapsed) return;
    this._dragStartX = e.clientX;
    this._dragStartWidth = this.width;
    this.resizer.classList.add('is-dragging');
    this.resizer.setPointerCapture(e.pointerId);
    document.addEventListener('pointermove', this._onPointerMove);
    document.addEventListener('pointerup', this._onPointerUp);
  }

  _onPointerMove(e) {
    // The resizer sits on the edge bordering the scene: the sidebar's
    // left edge for a 'right' panel, its right edge for a 'left' panel.
    // Dragging toward the scene always shrinks the panel, dragging away
    // from it always grows it - which flips the sign of dx depending on
    // which side the panel is on.
    const dx = e.clientX - this._dragStartX;
    const delta = this.side === 'left' ? dx : -dx;
    this.setWidth(this._dragStartWidth + delta);
  }

  _onPointerUp() {
    this.resizer.classList.remove('is-dragging');
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
  }

  _onContentScroll() {
    this._updateScrollThumb();
  }

  /**
   * Recomputes the custom thumb's height/position from the content's
   * real scrollHeight/scrollTop/clientHeight, and hides the whole
   * scrollbar when there's nothing to scroll (content fits without
   * overflowing) - a full-track thumb with nowhere to go isn't useful.
   */
  _updateScrollThumb() {
    const { scrollHeight, clientHeight, scrollTop } = this.content;
    const trackHeight = this.scrollbarTrack.clientHeight;
    const scrollable = scrollHeight - clientHeight;

    if (scrollable <= 1 || trackHeight <= 0) {
      this.scrollbarTrack.classList.remove('is-visible');
      return;
    }
    this.scrollbarTrack.classList.add('is-visible');

    const MIN_THUMB = 28; // px - stays comfortably grabbable even for very long content
    const thumbHeight = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * trackHeight);
    const maxThumbTravel = trackHeight - thumbHeight;
    const thumbTop = maxThumbTravel * (scrollTop / scrollable);

    this.scrollbarThumb.style.height = `${thumbHeight}px`;
    this.scrollbarThumb.style.transform = `translateY(${thumbTop}px)`;
  }

  _onThumbPointerDown(e) {
    e.preventDefault(); // avoid text selection while dragging
    this._thumbDragStartY = e.clientY;
    this._thumbDragStartScrollTop = this.content.scrollTop;
    this.scrollbarThumb.classList.add('is-dragging');
    this.scrollbarThumb.setPointerCapture(e.pointerId);
    document.addEventListener('pointermove', this._onThumbPointerMove);
    document.addEventListener('pointerup', this._onThumbPointerUp);
  }

  _onThumbPointerMove(e) {
    const { scrollHeight, clientHeight } = this.content;
    const scrollable = scrollHeight - clientHeight;
    const trackHeight = this.scrollbarTrack.clientHeight;
    const thumbHeight = this.scrollbarThumb.clientHeight;
    const maxThumbTravel = trackHeight - thumbHeight;
    if (maxThumbTravel <= 0) return;

    // Dragging the thumb by dy pixels should move the content by
    // however many scrollTop pixels correspond to that fraction of the
    // thumb's own travel range - i.e. the inverse of the ratio used to
    // size/position the thumb in _updateScrollThumb().
    const dy = e.clientY - this._thumbDragStartY;
    const scrollDelta = (dy / maxThumbTravel) * scrollable;
    this.content.scrollTop = clamp(this._thumbDragStartScrollTop + scrollDelta, 0, scrollable);
  }

  _onThumbPointerUp() {
    this.scrollbarThumb.classList.remove('is-dragging');
    document.removeEventListener('pointermove', this._onThumbPointerMove);
    document.removeEventListener('pointerup', this._onThumbPointerUp);
  }

  /** @param {number} width - clamped to [minWidth, maxWidth] */
  setWidth(width) {
    this.width = clamp(width, this.minWidth, this.maxWidth);
    if (!this.collapsed) this.el.style.width = `${this.width}px`;
  }

  /** @param {boolean} collapsed */
  setCollapsed(collapsed) {
    this.collapsed = collapsed;
    this.el.classList.toggle('is-collapsed', collapsed);
    this.el.style.width = collapsed ? '' : `${this.width}px`;
    this.collapseBtn.textContent = this._collapseIcon(collapsed);
    this.collapseBtn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    // Expanding again can reveal a different scrollable height than
    // when it collapsed (window may have resized meanwhile).
    if (!collapsed) requestAnimationFrame(this._updateScrollThumb);
  }

  /**
   * Adds a new collapsible section to the sidebar's scrollable content
   * area and returns a handle for building/updating its body.
   * @param {string} title
   * @param {object} [options]
   * @param {boolean} [options.defaultOpen=true]
   * @returns {{el: HTMLElement, bodyEl: HTMLElement, setOpen: (open: boolean) => void}}
   */
  addSection(title, options = {}) {
    const defaultOpen = options.defaultOpen ?? true;

    const section = document.createElement('section');
    section.className = 'sidebar-section';
    section.classList.toggle('is-open', defaultOpen);

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'sidebar-section__header';

    const titleEl = document.createElement('span');
    titleEl.textContent = title;

    const chevron = document.createElement('span');
    chevron.className = 'sidebar-section__chevron';
    chevron.textContent = '\u203A'; // ›
    chevron.setAttribute('aria-hidden', 'true');

    header.append(titleEl, chevron);

    const body = document.createElement('div');
    body.className = 'sidebar-section__body';

    const setOpen = (open) => {
      section.classList.toggle('is-open', open);
      header.setAttribute('aria-expanded', String(open));
    };

    header.addEventListener('click', () => setOpen(!section.classList.contains('is-open')));
    setOpen(defaultOpen);

    section.append(header, body);
    this.content.appendChild(section);

    const handle = { el: section, bodyEl: body, setOpen };
    this.sections.push(handle);
    return handle;
  }

  /**
   * Adds a plain (non-collapsible) label into the content flow, used to
   * visually group a run of sections under a heading (e.g. "Data
   * Panel" above Position/Velocity/Acceleration/Coordinate Systems).
   * @param {string} text
   */
  addGroupLabel(text) {
    const el = document.createElement('div');
    el.className = 'sidebar__group-label';
    el.textContent = text;
    this.content.appendChild(el);
    return el;
  }

  dispose() {
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
    document.removeEventListener('pointermove', this._onThumbPointerMove);
    document.removeEventListener('pointerup', this._onThumbPointerUp);
    this.content.removeEventListener('scroll', this._onContentScroll);
    if (this._bodyResizeObserver) this._bodyResizeObserver.disconnect();
    if (this._contentMutationObserver) this._contentMutationObserver.disconnect();
    if (this.el.parentElement) this.el.parentElement.removeChild(this.el);
  }
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

import { ParametricMotion } from '../../math/ParametricMotion.js';
import { magnitude, isFiniteVector } from '../../math/vectorMath.js';
import { cartesianToCylindrical, cartesianToSpherical } from '../../math/coordinateSystems.js';
import { SceneViewport } from '../../core/SceneViewport.js';
import { Particle } from '../dynamics/Particle.js';
import { TrajectoryTrail } from '../dynamics/TrajectoryTrail.js';
import { VectorArrow } from '../dynamics/VectorArrow.js';
import { CylindricalHelper } from '../dynamics/CylindricalHelper.js';
import { SphericalHelper } from '../dynamics/SphericalHelper.js';
import { PositionVectorArrow } from '../dynamics/PositionVectorArrow.js';
import { StepByStepDerivation } from '../dynamics/StepByStepDerivation.js';
import {
  EQUATION_FIELD_DEFS,
} from '../dynamics/MotionControls.js';
import {
  VELOCITY_ARROW_SCALE,
  ACCELERATION_ARROW_SCALE,
  VELOCITY_ARROW_COLOR,
  ACCELERATION_ARROW_COLOR,
  VELOCITY_LABEL_COLOR,
  ACCELERATION_LABEL_COLOR,
  POSITION_VECTOR_COLOR,
  DEFAULT_T_MAX,
} from '../dynamics/DynamicsModule.js';
import { t, coordSystemLabel, isRTL } from '../../i18n/i18n.js';

/**
 * ProblemReportExport
 * ----------------------------------------------------------------------
 * "Download as PDF" for a single saved Problem Library question (see
 * ProblemLibraryModule's saved-question row). Builds a self-contained,
 * printable scientific-report page - title, description, the saved
 * equations exactly as entered, the coordinate system used, Position/
 * Velocity/Acceleration at a chosen snapshot instant, the same
 * Step-by-Step Derivation section Spatial Dynamics itself shows, and a
 * real 3D render of the motion - then prints it via a hidden, off-screen
 * same-page iframe (see printReportViaHiddenIframe) and triggers the
 * browser's native print dialog, whose "Save as PDF" destination is
 * what actually produces the PDF file. Printing through an iframe
 * rather than a new window/tab means there is nothing for a pop-up
 * blocker to catch, no matter how long the student takes choosing a
 * time beforehand. This also avoids bundling a PDF-generation library
 * and, just as importantly, avoids
 * re-implementing font/Unicode handling for the math symbols (\u03C1,
 * \u03B8, \u03C6, \u2032, \u2033, ...) the derivation already uses -
 * the browser's own text engine renders them exactly as it does
 * everywhere else in SMIP.
 *
 * Everything numeric/visual in the report is produced by re-running the
 * exact same engine pieces the rest of the app uses:
 *   - math/ParametricMotion.js for position/velocity/acceleration
 *   - math/coordinateSystems.js for the cylindrical/spherical conversions
 *   - modules/dynamics/StepByStepDerivation.js for the derivation text
 *     (mounted into a detached, off-DOM container and read back out -
 *     see _buildDerivationHtml - so its own symbolic-derivative logic
 *     is never duplicated here)
 *   - modules/dynamics/{Particle,TrajectoryTrail,VectorArrow,
 *     CylindricalHelper,SphericalHelper,PositionVectorArrow}.js and
 *     core/SceneViewport.js for the 3D snapshot (see
 *     _captureMotionSnapshot), built the same way EquationPreview.js
 *     builds its own inline preview - just off-screen and captured as
 *     a single still image instead of animated.
 * Nothing here re-derives a formula or re-implements a rendering rule
 * that already exists elsewhere in the app.
 */

// Instant the report's snapshot/readouts/derivation are all evaluated
// at by default - the user can override this (see the "Download as
// PDF" time prompt in ProblemLibraryModule.js), which is why
// downloadProblemReportPdf below takes it as a parameter rather than
// using this constant directly. Keeping every number in the report
// (Position/Velocity/Acceleration, the derivation's Substitution/Final
// Result steps, and the 3D image) tied to the same moment in time
// either way.
export const DEFAULT_SNAPSHOT_TIME = 5;
// Reused as-is (not duplicated) from Spatial Dynamics' own "maximum
// time" (see DynamicsModule's DEFAULT_T_MAX) so the time prompt can't
// ask for an instant the simulation itself never reaches.
export const MAX_SNAPSHOT_TIME = DEFAULT_T_MAX;

const SNAPSHOT_WIDTH = 880;
const SNAPSHOT_HEIGHT = 540;
// How densely the trajectory is sampled to draw the trail in the
// snapshot - purely a rendering density, not a physics parameter.
const TRAIL_SAMPLE_COUNT = 360;
// The exact literal camera position SceneManager itself defaults to
// (see SceneManager._initCamera) - reused here so the snapshot starts
// from the same viewing angle as every other SMIP scene, just pulled
// back along that same direction when a problem's scale needs it (see
// _captureMotionSnapshot).
const DEFAULT_CAMERA_DIRECTION = { x: 10, y: 8, z: 12 };
const ZERO_VECTOR = { x: 0, y: 0, z: 0 };

function fmt(n) {
  return n === null || n === undefined || !Number.isFinite(n) ? '\u2014' : n.toFixed(2);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

/**
 * Renders a real, off-screen 3D snapshot of the motion at `tSnapshot`,
 * built from the same rendering primitives Spatial Dynamics/
 * EquationPreview use, and returns it as a PNG data URL.
 * @param {'cartesian'|'cylindrical'|'spherical'} system
 * @param {ParametricMotion} motion
 * @param {number} tSnapshot
 * @returns {Promise<string>}
 */
function captureMotionSnapshot(system, motion, tSnapshot) {
  return new Promise((resolve, reject) => {
    const host = document.createElement('div');
    // Off-screen but still laid out/rendered (not `display: none`,
    // which WebGL/ResizeObserver would treat as zero-size) - fixed
    // positioning far outside the viewport keeps it invisible and out
    // of document flow without affecting anything else on the page.
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = '-100000px';
    host.style.width = `${SNAPSHOT_WIDTH}px`;
    host.style.height = `${SNAPSHOT_HEIGHT}px`;
    document.body.appendChild(host);

    let viewport;
    let particle;
    let trail;
    let velocityArrow;
    let accelerationArrow;
    let positionVectorArrow;
    let cylindricalHelper;
    let sphericalHelper;

    const cleanup = () => {
      if (particle) particle.dispose();
      if (trail) trail.dispose();
      if (velocityArrow) velocityArrow.dispose();
      if (accelerationArrow) accelerationArrow.dispose();
      if (positionVectorArrow) positionVectorArrow.dispose();
      if (cylindricalHelper) cylindricalHelper.dispose();
      if (sphericalHelper) sphericalHelper.dispose();
      if (viewport) viewport.dispose();
      if (host.parentElement) host.parentElement.removeChild(host);
    };

    try {
      viewport = new SceneViewport(host);
      const scene = viewport.sceneManager.scene;

      particle = new Particle(scene);
      trail = new TrajectoryTrail(scene);
      velocityArrow = new VectorArrow(scene, {
        color: VELOCITY_ARROW_COLOR,
        scale: VELOCITY_ARROW_SCALE,
        label: 'V',
        labelColor: VELOCITY_LABEL_COLOR,
      });
      accelerationArrow = new VectorArrow(scene, {
        color: ACCELERATION_ARROW_COLOR,
        scale: ACCELERATION_ARROW_SCALE,
        label: 'a',
        labelColor: ACCELERATION_LABEL_COLOR,
      });
      positionVectorArrow = new PositionVectorArrow(scene, { color: POSITION_VECTOR_COLOR });
      cylindricalHelper = system === 'cylindrical' ? new CylindricalHelper(scene) : null;
      sphericalHelper = system === 'spherical' ? new SphericalHelper(scene) : null;
      if (cylindricalHelper) cylindricalHelper.setVisible(true);
      if (sphericalHelper) sphericalHelper.setVisible(true);

      // Redraws the same trail the student would have seen playing this
      // motion from t=0 up to the snapshot instant, and tracks how far
      // it strays from the origin so the camera can be pulled back
      // enough to keep it (and the axes) in frame - see below.
      let maxExtent = 10; // floor: keeps the default axesLength (10) comfortably in frame even for a tiny/near-origin motion
      for (let i = 0; i <= TRAIL_SAMPLE_COUNT; i++) {
        const sampleT = (tSnapshot * i) / TRAIL_SAMPLE_COUNT;
        const point = motion.positionAt(sampleT);
        if (!isFiniteVector(point)) continue;
        trail.addPoint(point);
        maxExtent = Math.max(maxExtent, magnitude(point));
      }

      const position = motion.positionAt(tSnapshot);
      const velocity = motion.velocityAt(tSnapshot);
      const acceleration = motion.accelerationAt(tSnapshot);
      const velocityValid = isFiniteVector(velocity);
      const accelerationValid = isFiniteVector(acceleration);

      particle.setPosition(position);
      velocityArrow.update(position, velocityValid ? velocity : ZERO_VECTOR);
      accelerationArrow.update(position, accelerationValid ? acceleration : ZERO_VECTOR);
      positionVectorArrow.update(position, magnitude(position));
      if (cylindricalHelper) cylindricalHelper.update(position, cartesianToCylindrical(position));
      if (sphericalHelper) sphericalHelper.update(position, cartesianToSpherical(position));

      // Same viewing angle SceneManager always starts a scene with,
      // just pulled back along that same direction so a larger-scale
      // problem's full trajectory still fits in the frame.
      const dirLength = Math.sqrt(
        DEFAULT_CAMERA_DIRECTION.x ** 2 + DEFAULT_CAMERA_DIRECTION.y ** 2 + DEFAULT_CAMERA_DIRECTION.z ** 2
      );
      const fitScale = Math.max(1, (maxExtent * 1.6) / 11);
      const distance = dirLength * fitScale;
      viewport.sceneManager.camera.position.set(
        (DEFAULT_CAMERA_DIRECTION.x / dirLength) * distance,
        (DEFAULT_CAMERA_DIRECTION.y / dirLength) * distance,
        (DEFAULT_CAMERA_DIRECTION.z / dirLength) * distance
      );
      viewport.sceneManager.controls.target.set(0, 0, 0);
    } catch (err) {
      cleanup();
      reject(err);
      return;
    }

    // SceneManager's own requestAnimationFrame render loop is what
    // actually draws the frame(s) above - give it a couple of frames
    // (lets OrbitControls' damping settle onto the camera position we
    // just set) before reading the canvas back out as an image.
    let framesWaited = 0;
    const waitAndCapture = () => {
      framesWaited += 1;
      if (framesWaited < 3) {
        requestAnimationFrame(waitAndCapture);
        return;
      }
      try {
        const dataUrl = viewport.sceneManager.renderer.domElement.toDataURL('image/png');
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    requestAnimationFrame(waitAndCapture);
  });
}

/**
 * Renders the Step-by-Step Derivation section's markup by mounting the
 * real StepByStepDerivation class into a detached container and
 * reading its output back out - so the report shows literally the same
 * derivation Spatial Dynamics itself computes and displays, never a
 * re-implementation of it.
 * @param {'cartesian'|'cylindrical'|'spherical'} system
 * @param {object} equations
 * @param {object} livePayload - see StepByStepDerivation.update
 * @returns {string} innerHTML of the rendered static+live steps
 */
function buildDerivationHtml(system, equations, livePayload) {
  const container = document.createElement('div');
  const derivation = new StepByStepDerivation();
  derivation.mount(container);
  derivation.setEquations(system, equations);
  derivation.update(livePayload);
  const html = container.innerHTML;
  derivation.dispose();
  return html;
}

function buildEquationsHtml(system, equations) {
  const fieldDefs = EQUATION_FIELD_DEFS[system] || [];
  return fieldDefs
    .map(
      ({ key, label }) =>
        `<div class="eq-row"><span class="eq-label">${escapeHtml(label)}</span>` +
        `<span class="eq-value">${escapeHtml(equations[key] ?? '')}</span></div>`
    )
    .join('');
}

function buildVectorRowsHtml(rows) {
  return rows
    .map(
      ({ label, value }) =>
        `<div class="vec-row"><span class="vec-label">${escapeHtml(label)}</span>` +
        `<span class="vec-value">${escapeHtml(value)}</span></div>`
    )
    .join('');
}

/**
 * Assembles the full, self-contained report HTML document (its own
 * <style>, no dependency on the app's own stylesheet since this opens
 * in a brand-new, blank window).
 */
function buildReportDocument({
  category,
  problem,
  tSnapshot,
  position,
  cylindrical,
  spherical,
  velocity,
  speed,
  acceleration,
  accelMagnitude,
  snapshotDataUrl,
  derivationHtml,
}) {
  const rtl = isRTL();
  const title = problem.title || t('untitledProblem');
  const generatedOn = t('reportGeneratedOn', { date: new Date().toLocaleString() });

  const positionRows = buildVectorRowsHtml([
    { label: 'x', value: fmt(position.x) },
    { label: 'y', value: fmt(position.y) },
    { label: 'z', value: fmt(position.z) },
    { label: '|r|', value: fmt(magnitude(position)) },
  ]);
  const cylindricalRows = buildVectorRowsHtml([
    { label: '\u03C1', value: fmt(cylindrical.rho) },
    { label: '\u03C6', value: `${fmt(cylindrical.phi)} rad` },
    { label: 'z', value: fmt(cylindrical.z) },
  ]);
  const sphericalRows = buildVectorRowsHtml([
    { label: 'r', value: fmt(spherical.r) },
    { label: '\u03B8', value: `${fmt(spherical.theta)} rad` },
    { label: '\u03C6', value: `${fmt(spherical.phi)} rad` },
  ]);
  const velocityRows = buildVectorRowsHtml([
    { label: 'vx', value: fmt(velocity && velocity.x) },
    { label: 'vy', value: fmt(velocity && velocity.y) },
    { label: 'vz', value: fmt(velocity && velocity.z) },
    { label: '|v|', value: fmt(speed) },
  ]);
  const accelerationRows = buildVectorRowsHtml([
    { label: 'ax', value: fmt(acceleration && acceleration.x) },
    { label: 'ay', value: fmt(acceleration && acceleration.y) },
    { label: 'az', value: fmt(acceleration && acceleration.z) },
    { label: '|a|', value: fmt(accelMagnitude) },
  ]);

  return `<!doctype html>
<html lang="${rtl ? 'ar' : 'en'}" dir="${rtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  :root {
    --report-bg: #ffffff;
    --report-surface: #f5f7fa;
    --report-border: #d3dae2;
    --report-text: #1b232c;
    --report-text-muted: #5b6672;
    --report-accent: #8a5209;
    --report-velocity: #0a6b62;
    --report-acceleration: #c2255c;
    --report-font-ui: 'Inter', system-ui, -apple-system, sans-serif;
    --report-font-mono: 'JetBrains Mono', 'Consolas', monospace;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 2.2rem 2.6rem 3rem;
    background: var(--report-bg);
    color: var(--report-text);
    font-family: var(--report-font-ui);
    line-height: 1.5;
  }
  header.report-header {
    border-bottom: 2px solid var(--report-accent);
    padding-bottom: 0.9rem;
    margin-bottom: 1.6rem;
  }
  .report-brand {
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--report-text-muted);
    margin: 0 0 0.35rem;
  }
  .report-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.3rem;
  }
  .report-meta {
    font-size: 0.75rem;
    color: var(--report-text-muted);
    margin: 0;
  }
  section.report-section {
    margin-bottom: 1.5rem;
    break-inside: avoid;
  }
  .report-section__title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--report-accent);
    border-bottom: 1px solid var(--report-border);
    padding-bottom: 0.3rem;
    margin: 0 0 0.6rem;
  }
  .report-description {
    font-size: 0.88rem;
    white-space: pre-wrap;
  }
  .eq-row, .vec-row {
    display: flex;
    gap: 0.6rem;
    font-family: var(--report-font-mono);
    font-size: 0.85rem;
    padding: 0.15rem 0;
  }
  .eq-label, .vec-label {
    min-width: 3.2rem;
    color: var(--report-text-muted);
    font-weight: 600;
  }
  .eq-value, .vec-value {
    color: var(--report-text);
  }
  .vector-groups {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem 2rem;
  }
  .vector-group__heading {
    font-size: 0.78rem;
    font-weight: 700;
    margin: 0 0 0.3rem;
    color: var(--report-text-muted);
  }
  .vector-group--velocity .vec-label { color: var(--report-velocity); }
  .vector-group--acceleration .vec-label { color: var(--report-acceleration); }
  .snapshot-figure {
    margin: 0;
    text-align: center;
  }
  .snapshot-figure img {
    max-width: 100%;
    border: 1px solid var(--report-border);
    border-radius: 6px;
    background: #0d1117;
  }
  .snapshot-figure figcaption {
    font-size: 0.75rem;
    color: var(--report-text-muted);
    margin-top: 0.4rem;
  }
  /* Reused as-is from the app's own Step-by-Step Derivation styling
     (see style.css's .derivation-step rules) so the derivation, which
     is injected verbatim from StepByStepDerivation.js, keeps the exact
     same formatting/spacing here. */
  .derivation__static, .derivation__live {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 0.85rem 1.75rem;
    align-items: start;
  }
  .derivation__live {
    border-top: 1px solid var(--report-border);
    margin-top: 0.9rem;
    padding-top: 0.9rem;
  }
  .derivation-step__title {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--report-accent);
    line-height: 1.4;
    margin-bottom: 0.25rem;
  }
  .derivation-step__line {
    font-family: var(--report-font-mono);
    font-size: 0.78rem;
    line-height: 1.55;
    color: var(--report-text);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .derivation-step__note {
    font-size: 0.78rem;
    line-height: 1.5;
    color: var(--report-text-muted);
  }
  footer.report-footer {
    margin-top: 2rem;
    padding-top: 0.8rem;
    border-top: 1px solid var(--report-border);
    font-size: 0.7rem;
    color: var(--report-text-muted);
    text-align: center;
  }
  @media print {
    @page { margin: 16mm; }
    body { padding: 0; }
  }
  ${rtl ? '.eq-row, .vec-row { direction: ltr; justify-content: flex-end; }' : ''}
</style>
</head>
<body>
  <header class="report-header">
    <p class="report-brand">${escapeHtml(t('reportBrandLine'))}</p>
    <h1 class="report-title">${escapeHtml(title)}</h1>
    <p class="report-meta">${escapeHtml(generatedOn)}</p>
  </header>

  ${
    problem.description
      ? `<section class="report-section">
    <h2 class="report-section__title">${escapeHtml(t('labelProblemDescription'))}</h2>
    <p class="report-description">${escapeHtml(problem.description)}</p>
  </section>`
      : ''
  }

  <section class="report-section">
    <h2 class="report-section__title">${escapeHtml(t('labelMathematicalEquations'))}</h2>
    ${buildEquationsHtml(problem.system, problem.equations)}
  </section>

  <section class="report-section">
    <h2 class="report-section__title">${escapeHtml(t('reportSectionCoordinateSystem'))}</h2>
    <p class="report-description">${escapeHtml(coordSystemLabel(problem.system))} \u2014 ${escapeHtml(category.description)}</p>
  </section>

  <section class="report-section">
    <h2 class="report-section__title">${escapeHtml(t('reportSectionSnapshot', { t: tSnapshot.toFixed(2) }))}</h2>
    <figure class="snapshot-figure">
      <img src="${snapshotDataUrl}" alt="${escapeHtml(title)}" width="${SNAPSHOT_WIDTH}" height="${SNAPSHOT_HEIGHT}" />
      <figcaption>${escapeHtml(t('reportSnapshotCaption', { t: tSnapshot.toFixed(2) }))}</figcaption>
    </figure>
  </section>

  <section class="report-section">
    <h2 class="report-section__title">${escapeHtml(t('reportSectionPositionInfo'))} (t = ${tSnapshot.toFixed(2)})</h2>
    <div class="vector-groups">
      <div class="vector-group">
        <p class="vector-group__heading">${escapeHtml(coordSystemLabel('cartesian'))}</p>
        ${positionRows}
      </div>
      <div class="vector-group">
        <p class="vector-group__heading">${escapeHtml(coordSystemLabel('cylindrical'))}</p>
        ${cylindricalRows}
      </div>
      <div class="vector-group">
        <p class="vector-group__heading">${escapeHtml(coordSystemLabel('spherical'))}</p>
        ${sphericalRows}
      </div>
    </div>
  </section>

  <section class="report-section">
    <h2 class="report-section__title">${escapeHtml(t('sectionVelocity'))} (t = ${tSnapshot.toFixed(2)})</h2>
    <div class="vector-group vector-group--velocity">
      ${velocityRows}
    </div>
  </section>

  <section class="report-section">
    <h2 class="report-section__title">${escapeHtml(t('sectionAcceleration'))} (t = ${tSnapshot.toFixed(2)})</h2>
    <div class="vector-group vector-group--acceleration">
      ${accelerationRows}
    </div>
  </section>

  <section class="report-section">
    <h2 class="report-section__title">${escapeHtml(t('sectionStepByStepDerivation'))}</h2>
    ${derivationHtml}
  </section>

  <footer class="report-footer">${escapeHtml(t('reportBrandLine'))}</footer>
</body>
</html>`;
}

function waitForImagesToLoad(win) {
  const imgs = Array.from(win.document.images || []);
  return Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    })
  );
}

/**
 * Prints `html` via a hidden, off-screen same-page `<iframe>` instead of
 * a new browser window/tab - `window.open()` is what Chrome's pop-up
 * blocker targets (and, since it must follow a *fresh* user gesture,
 * what made this fail the moment the student's own typing into the
 * time prompt used up that gesture). Appending an iframe to the current
 * page is never treated as a pop-up, so this can run any time after the
 * click - no permission prompt, no new window, ever.
 * @param {string} html
 * @returns {Promise<void>}
 */
async function printReportViaHiddenIframe(html) {
  const iframe = document.createElement('iframe');
  // Off-screen (not display:none, which some browsers skip printing/
  // loading images for) rather than zero-sized, so the report's own
  // layout/CSS computes exactly as it did in the previous new-window
  // version - same off-screen-but-rendered trick already used for the
  // 3D snapshot capture above.
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = `${SNAPSHOT_WIDTH}px`;
  iframe.style.height = '1200px';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentElement) iframe.parentElement.removeChild(iframe);
  };

  try {
    const frameWindow = iframe.contentWindow;
    frameWindow.document.open();
    frameWindow.document.write(html);
    frameWindow.document.close();

    await waitForImagesToLoad(frameWindow);

    // `afterprint` fires once the student closes/confirms the browser's
    // print dialog (in whichever browser supports it); a generous
    // fallback timeout removes the iframe regardless, in case it doesn't.
    frameWindow.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 60000);

    frameWindow.focus();
    frameWindow.print();
  } catch (err) {
    cleanup();
    throw err;
  }
}

/**
 * Builds the printable report for `problem`, evaluated at `tSnapshot`,
 * and prints it straight from the current page (see
 * printReportViaHiddenIframe) - choosing "Save as PDF" in that print
 * dialog is what produces the actual PDF file. Never opens a new
 * window/tab, so there's nothing here for a pop-up blocker to catch.
 * @param {{id: string, title: string, description: string}} category
 * @param {object} problem - a saved record from problemStore
 * @param {number} [tSnapshot] - the instant (seconds) the snapshot/
 *   Position/Velocity/Acceleration/derivation are all evaluated at;
 *   must be within [0, MAX_SNAPSHOT_TIME] - see the "Download as PDF"
 *   time prompt in ProblemLibraryModule.js, which is what collects
 *   and validates this before calling here. Defaults to
 *   DEFAULT_SNAPSHOT_TIME so existing callers/behavior are unchanged.
 * @returns {Promise<void>}
 */
export async function downloadProblemReportPdf(category, problem, tSnapshot = DEFAULT_SNAPSHOT_TIME) {
  if (!Number.isFinite(tSnapshot) || tSnapshot < 0 || tSnapshot > MAX_SNAPSHOT_TIME) {
    throw new Error(t('pdfInvalidTimeError', { max: MAX_SNAPSHOT_TIME }));
  }

  const { system, equations } = problem;
  // Re-validates the saved equations before doing any work, same
  // defensive pattern "Show Details" already uses - a corrupted
  // record fails here with a clear message instead of a half-built
  // report.
  const motion = new ParametricMotion(system, equations);

  const position = motion.positionAt(tSnapshot);
  if (!isFiniteVector(position)) {
    throw new Error(t('undefinedValueError', { t: tSnapshot.toFixed(2) }));
  }
  const velocity = motion.velocityAt(tSnapshot);
  const acceleration = motion.accelerationAt(tSnapshot);
  const velocityValid = isFiniteVector(velocity);
  const accelerationValid = isFiniteVector(acceleration);
  const speed = velocityValid ? magnitude(velocity) : null;
  const accelMagnitude = accelerationValid ? magnitude(acceleration) : null;

  const cylindrical = cartesianToCylindrical(position);
  const spherical = cartesianToSpherical(position);

  const snapshotDataUrl = await captureMotionSnapshot(system, motion, tSnapshot);

  const derivationHtml = buildDerivationHtml(system, equations, {
    t: tSnapshot,
    velocity: velocityValid ? velocity : null,
    speed,
    acceleration: accelerationValid ? acceleration : null,
    accelMagnitude,
  });

  const html = buildReportDocument({
    category,
    problem,
    tSnapshot,
    position,
    cylindrical,
    spherical,
    velocity: velocityValid ? velocity : null,
    speed,
    acceleration: accelerationValid ? acceleration : null,
    accelMagnitude,
    snapshotDataUrl,
    derivationHtml,
  });

  await printReportViaHiddenIframe(html);
}

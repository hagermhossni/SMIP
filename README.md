# SMIP — Spatial Mathematics Interactive Platform

**Phase 4: Coordinate Systems in Spatial Dynamics** (current)

An interactive educational platform for visualizing Spatial Dynamics and
Spatial Geometry through real-time 3D simulations, built for university
students.

This phase builds the scaffolding only: project tooling, layout, navigation,
and a reusable 3D scene component. No mathematical or physics features are
implemented yet - those come in the next steps.

## Project structure

```
smip/
├── index.html                        Entry HTML - loads fonts, mounts #app, boots main.js
├── vite.config.js                    Vite dev/build configuration
├── package.json                      Dependencies & npm scripts
│
└── src/
    ├── main.js                       App bootstrap: defines routes, starts Router + AppShell
    ├── style.css                     Design tokens (colors/type) and all layout styling
    │
    ├── core/                         Framework-agnostic 3D building blocks
    │   ├── SceneManager.js           Renderer, camera, OrbitControls, grid, axes, render loop
    │   └── SceneViewport.js          Wraps SceneManager with the shared HUD chrome (corner
    │                                 brackets + camera readout) used in every 3D view
    │
    ├── app/                          App-level shell & navigation (not math-specific)
    │   ├── AppShell.js                Builds header + mounts nav + main outlet
    │   ├── Navigation.js             Renders the section tabs, drives router navigation
    │   └── Router.js                 Minimal hash-based router (#/dynamics, #/geometry, #/problems)
    │
    ├── math/                         Pure computation - no Three.js or DOM dependency
    │   ├── expressionCompiler.js     Safely compiles a typed equation string into a callable f(t)
    │   ├── ParametricMotion.js       Holds x(t)/y(t)/z(t) and evaluates position/velocity/
    │   │                             acceleration (via numerical differentiation) at a given t
    │   ├── vectorMath.js             Tiny {x,y,z} helpers: magnitude(), isFiniteVector()
    │   └── coordinateSystems.js      Cartesian -> cylindrical/spherical conversions, plus the
    │                                 {x,y,z} point-array generators for the coordinate helpers
    │
    ├── modules/                      One folder per top-level section
    │   ├── dynamics/
    │   │   ├── DynamicsModule.js     Spatial Dynamics view - wires motion, particle, trail,
    │   │   │                         velocity/acceleration arrows, coordinate helpers, controls
    │   │   ├── Particle.js           The moving sphere mesh
    │   │   ├── TrajectoryTrail.js    The growing line showing the particle's path
    │   │   ├── VectorArrow.js        An arrow anchored to the particle, used for velocity/acceleration
    │   │   ├── CylindricalHelper.js  Draws the (r, theta, z) decomposition: radius/height lines,
    │   │   │                         a constant-r ring, and a theta sweep arc
    │   │   ├── SphericalHelper.js    Draws the (rho, theta, phi) decomposition: a radius line,
    │   │   │                         equatorial/meridian great circles, and theta/phi sweep arcs
    │   │   └── MotionControls.js     Floating panel: equation inputs, play/pause/reset,
    │   │                             visibility toggles, coordinate-system view selector, and
    │   │                             the Cartesian/cylindrical/spherical/velocity/acceleration readout
    │   ├── geometry/
    │   │   └── GeometryModule.js     Spatial Geometry view (placeholder 3D viewport for now)
    │   └── problems/
    │       └── ProblemLibraryModule.js  Problem Library view (placeholder list panel)
    │
    └── utils/
        └── dom.js                   Small shared DOM helpers (e.g. module title/subtitle overlay)
```

### Why this structure

- **`core/`** holds nothing but generic 3D scene machinery. It has no idea
  what a "vector" or a "plane" is - it just gives any module a working,
  disposable Three.js viewport. This is what keeps Phase 2+ (adding real
  math/physics content) from requiring any rework here.
- **`app/`** is the page frame: header, tabs, routing. It has no 3D or math
  code in it at all.
- **`modules/`** is where topic-specific content lives, one folder per
  section. Every future feature (vectors, trajectories, planes, distance
  calculators, particle physics in v2) gets added *inside* its module's
  folder, so the modules can grow independently without touching `core/`
  or `app/`.
- Every module follows the same `mount(container)` / `unmount()` contract,
  so the Router can swap them in and out uniformly and always clean up
  GPU resources (`SceneManager.dispose()`) when you navigate away.

## Phase 2: what was added

**New files**
- `src/math/expressionCompiler.js` - turns a typed string like `5*cos(t)` into a real JS
  function, safely (see "How equation input is kept safe" below).
- `src/math/ParametricMotion.js` - holds the compiled x(t)/y(t)/z(t) and returns
  `{x, y, z}` for a given `t`.
- `src/modules/dynamics/Particle.js` - the sphere mesh that represents the moving point.
- `src/modules/dynamics/TrajectoryTrail.js` - the line showing where the particle has been.
- `src/modules/dynamics/MotionControls.js` - the floating panel: equation inputs, `t max`/
  `speed` fields, Play/Pause/Reset buttons, error display, and the live t/x/y/z readout.

**Modified files**
- `src/core/SceneManager.js` - added a `THREE.Clock` and replaced the old single
  `onFrame` callback with `addFrameListener()` / `removeFrameListener()`, so more than
  one thing (the camera HUD *and* the particle animation) can hook into the render
  loop at once. This is the only change to `core/`; the render loop, disposal
  behavior, grid/axes, and everything else are untouched.
- `src/core/SceneViewport.js` - updated to use `addFrameListener` instead of setting
  `onFrame` directly (one-line change, same behavior as before).
- `src/modules/dynamics/DynamicsModule.js` - rewritten to create a `ParametricMotion`,
  `Particle`, `TrajectoryTrail`, and `MotionControls`, and to own the playback state
  (current `t`, playing/paused, speed, duration).
- `src/style.css` - added styles for `.motion-panel` and its children (purely additive;
  no existing rules were changed).

The `app/` layer (routing, navigation, shell) and the `modules/geometry` and
`modules/problems` placeholders are completely unchanged.

### How it works

- **Equations**: type any expression of `t` into the x(t)/y(t)/z(t) fields (supports
  `+ - * / ^`, parentheses, and `sin cos tan asin acos atan sqrt abs pow exp log min
  max floor ceil round`, plus the constants `PI` and `E`), then click **Apply
  Equations**. Applying resets the run (t=0, trail cleared).
- **Playback**: `t` runs from `0` to `t max` at the given `speed` (units of t per
  second). **Play** starts/resumes; if the run already finished, Play restarts it from
  `t=0`. **Pause** freezes it in place. **Reset** returns to `t=0` and clears the trail.
- **Live readout**: the panel shows the current `t` and the particle's `x`, `y`, `z`
  every frame while playing (and immediately after Reset/Apply).
- **Invalid equations**: if an equation is malformed (e.g. `cost(t)` - a typo) or later
  produces an undefined value during playback (e.g. `1/t` at `t=0`), a message
  appears in the panel and playback pauses rather than corrupting the trail with
  `NaN` points.

### How equation input is kept safe

Typed equations are never handed directly to JavaScript's `eval`-equivalent without
checking them first. `expressionCompiler.js` runs two whitelist checks before
compiling anything:
1. Every identifier (word) in the expression must be `t`, one of the supported
   function names, or `PI`/`E` - anything else (e.g. `alert`, `window`) is rejected.
2. Everything that isn't an identifier must be a digit or basic math punctuation
   (`+ - * / ^ ( ) , .` and whitespace) - this catches stray/injected characters that
   don't form a whole extra word.

Only expressions that pass both checks are compiled into a function.

## Phase 3: what was added

**New files**
- `src/math/vectorMath.js` - two tiny pure functions used everywhere a vector is
  displayed: `magnitude({x,y,z})` and `isFiniteVector({x,y,z})`.
- `src/modules/dynamics/VectorArrow.js` - wraps a single `THREE.ArrowHelper`,
  anchored at the particle's current position and pointed/scaled along a given
  vector. Used once for velocity and once for acceleration.

**Modified files**
- `src/math/ParametricMotion.js` - added `velocityAt(t)` and `accelerationAt(t)`.
  Both are computed with numerical (central-difference) differentiation of the
  existing `positionAt(t)`, *not* a symbolic derivative - since equations are
  arbitrary user-typed strings (with `abs`, `min`, `max`, etc.), there's no
  general symbolic derivative to fall back on, and this keeps
  `expressionCompiler.js` completely untouched. `positionAt(t)` remains the
  single source of truth for the motion.
- `src/modules/dynamics/TrajectoryTrail.js` - added `setVisible(visible)` (one
  method, sets the existing line mesh's `.visible`) for the new trajectory toggle.
- `src/modules/dynamics/MotionControls.js` - added a "Display" section with three
  checkboxes (Trajectory / Velocity Vector / Acceleration Vector), plus two new
  readout blocks (`updateVelocityReadout`, `updateAccelerationReadout`) alongside
  the existing position readout.
- `src/modules/dynamics/DynamicsModule.js` - creates two `VectorArrow` instances
  (velocity, acceleration) alongside the existing particle/trail; each frame it
  now also computes velocity/acceleration at the current `t`, updates both
  arrows, and refreshes both new readouts; wires the three new checkbox
  callbacks to `trail.setVisible` / `velocityArrow.setVisible` /
  `accelerationArrow.setVisible`.
- `src/style.css` - added styles for `.motion-panel__toggles`/`.motion-panel__toggle`
  and the velocity/acceleration readout color tints (purely additive; no existing
  rules were changed).

The `core/` and `app/` layers, `expressionCompiler.js`, `Particle.js`, and the
`modules/geometry`/`modules/problems` placeholders are completely unchanged.

### How it works

- **Velocity & acceleration**: computed every frame from the same x(t)/y(t)/z(t)
  equations you type in, using central finite differences
  (`v(t) ≈ (p(t+h) − p(t−h)) / 2h`, `a(t) ≈ (p(t+h) − 2p(t) + p(t−h)) / h²`).
  This means they update automatically for *any* valid equation - no extra
  input required.
- **Readout**: the panel shows `vx, vy, vz, |v|` and `ax, ay, az, |a|` below the
  existing `t, x, y, z` readout, refreshed every frame. If a derivative is
  momentarily undefined (e.g. a sharp corner from `abs(t)`), that readout shows
  `—` instead of a number, but - unlike an undefined *position* - playback does
  not pause, since the particle's position is still perfectly valid there.
- **Arrows**: a teal arrow shows velocity and a pink arrow shows acceleration,
  both anchored at the particle and pointing in the vector's direction. Arrow
  *length* is the vector's magnitude times a fixed display scale (not the raw
  magnitude in scene units) so arrows stay readable rather than dwarfing or
  vanishing from the viewport - the exact numeric magnitude is what the
  readout is for.
- **Visibility toggles**: three checkboxes under "Display" show/hide the
  trajectory trail, the velocity arrow, and the acceleration arrow
  independently - all default to visible.

## Phase 4: what was added

**New files**
- `src/math/coordinateSystems.js` - pure conversion functions:
  `cartesianToCylindrical({x,y,z}) -> {r, theta, z}` and
  `cartesianToSpherical({x,y,z}) -> {rho, theta, phi}`, plus the plain
  `{x,y,z}` point-array generators used by the two coordinate helpers
  below (`ringPoints`, `azimuthalArcPoints`, `meridianCirclePoints`,
  `polarArcPoints`). No Three.js dependency - the generated arrays are
  plain objects, which `THREE.BufferGeometry.setFromPoints()` accepts
  just as well as `Vector3` instances.
- `src/modules/dynamics/CylindricalHelper.js` - draws the (r, θ, z)
  decomposition as four lines: a radius line (z-axis → particle), a
  height line (origin → particle's z, along the axis), a ring at radius
  r/height z, and a small arc sweeping 0 → θ.
- `src/modules/dynamics/SphericalHelper.js` - draws the (ρ, θ, φ)
  decomposition as five lines: a radius line (origin → particle), the
  equatorial great circle (radius ρ), the meridian great circle (radius
  ρ, through both poles, at the particle's azimuth), a θ sweep arc
  (equatorial plane), and a φ sweep arc (meridian plane, from the +z
  pole).

**Modified files**
- `src/modules/dynamics/MotionControls.js` - added a "Coordinate System"
  section with three radio buttons (Cartesian/Cylindrical/Spherical,
  Cartesian selected by default), three headed readout blocks
  (Cartesian/Cylindrical/Spherical - all three always visible and
  updating), and `setSelectedCoordinateSystem()` which highlights the
  active one's heading.
- `src/modules/dynamics/DynamicsModule.js` - creates a
  `CylindricalHelper`/`SphericalHelper` alongside the existing
  particle/trail/arrows; each frame it now also converts the current
  position to cylindrical/spherical (via `coordinateSystems.js`),
  updates both helpers, and refreshes both new readouts; added
  `_selectCoordinateSystem()`, wired to the new radio buttons, which
  shows the selected system's helper and hides the other (Cartesian
  shows neither, since the scene's existing axes already represent it).
- `src/style.css` - added radio-button styling (reusing the existing
  `.motion-panel__toggle` row layout from Phase 3's checkboxes) and a
  `.is-selected` highlight for the active coordinate heading; purely
  additive.

The `core/` and `app/` layers, `expressionCompiler.js`, `ParametricMotion.js`,
`Particle.js`, `TrajectoryTrail.js`, `VectorArrow.js`, and the
`modules/geometry`/`modules/problems` placeholders are completely unchanged.

### Coordinate convention (read this if the numbers look "swapped")

Textbooks genuinely disagree on which angle is called θ and which is φ in
spherical coordinates. This project uses the convention common in calculus
textbooks (e.g. Stewart), chosen so cylindrical and spherical **share the
same θ**:

- **Cylindrical** `(r, θ, z)`: `r` = distance from the z-axis, `θ` = angle
  in the xy-plane from the +x axis (same as `atan2(y, x)`), `z` = height
  along the axis.
- **Spherical** `(ρ, θ, φ)`: `ρ` = distance from the origin, `θ` = the
  *same* azimuthal angle as cylindrical, `φ` = polar angle measured from
  the +z axis (0 at the north pole, π/2 at the equator, π at the south
  pole).
- Conversions: `x = ρ sin(φ) cos(θ)`, `y = ρ sin(φ) sin(θ)`, `z = ρ cos(φ)`,
  and `r = ρ sin(φ)`.

This is the mirror image of the ISO/physics naming (which swaps θ and φ) -
only the labels differ, not the geometry. It's documented at the top of
`coordinateSystems.js` too.

### How it works

- **Conversion**: every frame, the particle's Cartesian position is run
  through `cartesianToCylindrical`/`cartesianToSpherical` - pure
  trigonometry, no state, so it's always exactly in sync with the
  particle (Section 8 - "update in real time").
- **All three displayed at once**: the panel shows Cartesian, Cylindrical,
  and Spherical readouts stacked together, all always live - so you can
  compare, say, `z = 4.00` against `ρ = 6.40, φ = 0.90 rad` for the same
  instant (Section 3).
- **Selecting a view**: the three radio buttons under "Coordinate System"
  pick which system's *helper visualization* renders in the 3D scene, and
  bold-highlight that system's readout heading - Cartesian's "helper" is
  simply nothing extra (the scene's existing axes already show it).
  Switching is instant since both helpers are cheap line geometry that's
  kept updated in the background even while hidden.
- **Angle arcs use a fixed reference radius, not r/ρ**: the θ and φ arcs
  are drawn at a small constant radius (1.4 units) regardless of the
  particle's actual r or ρ, for the same reason `VectorArrow` scales
  vector length rather than using it raw - an angle-indicator arc drawn
  at the *true* radius would be unreadably huge for a far-out particle
  and invisible for one near the axis. The rings/great-circles (showing
  r and ρ themselves) *do* use the true radius, since those exist
  specifically to convey that distance.

### Testing Phase 4 on Windows

(Assumes Phase 1–3 setup already ran `npm install`.)

1. `npm run dev`, open **Spatial Dynamics**, click **Play** on the default
   helix.
2. Under "Coordinate System", the panel should already show Cartesian
   selected, with three readout blocks (Cartesian / Cylindrical /
   Spherical) all updating live as the particle moves - only the
   Cartesian heading highlighted, and no extra helper lines in the scene
   (just the particle/trail/arrows from Phase 2/3).
3. Click **Cylindrical**. A muted-gold radius line, height line, ring,
   and small angle arc should appear, all riding along with the particle;
   its heading in the panel highlights. All three readout blocks keep
   updating regardless.
4. Click **Spherical**. The cylindrical helper disappears and a violet
   radius line + two great circles + two angle arcs appear instead,
   centered on the origin. Its heading highlights.
5. Click back to **Cartesian** - both helpers disappear, leaving only the
   Phase 2/3 visuals, confirming Cartesian truly adds nothing extra.
6. Try the flat circular orbit (`x=8*cos(t)`, `y=8*sin(t)`, `z=0`) - in
   Spherical view, φ should stay pinned near π/2 rad (the particle never
   leaves the equatorial plane) while θ sweeps through a full 0→2π cycle -
   a good sanity check that the conversions are wired correctly.
7. Confirm Reset/Apply Equations/toggling Trajectory-Velocity-Acceleration/
   navigation-away-and-back all still work exactly as in Phase 3 - the
   coordinate helpers reset and clean up (`dispose()`) along with
   everything else.

### Testing Phase 3 on Windows

(Assumes Phase 1/2 setup already ran `npm install`.)

1. `npm run dev`, open **Spatial Dynamics**.
2. Click **Play** on the default helix. You should see, in addition to the
   Phase 2 particle/trail: a teal arrow (velocity) and a pink arrow
   (acceleration), both riding along with the particle, plus `vx/vy/vz/|v|`
   and `ax/ay/az/|a|` updating live in the panel below the position readout.
3. Uncheck **Trajectory** - the blue trail disappears; the particle and both
   arrows keep moving normally. Re-check it - the trail resumes appending from
   the current point (points before you unchecked it are not lost, just
   hidden).
4. Uncheck **Velocity Vector** / **Acceleration Vector** individually - each
   arrow disappears independently without affecting the other or the readout
   numbers.
5. Try the flat circular orbit from the Phase 2 walkthrough
   (`x=8*cos(t)`, `y=0`, `z=8*sin(t)`) - the acceleration arrow should visibly
   point back toward the origin (centripetal acceleration), a nice sanity
   check that the numerical derivatives are behaving.
6. Confirm Reset/Apply Equations/navigation-away-and-back still all work as in
   Phase 2 - the new arrows reset and clean up (`dispose()`) along with
   everything else.

### Testing Phase 2 on Windows

(Assumes you already ran `npm install` in Phase 1. If this is a fresh copy of the
project, follow the Phase 1 setup steps below first.)

1. `npm run dev` and open the printed `http://localhost:5173/` URL.
2. Go to the **Spatial Dynamics** tab.
3. You should see: a grid/axes viewport, an orange sphere sitting on the default
   helix path, and a panel in the top-right with the default equations
   `x(t)=5*cos(t)`, `y(t)=0.6*t`, `z(t)=5*sin(t)`, plus `t max`/`speed` fields, Play/
   Pause/Reset buttons, and a readout showing `t = 0.00`.
4. Click **Play** - the sphere should move along a rising helix, leaving a blue trail
   behind it, while the readout updates in real time. It should auto-pause once `t`
   reaches `t max` (20 by default).
5. Click **Reset** - the sphere returns to its starting position and the trail clears.
6. Try editing the equations, e.g. set `y(t)` to `0` and `x(t)`/`z(t)` to
   `8*cos(t)`/`8*sin(t)`, then click **Apply Equations** - you should get a flat
   circular orbit instead of a helix.
7. Try an intentionally broken equation, e.g. `cost(t)` - clicking **Apply Equations**
   should show an error message and leave the previous (working) equations in place.
8. Try `1/t` for `x(t)` and press Play from `t=0` - it should immediately pause with
   an "undefined value" message instead of drawing a broken trail.
9. Confirm the existing navigation still works: switching to **Spatial Geometry**
   and **Problem Library** and back to **Spatial Dynamics** should give a fresh,
   reset motion each time (module `unmount()`/`mount()` still cleans up correctly).

## Setup & running on Windows

**Prerequisites:** [Node.js](https://nodejs.org/) 18 or newer (includes npm).
To check what you have, open **Command Prompt** or **PowerShell** and run:

```
node -v
npm -v
```

### Steps

1. **Unzip/copy the `smip` folder** somewhere convenient, e.g. `C:\Projects\smip`.

2. **Open a terminal in that folder.**
   In File Explorer, open the `smip` folder, then either:
   - Shift + Right-click inside the folder → "Open PowerShell window here", or
   - Type `cmd` into the File Explorer address bar and press Enter.

3. **Install dependencies:**
   ```
   npm install
   ```
   This downloads Vite and Three.js into a local `node_modules` folder
   (only needs to be run once, or again if `package.json` changes).

4. **Start the dev server:**
   ```
   npm run dev
   ```
   Vite will print a local URL, typically:
   ```
   Local:   http://localhost:5173/
   ```
   and should open it in your default browser automatically. If not,
   Ctrl+Click the link in the terminal, or paste it into your browser.

5. **What you should see:**
   - A dark header reading "SMIP — Spatial Mathematics Interactive Platform"
   - Three navigation tabs: *Spatial Dynamics*, *Spatial Geometry*, *Problem Library*
   - Clicking **Spatial Dynamics** or **Spatial Geometry** shows a live 3D
     viewport with a grid, colored X/Y/Z axes, and a camera-position
     readout in the corner. Drag to orbit, scroll to zoom (via OrbitControls).
   - Clicking **Problem Library** shows a placeholder panel (no 3D scene,
     as intended for this phase).

6. **Stopping the server:** click the terminal window and press `Ctrl + C`.

### Troubleshooting

- **Port already in use:** stop whatever else is running on port 5173, or
  change the `port` value in `vite.config.js`.
- **Blank page / console errors about `three`:** make sure step 3
  (`npm install`) completed without errors - delete the `node_modules`
  folder and run `npm install` again if needed.
- **PowerShell blocks npm scripts:** if you see an "execution policy"
  error, run PowerShell as Administrator and execute:
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then retry.

## Status

- [x] Vite + Three.js project scaffolding
- [x] Clean, scalable folder structure
- [x] App shell with header + navigation
- [x] Hash-based routing between 3 sections
- [x] Reusable 3D scene component (grid, axes, OrbitControls, resize, disposal)
- [x] Particle + trajectory trail in Spatial Dynamics
- [x] User-defined parametric equations x(t)/y(t)/z(t)
- [x] Play / pause / reset controls with live position readout
- [x] Velocity/acceleration vector display (components, magnitudes, arrows, toggles)
- [x] Coordinate system switch (Cartesian/cylindrical/spherical) with real-time conversion, helpers, and view selector
- [ ] Spatial Geometry math features
- [ ] Problem Library data + UI

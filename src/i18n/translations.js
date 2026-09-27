export const TRANSLATIONS = {
  en: {
    // ---------------- App shell / navigation ----------------
    appTagline: 'Spatial Mathematics Interactive Platform',
    tourButton: 'Guided Tour',
    themeSwitchToLight: '\u2600\uFE0F Light Mode',
    themeSwitchToDark: '\uD83C\uDF19 Dark Mode',
    languageButton: '\uD83C\uDF10 Language',
    langEnglish: 'English',
    langArabic: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',
    navDynamics: 'Spatial Dynamics',
    navGeometry: 'Spatial Geometry',
    navProblems: 'Problem Library',

    // ---------------- Coordinate systems (shared) ----------------
    coordSystemCartesian: 'Cartesian',
    coordSystemCylindrical: 'Cylindrical',
    coordSystemSpherical: 'Spherical',

    // ---------------- Spatial Dynamics ----------------
    dynamicsSubtitle: "Define a parametric path and play back the particle's motion through space.",
    undefinedValueError: 'Undefined value at t = {t} (check your equations).',

    meaningRadialDistance: 'radial distance',
    meaningAzimuthAngle: 'azimuth angle',
    meaningHeight: 'height',
    meaningPolarAngle: 'polar angle',

    sectionCoordinateSystemSelection: 'Coordinate System Selection',
    sectionEquationInput: 'Equation Input',
    sectionSimulationSettings: 'Simulation Settings',
    sectionDisplayPosition: 'Display Position',
    sectionDisplayTrajectory: 'Display Trajectory',
    sectionPosition: 'Position',
    sectionVelocity: 'Velocity',
    sectionAcceleration: 'Acceleration',
    sectionTrajectoryInformation: 'Trajectory Information',
    sectionCoordinateInformation: 'Coordinate Information',
    sectionCamera: 'Camera',
    sectionDisplayOptions: 'Display Options',
    sectionStepByStepDerivation: 'Step-by-Step Derivation',

    labelAnimationSpeed: 'Animation Speed',
    labelMaximumTime: 'Maximum Time',
    headingCurrentCoordinates: 'Current Coordinates',
    headingPathInformation: 'Path Information',
    pathInfoText: 'system: {system}\nt range: 0 to {tMax}',
    headingOverlays: 'Overlays',
    headingCoordinateHelpers: 'Coordinate Helpers',
    headingAxes: 'Axes',

    btnApplyEquations: 'Apply Equations',
    btnStart: 'Start',
    btnPause: 'Pause',
    btnReset: 'Reset',

    checkShowPositionVector: 'Show Position Vector',
    checkShowTrajectory: 'Show Trajectory',
    checkVelocityVector: 'Velocity Vector',
    checkAccelerationVector: 'Acceleration Vector',
    checkCylindricalHelpers: 'Cylindrical Helpers',
    checkSphericalHelpers: 'Spherical Helpers',
    checkAxisLabels: 'Axis Labels (X, Y, Z, O)',
    checkAxisTicks: 'Axis Ticks',

    axisLegendX: 'X (horizontal)',
    axisLegendY: 'Y (horizontal)',
    axisLegendZ: 'Z (vertical)',

    sidebarControlsTitle: 'Controls',
    sidebarDataPanelTitle: 'Data Panel',
    ariaResizeSidebar: 'Resize sidebar',
    ariaCollapseSidebar: 'Collapse sidebar',
    ariaExpandSidebar: 'Expand sidebar',

    derivGivenEquations: 'Given Equations',
    derivStep1: 'Step 1 \u2014 First Derivative (differentiate each function w.r.t. t)',
    derivStep2: 'Step 2 \u2014 Second Derivative (differentiate again)',
    derivStep3: 'Step 3 \u2014 Velocity & Acceleration Law ({system})',
    derivNoClosedForm:
      'A closed-form derivative could not be found for one of these equations, so the substitution and final result below use the exact numeric values already computed for Velocity/Acceleration.',
    derivResultAt: 'Result at t = {t} (exact values from the Velocity/Acceleration computation above)',
    derivStep4: 'Step 4 \u2014 Substitute at t = {t}',
    derivStep5: 'Step 5 \u2014 Final Result (matches Velocity / Acceleration above)',

    // ---------------- Spatial Geometry ----------------
    geometrySubtitle: 'Points, lines, planes, distances, and angles - coming in a later build step.',

    // ---------------- Problem Library ----------------
    problemsSubtitle: 'Instructor-created problems, organized by coordinate system.',
    introProblemLibrary:
      "The Problem Library collects practice problems by the coordinate system they're posed in. Choose a coordinate system to see its saved problems.",

    categoryCartesianTitle: 'Cartesian Coordinates',
    categoryCartesianDesc: 'Problems described directly in x, y, z.',
    categoryCylindricalTitle: 'Cylindrical Coordinates',
    categoryCylindricalDesc: 'Problems described in \u03C1 (rho), \u03C6 (phi), z.',
    categorySphericalTitle: 'Spherical Coordinates',
    categorySphericalDesc: 'Problems described in r, \u03B8 (theta), \u03C6 (phi).',

    addProblemAriaLabel: 'Add a new {category} problem',
    ariaOpenCategoryProblems: 'Open {category} problems',
    ariaOpenThisProblem: 'Open this problem',
    backToProblemLibrary: '\u2190 Back to Problem Library',
    backToCategory: '\u2190 Back to {category}',
    emptyCategory: 'No problems yet in this category.',
    untitledProblem: 'Untitled problem',
    btnOpen: 'Open',
    ariaOpenProblem: 'Open "{title}"',
    btnEdit: '\u270E Edit',
    ariaEditProblem: 'Edit "{title}"',
    btnDelete: '\uD83D\uDDD1 Delete',
    ariaDeleteProblem: 'Delete "{title}"',

    labelMathematicalEquations: 'Mathematical Equations',
    btnShowDetails: 'Show Details',

    newProblemTitle: 'New {category} Problem',
    editProblemTitle: 'Edit {category} Problem',
    newProblemSubtitle: 'This problem will be added to the {category} category.',
    editProblemSubtitle: 'Editing a problem in the {category} category.',

    labelProblemTitle: 'Problem Title',
    placeholderProblemTitle: 'e.g. Helical motion around the z-axis',
    labelProblemDescription: 'Problem Description',
    placeholderProblemDescription:
      'Describe the problem, what the student should find, and any relevant context.',

    label3DVisualization: '3D Visualization',
    btnSaveQuestion: 'Save Question',
    statusEnterTitleBeforeSaving: 'Enter a problem title before saving.',

    // ------------- Problem Library: Download as PDF -------------
    btnDownloadPdf: '\u2B07 PDF',
    ariaDownloadPdfProblem: 'Download "{title}" as PDF',
    pdfGeneratingStatus: 'Preparing PDF report\u2026',
    pdfGenerationError: 'Could not generate the PDF report for this problem.',
    reportBrandLine: 'Spatial Mathematics Interactive Platform (SMIP)',
    reportGeneratedOn: 'Generated on {date}',
    reportSectionCoordinateSystem: 'Coordinate System Used',
    reportSectionSnapshot: '3D Visualization at t = {t} s',
    reportSnapshotCaption: 'Trajectory, particle position, and velocity/acceleration vectors at t = {t} s.',
    reportSectionPositionInfo: 'Position Information',
    promptSelectSnapshotTime: 'Select time for visualization (seconds, 0\u2013{max}):',
    pdfInvalidTimeError: 'Please enter a time between 0 and {max} seconds.',

    // ---------------- Guided Tour ----------------
    tourWelcomeTitle: 'Welcome to SMIP \uD83D\uDC4B',
    tourWelcomeText: "Let's take a quick tour of the platform.",
    tourStartBtn: 'Start Tour',
    tourSkipBtn: 'Skip',
    tourBackBtn: 'Back',
    tourNextBtn: 'Next',
    tourSkipTourBtn: 'Skip Tour',
    tourFinalTitle: "You're ready to explore SMIP! \uD83D\uDE80",
    tourDontShowAgain: "Don't show this again",
    tourStartExploringBtn: 'Start Exploring',
    tourCloseAria: 'Close tour',
    tourStepCounter: 'Step {n} of {total}',

    tourStepCoordinateSystem: 'Here you choose the coordinate system you want to use.',
    tourStepEquationInput:
      'Here you enter the position equations as functions of time, then click Apply Equations to apply the equations.',
    tourStepSimulationSettings:
      'Here you set the maximum simulation time. You can control the simulation using Start, Stop, and Reset.',
    tourStep3DVisualization:
      "Here you can see the particle's motion in 3D space and rotate the scene to explore the motion from different angles.",
    tourStepPVA:
      'Here you can monitor the instantaneous values of position, velocity, and acceleration at any moment of time.',
    tourStepCoordinateInfo:
      'Here you can find the definitions and information about the symbols used in the selected coordinate system.',
    tourStepDerivation:
      'Here you can see the step-by-step derivation of velocity and acceleration from the position equations.',

    tourGeometryIntro: 'This section is dedicated to exploring spatial geometry. More features will be available soon.',

    tourProblemLibraryIntro: 'Here you can create and store questions according to the appropriate coordinate system.',
    tourStepChooseCategory: 'Choose the appropriate coordinate-system section for your question.',
    tourStepClickAdd: 'Click Add to create a new question in this category.',
    tourStepEnterTitle: 'Enter the question title.',
    tourStepEnterDescription: 'Enter an explanatory paragraph about the question.',
    tourStepEquationsApplySave:
      'Enter the equations, then click Apply Equations and inspect the 3D visualization. Once applied, click Save Question to save the question.',
    tourStepStoredEditDelete:
      'The question is now stored in your personal library. You can open it at any time and select Show Details to view and apply all the details of your question. Saved questions can also be Edited or Deleted.',
  },

  ar: {
    // ---------------- App shell / navigation ----------------
    appTagline: '\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A \u0627\u0644\u0641\u0636\u0627\u0626\u064A\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629',
    tourButton: '\u062C\u0648\u0644\u0629 \u0625\u0631\u0634\u0627\u062F\u064A\u0629',
    themeSwitchToLight: '\u2600\uFE0F \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0641\u0627\u062A\u062D',
    themeSwitchToDark: '\uD83C\uDF19 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u062F\u0627\u0643\u0646',
    languageButton: '\uD83C\uDF10 \u0627\u0644\u0644\u063A\u0629',
    langEnglish: 'English',
    langArabic: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',
    navDynamics: '\u0627\u0644\u062F\u064A\u0646\u0627\u0645\u064A\u0643\u0627 \u0627\u0644\u0641\u0636\u0627\u0626\u064A\u0629',
    navGeometry: '\u0627\u0644\u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0641\u0636\u0627\u0626\u064A\u0629',
    navProblems: '\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0645\u0633\u0627\u0626\u0644',

    // ---------------- Coordinate systems (shared) ----------------
    coordSystemCartesian: '\u062F\u064A\u0643\u0627\u0631\u062A\u064A',
    coordSystemCylindrical: '\u0623\u0633\u0637\u0648\u0627\u0646\u064A',
    coordSystemSpherical: '\u0643\u0631\u0648\u064A',

    // ---------------- Spatial Dynamics ----------------
    dynamicsSubtitle:
      '\u062D\u062F\u062F \u0645\u0633\u0627\u0631\u064B\u0627 \u0648\u0633\u064A\u0637\u064B\u0627 \u0648\u0634\u0627\u0647\u062F \u062D\u0631\u0643\u0629 \u0627\u0644\u062C\u0633\u064A\u0645 \u0641\u064A \u0627\u0644\u0641\u0636\u0627\u0621.',
    undefinedValueError:
      '\u0642\u064A\u0645\u0629 \u063A\u064A\u0631 \u0645\u0639\u0631\u0651\u0641\u0629 \u0639\u0646\u062F t = {t} (\u062A\u062D\u0642\u0651\u0642 \u0645\u0646 \u0627\u0644\u0645\u0639\u0627\u062F\u0644\u0627\u062A).',

    meaningRadialDistance: '\u0627\u0644\u0645\u0633\u0627\u0641\u0629 \u0627\u0644\u0634\u0639\u0627\u0639\u064A\u0629',
    meaningAzimuthAngle: '\u0627\u0644\u0632\u0627\u0648\u064A\u0629 \u0627\u0644\u0633\u0645\u062A\u064A\u0629',
    meaningHeight: '\u0627\u0644\u0627\u0631\u062A\u0641\u0627\u0639',
    meaningPolarAngle: '\u0627\u0644\u0632\u0627\u0648\u064A\u0629 \u0627\u0644\u0642\u0637\u0628\u064A\u0629',

    sectionCoordinateSystemSelection: '\u0627\u062E\u062A\u064A\u0627\u0631 \u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A',
    sectionEquationInput: '\u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0645\u0639\u0627\u062F\u0644\u0627\u062A',
    sectionSimulationSettings: '\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629',
    sectionDisplayPosition: '\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0645\u0648\u0642\u0639',
    sectionDisplayTrajectory: '\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0645\u0633\u0627\u0631',
    sectionPosition: '\u0627\u0644\u0645\u0648\u0642\u0639',
    sectionVelocity: '\u0627\u0644\u0633\u0631\u0639\u0629',
    sectionAcceleration: '\u0627\u0644\u062A\u0633\u0627\u0631\u0639',
    sectionTrajectoryInformation: '\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u0633\u0627\u0631',
    sectionCoordinateInformation: '\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A',
    sectionCamera: '\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627',
    sectionDisplayOptions: '\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0636',
    sectionStepByStepDerivation: '\u0627\u0644\u0627\u0634\u062A\u0642\u0627\u0642 \u062E\u0637\u0648\u0629 \u0628\u062E\u0637\u0648\u0629',

    labelAnimationSpeed: '\u0633\u0631\u0639\u0629 \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629',
    labelMaximumTime: '\u0627\u0644\u0632\u0645\u0646 \u0627\u0644\u0623\u0642\u0635\u0649',
    headingCurrentCoordinates: '\u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629',
    headingPathInformation: '\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u0633\u0627\u0631',
    pathInfoText: '\u0627\u0644\u0646\u0638\u0627\u0645: {system}\n\u0646\u0637\u0627\u0642 t: \u0645\u0646 0 \u0625\u0644\u0649 {tMax}',
    headingOverlays: '\u0627\u0644\u0637\u0628\u0642\u0627\u062A \u0627\u0644\u0645\u0631\u0626\u064A\u0629',
    headingCoordinateHelpers: '\u0645\u0633\u0627\u0639\u062F\u0627\u062A \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A',
    headingAxes: '\u0627\u0644\u0645\u062D\u0627\u0648\u0631',

    btnApplyEquations: '\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0639\u0627\u062F\u0644\u0627\u062A',
    btnStart: '\u0628\u062F\u0621',
    btnPause: '\u0625\u064A\u0642\u0627\u0641',
    btnReset: '\u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637',

    checkShowPositionVector: '\u0625\u0638\u0647\u0627\u0631 \u0645\u062A\u062C\u0647 \u0627\u0644\u0645\u0648\u0642\u0639',
    checkShowTrajectory: '\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0645\u0633\u0627\u0631',
    checkVelocityVector: '\u0645\u062A\u062C\u0647 \u0627\u0644\u0633\u0631\u0639\u0629',
    checkAccelerationVector: '\u0645\u062A\u062C\u0647 \u0627\u0644\u062A\u0633\u0627\u0631\u0639',
    checkCylindricalHelpers: '\u0645\u0633\u0627\u0639\u062F\u0627\u062A \u0623\u0633\u0637\u0648\u0627\u0646\u064A\u0629',
    checkSphericalHelpers: '\u0645\u0633\u0627\u0639\u062F\u0627\u062A \u0643\u0631\u0648\u064A\u0629',
    checkAxisLabels: '\u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0645\u062D\u0627\u0648\u0631 (X, Y, Z, O)',
    checkAxisTicks: '\u062A\u062F\u0631\u064A\u062C\u0627\u062A \u0627\u0644\u0645\u062D\u0627\u0648\u0631',

    axisLegendX: 'X (\u0623\u0641\u0642\u064A)',
    axisLegendY: 'Y (\u0623\u0641\u0642\u064A)',
    axisLegendZ: 'Z (\u0631\u0623\u0633\u064A)',

    sidebarControlsTitle: '\u0627\u0644\u062A\u062D\u0643\u0645',
    sidebarDataPanelTitle: '\u0644\u0648\u062D\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A',
    ariaResizeSidebar: '\u062A\u063A\u064A\u064A\u0631 \u062D\u062C\u0645 \u0627\u0644\u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0627\u0646\u0628\u064A',
    ariaCollapseSidebar: '\u0637\u064A \u0627\u0644\u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0627\u0646\u0628\u064A',
    ariaExpandSidebar: '\u0641\u062A\u062D \u0627\u0644\u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0627\u0646\u0628\u064A',

    derivGivenEquations: '\u0627\u0644\u0645\u0639\u0627\u062F\u0644\u0627\u062A \u0627\u0644\u0645\u0639\u0637\u0627\u0629',
    derivStep1: '\u0627\u0644\u062E\u0637\u0648\u0629 1 \u2014 \u0627\u0644\u0645\u0634\u062A\u0642\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 (\u0627\u0634\u062A\u0642\u0627\u0642 \u0643\u0644 \u062F\u0627\u0644\u0629 \u0628\u0627\u0644\u0646\u0633\u0628\u0629 \u0625\u0644\u0649 t)',
    derivStep2: '\u0627\u0644\u062E\u0637\u0648\u0629 2 \u2014 \u0627\u0644\u0645\u0634\u062A\u0642\u0629 \u0627\u0644\u062B\u0627\u0646\u064A\u0629 (\u0627\u0634\u062A\u0642\u0627\u0642 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649)',
    derivStep3: '\u0627\u0644\u062E\u0637\u0648\u0629 3 \u2014 \u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0633\u0631\u0639\u0629 \u0648\u0627\u0644\u062A\u0633\u0627\u0631\u0639 ({system})',
    derivNoClosedForm:
      '\u062A\u0639\u0630\u0651\u0631 \u0625\u064A\u062C\u0627\u062F \u0645\u0634\u062A\u0642\u0629 \u0628\u0635\u064A\u063A\u0629 \u0645\u063A\u0644\u0642\u0629 \u0644\u0625\u062D\u062F\u0649 \u0647\u0630\u0647 \u0627\u0644\u0645\u0639\u0627\u062F\u0644\u0627\u062A\u060C \u0644\u0630\u0644\u0643 \u064A\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u062A\u0639\u0648\u064A\u0636 \u0648\u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629 \u0623\u062F\u0646\u0627\u0647 \u0627\u0644\u0642\u064A\u0645 \u0627\u0644\u0639\u062F\u062F\u064A\u0629 \u0627\u0644\u0641\u0639\u0644\u064A\u0629 \u0627\u0644\u0645\u062D\u0633\u0648\u0628\u0629 \u0628\u0627\u0644\u0641\u0639\u0644 \u0644\u0644\u0633\u0631\u0639\u0629/\u0627\u0644\u062A\u0633\u0627\u0631\u0639.',
    derivResultAt: '\u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0639\u0646\u062F t = {t} (\u0642\u064A\u0645 \u062F\u0642\u064A\u0642\u0629 \u0645\u0646 \u062D\u0633\u0627\u0628 \u0627\u0644\u0633\u0631\u0639\u0629/\u0627\u0644\u062A\u0633\u0627\u0631\u0639 \u0623\u0639\u0644\u0627\u0647)',
    derivStep4: '\u0627\u0644\u062E\u0637\u0648\u0629 4 \u2014 \u0627\u0644\u062A\u0639\u0648\u064A\u0636 \u0639\u0646\u062F t = {t}',
    derivStep5: '\u0627\u0644\u062E\u0637\u0648\u0629 5 \u2014 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629 (\u062A\u0637\u0627\u0628\u0642 \u0627\u0644\u0633\u0631\u0639\u0629 / \u0627\u0644\u062A\u0633\u0627\u0631\u0639 \u0623\u0639\u0644\u0627\u0647)',

    // ---------------- Spatial Geometry ----------------
    geometrySubtitle:
      '\u0627\u0644\u0646\u0642\u0627\u0637 \u0648\u0627\u0644\u062E\u0637\u0648\u0637 \u0648\u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u0627\u0641\u0627\u062A \u0648\u0627\u0644\u0632\u0648\u0627\u064A\u0627 - \u0642\u0631\u064A\u0628\u064B\u0627 \u0641\u064A \u0645\u0631\u062D\u0644\u0629 \u0644\u0627\u062D\u0642\u0629.',

    // ---------------- Problem Library ----------------
    problemsSubtitle: '\u0645\u0633\u0627\u0626\u0644 \u0623\u0639\u062F\u0651\u0647\u0627 \u0627\u0644\u0645\u062F\u0631\u0651\u0633\u060C \u0645\u0646\u0638\u0651\u0645\u0629 \u062D\u0633\u0628 \u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A.',
    introProblemLibrary:
      '\u062A\u062C\u0645\u0639 \u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0645\u0633\u0627\u0626\u0644 \u062A\u0645\u0627\u0631\u064A\u0646 \u062A\u0637\u0628\u064A\u0642\u064A\u0629 \u062D\u0633\u0628 \u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u0645\u0637\u0631\u0648\u062D\u0629 \u0641\u064A\u0647\u0627. \u0627\u062E\u062A\u0631 \u0646\u0638\u0627\u0645 \u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0633\u0627\u0626\u0644 \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629 \u0641\u064A\u0647.',

    categoryCartesianTitle: '\u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u062F\u064A\u0643\u0627\u0631\u062A\u064A\u0629',
    categoryCartesianDesc: '\u0645\u0633\u0627\u0626\u0644 \u0645\u0648\u0635\u0648\u0641\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0628\u0640 x, y, z.',
    categoryCylindricalTitle: '\u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u0623\u0633\u0637\u0648\u0627\u0646\u064A\u0629',
    categoryCylindricalDesc: '\u0645\u0633\u0627\u0626\u0644 \u0645\u0648\u0635\u0648\u0641\u0629 \u0628\u0640 \u03C1 (\u0631\u0648)\u060C \u03C6 (\u0641\u0627\u064A)\u060C z.',
    categorySphericalTitle: '\u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u0643\u0631\u0648\u064A\u0629',
    categorySphericalDesc: '\u0645\u0633\u0627\u0626\u0644 \u0645\u0648\u0635\u0648\u0641\u0629 \u0628\u0640 r, \u03B8 (\u062B\u064A\u062A\u0627)\u060C \u03C6 (\u0641\u0627\u064A).',

    addProblemAriaLabel: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u0623\u0644\u0629 \u062C\u062F\u064A\u062F\u0629 \u0625\u0644\u0649 {category}',
    ariaOpenCategoryProblems: '\u0641\u062A\u062D \u0645\u0633\u0627\u0626\u0644 {category}',
    ariaOpenThisProblem: '\u0641\u062A\u062D \u0647\u0630\u0647 \u0627\u0644\u0645\u0633\u0623\u0644\u0629',
    backToProblemLibrary: '\u2192 \u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0645\u0633\u0627\u0626\u0644',
    backToCategory: '\u2192 \u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 {category}',
    emptyCategory: '\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0633\u0627\u0626\u0644 \u0628\u0639\u062F \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645.',
    untitledProblem: '\u0645\u0633\u0623\u0644\u0629 \u0628\u062F\u0648\u0646 \u0639\u0646\u0648\u0627\u0646',
    btnOpen: '\u0641\u062A\u062D',
    ariaOpenProblem: '\u0641\u062A\u062D "{title}"',
    btnEdit: '\u270E \u062A\u0639\u062F\u064A\u0644',
    ariaEditProblem: '\u062A\u0639\u062F\u064A\u0644 "{title}"',
    btnDelete: '\uD83D\uDDD1 \u062D\u0630\u0641',
    ariaDeleteProblem: '\u062D\u0630\u0641 "{title}"',

    labelMathematicalEquations: '\u0627\u0644\u0645\u0639\u0627\u062F\u0644\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629',
    btnShowDetails: '\u0639\u0631\u0636 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644',

    newProblemTitle: '\u0645\u0633\u0623\u0644\u0629 \u062C\u062F\u064A\u062F\u0629 \u2013 {category}',
    editProblemTitle: '\u062A\u0639\u062F\u064A\u0644 \u0645\u0633\u0623\u0644\u0629 \u2013 {category}',
    newProblemSubtitle: '\u0633\u062A\u064F\u0636\u0627\u0641 \u0647\u0630\u0647 \u0627\u0644\u0645\u0633\u0623\u0644\u0629 \u0625\u0644\u0649 \u0642\u0633\u0645 {category}.',
    editProblemSubtitle: '\u062A\u0639\u062F\u064A\u0644 \u0645\u0633\u0623\u0644\u0629 \u0636\u0645\u0646 \u0642\u0633\u0645 {category}.',

    labelProblemTitle: '\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0633\u0623\u0644\u0629',
    placeholderProblemTitle: '\u0645\u062B\u0627\u0644: \u062D\u0631\u0643\u0629 \u062D\u0644\u0632\u0648\u0646\u064A\u0629 \u062D\u0648\u0644 \u0627\u0644\u0645\u062D\u0648\u0631 z',
    labelProblemDescription: '\u0648\u0635\u0641 \u0627\u0644\u0645\u0633\u0623\u0644\u0629',
    placeholderProblemDescription:
      '\u0635\u0641 \u0627\u0644\u0645\u0633\u0623\u0644\u0629\u060C \u0648\u0645\u0627 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0645\u0646 \u0627\u0644\u0637\u0627\u0644\u0628 \u0625\u064A\u062C\u0627\u062F\u0647\u060C \u0648\u0623\u064A \u0633\u064A\u0627\u0642 \u0630\u064A \u0635\u0644\u0629.',

    label3DVisualization: '\u0627\u0644\u062A\u0635\u0648\u0631 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F',
    btnSaveQuestion: '\u062D\u0641\u0638 \u0627\u0644\u0633\u0624\u0627\u0644',
    statusEnterTitleBeforeSaving: '\u0623\u062F\u062E\u0644 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0633\u0623\u0644\u0629 \u0642\u0628\u0644 \u0627\u0644\u062D\u0641\u0638.',

    // ------------- Problem Library: Download as PDF -------------
    btnDownloadPdf: '\u2B07 \u062A\u0646\u0632\u064A\u0644 PDF',
    ariaDownloadPdfProblem: '\u062A\u0646\u0632\u064A\u0644 "{title}" \u0643\u0645\u0644\u0641 PDF',
    pdfGeneratingStatus: '\u062C\u0627\u0631\u064D \u0625\u0639\u062F\u0627\u062F \u062A\u0642\u0631\u064A\u0631 PDF\u2026',
    pdfGenerationError: '\u062A\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u062A\u0642\u0631\u064A\u0631 PDF \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u0633\u0623\u0644\u0629.',
    reportBrandLine: '\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A \u0627\u0644\u0645\u0643\u0627\u0646\u064A\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 (SMIP)',
    reportGeneratedOn: '\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0646\u0634\u0627\u0621: {date}',
    reportSectionCoordinateSystem: '\u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645',
    reportSectionSnapshot: '\u0627\u0644\u062A\u0635\u0648\u0631 \u0627\u0644\u062B\u0644\u0627\u062B\u064A \u0639\u0646\u062F t = {t} \u062B\u0627\u0646\u064A\u0629',
    reportSnapshotCaption:
      '\u0627\u0644\u0645\u0633\u0627\u0631\u060C \u0648\u0645\u0648\u0642\u0639 \u0627\u0644\u062C\u0633\u064A\u0645\u060C \u0648\u0645\u062A\u062C\u0647\u0627\u062A \u0627\u0644\u0633\u0631\u0639\u0629/\u0627\u0644\u062A\u0633\u0627\u0631\u0639 \u0639\u0646\u062F t = {t} \u062B\u0627\u0646\u064A\u0629.',
    reportSectionPositionInfo: '\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u0648\u0642\u0639',
    promptSelectSnapshotTime: '\u0627\u062E\u062A\u0631 \u0627\u0644\u0632\u0645\u0646 \u0644\u0644\u062A\u0635\u0648\u0631 (\u0628\u0627\u0644\u062B\u0648\u0627\u0646\u064A\u060C 0\u2013{max}):',
    pdfInvalidTimeError: '\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0632\u0645\u0646 \u0628\u064A\u0646 0 \u0648 {max} \u062B\u0627\u0646\u064A\u0629.',

    // ---------------- Guided Tour ----------------
    tourWelcomeTitle: '\u0645\u0631\u062D\u0628\u064B\u0627 \u0628\u0643 \u0641\u064A SMIP \uD83D\uDC4B',
    tourWelcomeText: '\u062F\u0639\u0646\u0627 \u0646\u0642\u0645 \u0628\u062C\u0648\u0644\u0629 \u0633\u0631\u064A\u0639\u0629 \u0644\u0644\u062A\u0639\u0631\u0651\u0641 \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0635\u0629.',
    tourStartBtn: '\u0628\u062F\u0621 \u0627\u0644\u062C\u0648\u0644\u0629',
    tourSkipBtn: '\u062A\u062E\u0637\u0651\u064A',
    tourBackBtn: '\u0627\u0644\u0633\u0627\u0628\u0642',
    tourNextBtn: '\u0627\u0644\u062A\u0627\u0644\u064A',
    tourSkipTourBtn: '\u062A\u062E\u0637\u0651\u064A \u0627\u0644\u062C\u0648\u0644\u0629',
    tourFinalTitle: '\u0623\u0646\u062A \u0627\u0644\u0622\u0646 \u062C\u0627\u0647\u0632 \u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641 SMIP! \uD83D\uDE80',
    tourDontShowAgain: '\u0639\u062F\u0645 \u0627\u0644\u0625\u0638\u0647\u0627\u0631 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649',
    tourStartExploringBtn: '\u0627\u0628\u062F\u0623 \u0627\u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641',
    tourCloseAria: '\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u062C\u0648\u0644\u0629',
    tourStepCounter: '\u0627\u0644\u062E\u0637\u0648\u0629 {n} \u0645\u0646 {total}',

    tourStepCoordinateSystem: '\u0647\u0646\u0627 \u062A\u062E\u062A\u0627\u0631 \u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0647.',
    tourStepEquationInput:
      '\u0647\u0646\u0627 \u062A\u062F\u062E\u0644 \u0645\u0639\u0627\u062F\u0644\u0627\u062A \u0627\u0644\u0645\u0648\u0642\u0639 \u0643\u062F\u0648\u0627\u0644 \u0644\u0644\u0632\u0645\u0646\u060C \u062B\u0645 \u062A\u0636\u063A\u0637 \u0639\u0644\u0649 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0639\u0627\u062F\u0644\u0627\u062A \u0644\u062A\u0637\u0628\u064A\u0642\u0647\u0627.',
    tourStepSimulationSettings:
      '\u0647\u0646\u0627 \u062A\u062D\u062F\u0651\u062F \u0627\u0644\u0632\u0645\u0646 \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0644\u0645\u062D\u0627\u0643\u0627\u0629. \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u062A\u062D\u0643\u0645 \u0641\u064A \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0628\u062F\u0621 \u0648\u0625\u064A\u0642\u0627\u0641 \u0648\u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637.',
    tourStep3DVisualization:
      '\u0647\u0646\u0627 \u064A\u0645\u0643\u0646\u0643 \u0631\u0624\u064A\u0629 \u062D\u0631\u0643\u0629 \u0627\u0644\u062C\u0633\u064A\u0645 \u0641\u064A \u0627\u0644\u0641\u0636\u0627\u0621 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0648\u062A\u062F\u0648\u064A\u0631 \u0627\u0644\u0645\u0634\u0647\u062F \u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u062D\u0631\u0643\u0629 \u0645\u0646 \u0632\u0648\u0627\u064A\u0627 \u0645\u062E\u062A\u0644\u0641\u0629.',
    tourStepPVA:
      '\u0647\u0646\u0627 \u064A\u0645\u0643\u0646\u0643 \u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0642\u064A\u0645 \u0627\u0644\u0622\u0646\u064A\u0629 \u0644\u0644\u0645\u0648\u0642\u0639 \u0648\u0627\u0644\u0633\u0631\u0639\u0629 \u0648\u0627\u0644\u062A\u0633\u0627\u0631\u0639 \u0641\u064A \u0623\u064A \u0644\u062D\u0638\u0629.',
    tourStepCoordinateInfo:
      '\u0647\u0646\u0627 \u062A\u062C\u062F \u062A\u0639\u0631\u064A\u0641\u0627\u062A \u0648\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0639\u0646 \u0627\u0644\u0631\u0645\u0648\u0632 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0629 \u0641\u064A \u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u0645\u062E\u062A\u0627\u0631.',
    tourStepDerivation:
      '\u0647\u0646\u0627 \u064A\u0645\u0643\u0646\u0643 \u0631\u0624\u064A\u0629 \u0627\u0644\u0627\u0634\u062A\u0642\u0627\u0642 \u062E\u0637\u0648\u0629 \u0628\u062E\u0637\u0648\u0629 \u0644\u0644\u0633\u0631\u0639\u0629 \u0648\u0627\u0644\u062A\u0633\u0627\u0631\u0639 \u0645\u0646 \u0645\u0639\u0627\u062F\u0644\u0627\u062A \u0627\u0644\u0645\u0648\u0642\u0639.',

    tourGeometryIntro:
      '\u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645 \u0645\u062E\u0635\u0635 \u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0641\u0636\u0627\u0626\u064A\u0629. \u0633\u062A\u062A\u0648\u0641\u0631 \u0645\u064A\u0632\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629 \u0642\u0631\u064A\u0628\u064B\u0627.',

    tourProblemLibraryIntro:
      '\u0647\u0646\u0627 \u064A\u0645\u0643\u0646\u0643 \u0625\u0646\u0634\u0627\u0621 \u0648\u062D\u0641\u0638 \u0623\u0633\u0626\u0644\u0629 \u062D\u0633\u0628 \u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628.',
    tourStepChooseCategory: '\u0627\u062E\u062A\u0631 \u0642\u0633\u0645 \u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0644\u0633\u0624\u0627\u0644\u0643.',
    tourStepClickAdd: '\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0625\u0636\u0627\u0641\u0629 \u0644\u0625\u0646\u0634\u0627\u0621 \u0633\u0624\u0627\u0644 \u062C\u062F\u064A\u062F \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645.',
    tourStepEnterTitle: '\u0623\u062F\u062E\u0644 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0633\u0624\u0627\u0644.',
    tourStepEnterDescription: '\u0623\u062F\u062E\u0644 \u0641\u0642\u0631\u0629 \u062A\u0648\u0636\u064A\u062D\u064A\u0629 \u062D\u0648\u0644 \u0627\u0644\u0633\u0624\u0627\u0644.',
    tourStepEquationsApplySave:
      '\u0623\u062F\u062E\u0644 \u0627\u0644\u0645\u0639\u0627\u062F\u0644\u0627\u062A\u060C \u062B\u0645 \u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0639\u0627\u062F\u0644\u0627\u062A \u0648\u0627\u0641\u062D\u0635 \u0627\u0644\u062A\u0635\u0648\u0631 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F. \u0628\u0639\u062F \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u060C \u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u062D\u0641\u0638 \u0627\u0644\u0633\u0624\u0627\u0644 \u0644\u062D\u0641\u0638\u0647.',
    tourStepStoredEditDelete:
      '\u0623\u0635\u0628\u062D \u0627\u0644\u0633\u0624\u0627\u0644 \u0627\u0644\u0622\u0646 \u0645\u062D\u0641\u0648\u0638\u064B\u0627 \u0641\u064A \u0645\u0643\u062A\u0628\u062A\u0643 \u0627\u0644\u0634\u062E\u0635\u064A\u0629. \u064A\u0645\u0643\u0646\u0643 \u0641\u062A\u062D\u0647 \u0641\u064A \u0623\u064A \u0648\u0642\u062A \u0648\u0627\u062E\u062A\u064A\u0627\u0631 \u0639\u0631\u0636 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0644\u0645\u0634\u0627\u0647\u062F\u0629 \u0648\u062A\u0637\u0628\u064A\u0642 \u0643\u0627\u0645\u0644 \u062A\u0641\u0627\u0635\u064A\u0644 \u0633\u0624\u0627\u0644\u0643. \u064A\u0645\u0643\u0646 \u0623\u064A\u0636\u064B\u0627 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629 \u0623\u0648 \u062D\u0630\u0641\u0647\u0627.',
  },
};

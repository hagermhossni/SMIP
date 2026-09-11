/**
 * expressionCompiler
 * ----------------------------------------------------------------------
 * Compiles a user-typed math expression of a single variable `t` (e.g.
 * "5*cos(t)", "t^2 - 3", "sqrt(t)+PI") into a callable JS function.
 *
 * This is pure computation with no Three.js or DOM dependency, so it
 * belongs in src/math/ rather than inside a module.
 *
 * SAFETY:
 * User input never reaches JavaScript's Function() constructor
 * unvalidated. Two whitelist checks run first:
 *   1. Every identifier (letter sequence) in the expression must be
 *      exactly `t`, a supported function name, or a supported constant.
 *      Anything else (e.g. "alert", "window") is rejected immediately.
 *   2. The full expression, after substitution, may only contain
 *      digits, the identifiers above, and a small fixed set of
 *      operator/punctuation characters.
 * Only expressions that pass both checks are compiled.
 */

const FUNCTIONS = [
  'sin', 'cos', 'tan',
  'asin', 'acos', 'atan',
  'sqrt', 'abs', 'pow', 'exp', 'log',
  'min', 'max', 'floor', 'ceil', 'round',
];

const CONSTANTS = { PI: 'PI', E: 'E' };

// Matches runs of letters/underscore - used to pull out every identifier
// in the expression so each one can be checked against the whitelist.
const IDENTIFIER_PATTERN = /[a-zA-Z_]+/g;

// With every identifier blanked out, only digits, punctuation, and
// whitespace should remain in the expression.
const SAFE_PUNCTUATION_PATTERN = /^[0-9+\-*/^(),.\s]*$/;

/**
 * @param {string} expr - e.g. "5*cos(t)"
 * @returns {(t: number) => number} compiled function
 * @throws {Error} if the expression is empty, uses an unknown symbol,
 *   or contains characters outside the supported math syntax
 */
export function compileExpression(expr) {
  if (typeof expr !== 'string' || !expr.trim()) {
    throw new Error('Expression cannot be empty.');
  }

  const identifiers = expr.match(IDENTIFIER_PATTERN) || [];
  for (const id of identifiers) {
    const known = id === 't' || FUNCTIONS.includes(id) || Object.prototype.hasOwnProperty.call(CONSTANTS, id);
    if (!known) {
      throw new Error(`Unknown symbol "${id}". Allowed: t, ${FUNCTIONS.join(', ')}, PI, E.`);
    }
  }

  // With every identifier blanked out, whatever remains must be plain
  // math punctuation - catches injected characters that don't form a
  // whole extra identifier (e.g. stray backticks or semicolons).
  const withoutIdentifiers = expr.replace(IDENTIFIER_PATTERN, ' ');
  if (!SAFE_PUNCTUATION_PATTERN.test(withoutIdentifiers)) {
    throw new Error('Expression contains unsupported characters.');
  }

  let jsExpr = expr.replace(/\^/g, '**');
  FUNCTIONS.forEach((name) => {
    jsExpr = jsExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), `Math.${name}`);
  });
  Object.keys(CONSTANTS).forEach((name) => {
    jsExpr = jsExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), `Math.${name}`);
  });

  let compiled;
  try {
    // eslint-disable-next-line no-new-func
    compiled = new Function('t', `"use strict"; return (${jsExpr});`);
  } catch {
    throw new Error('Expression is not valid math syntax.');
  }

  // Smoke-test the compiled function once so syntax errors surface
  // immediately (at "Apply" time) rather than mid-animation.
  const testValue = compiled(0);
  if (typeof testValue !== 'number') {
    throw new Error('Expression must evaluate to a number.');
  }

  return compiled;
}

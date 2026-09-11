/**
 * symbolicDerivative
 * ----------------------------------------------------------------------
 * Pure computation, no Three.js/DOM dependency (like expressionCompiler.js
 * and vectorMath.js), used ONLY by the Step-by-Step Derivation panel
 * (modules/dynamics/StepByStepDerivation.js) to show students a readable
 * symbolic derivative of the equations they typed.
 *
 * This is entirely separate from - and never used by - ParametricMotion's
 * actual velocity/acceleration computation, which stays exactly as it
 * was (numerical central differences, see ParametricMotion.velocityAt/
 * accelerationAt). This module exists purely to *explain* that same
 * math: it parses the identical expression grammar expressionCompiler.js
 * accepts (same functions, same PI/E constants, same single variable t),
 * builds a small AST, differentiates it symbolically, simplifies the
 * result, and can both render it as a human-readable string and
 * evaluate it at a given t using the exact same Math.* functions
 * expressionCompiler.js's compiled output uses - so a derivative
 * evaluated here at time t agrees with what the app's own numerical
 * derivative is approximating.
 *
 * Supported grammar (mirrors expressionCompiler.js's FUNCTIONS/CONSTANTS):
 *   numbers, the variable t, PI, E, + - * / ^, parentheses, and calls to
 *   sin/cos/tan/asin/acos/atan/sqrt/abs/pow/exp/log/min/max/floor/ceil/round.
 *
 * Differentiation rules used (all standard calculus):
 *   sum/difference, product, quotient, chain rule for every function
 *   above, and the general power rule (constant exponent, constant
 *   base, or both variable - via logarithmic differentiation). floor/
 *   ceil/round are treated as zero almost everywhere (their derivative
 *   is undefined only at isolated jump points). min/max differentiate
 *   to whichever branch is numerically active at the evaluated t.
 */

// ---------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      tokens.push({ type: 'num', value: parseFloat(expr.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[a-zA-Z_]/.test(expr[j])) j++;
      tokens.push({ type: 'ident', value: expr.slice(i, j) });
      i = j;
      continue;
    }
    if ('+-*/^(),'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    throw new Error(`Unexpected character "${ch}" in expression.`);
  }
  tokens.push({ type: 'eof' });
  return tokens;
}

// ---------------------------------------------------------------------
// Parser (recursive descent) -> AST
// ---------------------------------------------------------------------
// Node shapes:
//   {t:'num', v}                 {t:'var'}                {t:'const', name}
//   {t:'neg', a}
//   {t:'add'|'sub'|'mul'|'div'|'pow', a, b}
//   {t:'call', name, args:[...]}
//   {t:'minmaxDeriv', which, u, v, du, dv}  (derivative-only node, see differentiateCall)

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  peek() {
    return this.tokens[this.pos];
  }
  next() {
    return this.tokens[this.pos++];
  }
  expectOp(v) {
    const tok = this.next();
    if (!(tok.type === 'op' && tok.value === v)) {
      throw new Error(`Expected "${v}" in expression.`);
    }
  }
  parseExpression() {
    let node = this.parseTerm();
    while (this.peek().type === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.next().value;
      const rhs = this.parseTerm();
      node = { t: op === '+' ? 'add' : 'sub', a: node, b: rhs };
    }
    return node;
  }
  parseTerm() {
    let node = this.parseUnary();
    while (this.peek().type === 'op' && (this.peek().value === '*' || this.peek().value === '/')) {
      const op = this.next().value;
      const rhs = this.parseUnary();
      node = { t: op === '*' ? 'mul' : 'div', a: node, b: rhs };
    }
    return node;
  }
  parseUnary() {
    if (this.peek().type === 'op' && this.peek().value === '-') {
      this.next();
      return { t: 'neg', a: this.parseUnary() };
    }
    if (this.peek().type === 'op' && this.peek().value === '+') {
      this.next();
      return this.parseUnary();
    }
    return this.parsePower();
  }
  parsePower() {
    const base = this.parsePrimary();
    if (this.peek().type === 'op' && this.peek().value === '^') {
      this.next();
      const exp = this.parseUnary(); // right-associative; allows e.g. 2^-1
      return { t: 'pow', a: base, b: exp };
    }
    return base;
  }
  parsePrimary() {
    const tok = this.peek();
    if (tok.type === 'num') {
      this.next();
      return { t: 'num', v: tok.value };
    }
    if (tok.type === 'ident') {
      this.next();
      const name = tok.value;
      if (this.peek().type === 'op' && this.peek().value === '(') {
        this.next();
        const args = [this.parseExpression()];
        while (this.peek().type === 'op' && this.peek().value === ',') {
          this.next();
          args.push(this.parseExpression());
        }
        this.expectOp(')');
        return { t: 'call', name, args };
      }
      if (name === 'PI' || name === 'E') return { t: 'const', name };
      if (name === 't') return { t: 'var' };
      throw new Error(`Unknown identifier "${name}" in expression.`);
    }
    if (tok.type === 'op' && tok.value === '(') {
      this.next();
      const node = this.parseExpression();
      this.expectOp(')');
      return node;
    }
    throw new Error('Unexpected token in expression.');
  }
}

function parseExpression(str) {
  const parser = new Parser(tokenize(str));
  const node = parser.parseExpression();
  if (parser.peek().type !== 'eof') throw new Error('Unexpected trailing content in expression.');
  return node;
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

const num = (v) => ({ t: 'num', v });

/** @returns {boolean} true if `node` has no dependency on t (a symbolic constant) */
function containsVar(node) {
  switch (node.t) {
    case 'var':
      return true;
    case 'num':
    case 'const':
      return false;
    case 'neg':
      return containsVar(node.a);
    case 'add':
    case 'sub':
    case 'mul':
    case 'div':
    case 'pow':
      return containsVar(node.a) || containsVar(node.b);
    case 'call':
      return node.args.some(containsVar);
    default:
      return true;
  }
}

// ---------------------------------------------------------------------
// Evaluation - mirrors expressionCompiler.js's Math.* mapping exactly,
// so evaluating an original (non-differentiated) AST at t reproduces
// the same floating-point result compileExpression(str)(t) would.
// ---------------------------------------------------------------------

function evaluateCall(node, t) {
  const vals = node.args.map((a) => evaluateAst(a, t));
  switch (node.name) {
    case 'sin':
      return Math.sin(vals[0]);
    case 'cos':
      return Math.cos(vals[0]);
    case 'tan':
      return Math.tan(vals[0]);
    case 'asin':
      return Math.asin(vals[0]);
    case 'acos':
      return Math.acos(vals[0]);
    case 'atan':
      return Math.atan(vals[0]);
    case 'sqrt':
      return Math.sqrt(vals[0]);
    case 'abs':
      return Math.abs(vals[0]);
    case 'pow':
      return Math.pow(vals[0], vals[1]);
    case 'exp':
      return Math.exp(vals[0]);
    case 'log':
      return Math.log(vals[0]);
    case 'min':
      return Math.min(vals[0], vals[1]);
    case 'max':
      return Math.max(vals[0], vals[1]);
    case 'floor':
      return Math.floor(vals[0]);
    case 'ceil':
      return Math.ceil(vals[0]);
    case 'round':
      return Math.round(vals[0]);
    case 'sign': // internal-only: produced by differentiating abs(), never user-typed
      return Math.sign(vals[0]);
    default:
      throw new Error(`Unknown function "${node.name}".`);
  }
}

/**
 * @param {object} node - an AST node from parseExpression/differentiate
 * @param {number} t
 * @returns {number}
 */
export function evaluateAst(node, t) {
  switch (node.t) {
    case 'num':
      return node.v;
    case 'var':
      return t;
    case 'const':
      return node.name === 'PI' ? Math.PI : Math.E;
    case 'neg':
      return -evaluateAst(node.a, t);
    case 'add':
      return evaluateAst(node.a, t) + evaluateAst(node.b, t);
    case 'sub':
      return evaluateAst(node.a, t) - evaluateAst(node.b, t);
    case 'mul':
      return evaluateAst(node.a, t) * evaluateAst(node.b, t);
    case 'div':
      return evaluateAst(node.a, t) / evaluateAst(node.b, t);
    case 'pow':
      return Math.pow(evaluateAst(node.a, t), evaluateAst(node.b, t));
    case 'call':
      return evaluateCall(node, t);
    case 'minmaxDeriv': {
      const uVal = evaluateAst(node.u, t);
      const vVal = evaluateAst(node.v, t);
      const uWins = node.which === 'min' ? uVal <= vVal : uVal >= vVal;
      return uWins ? evaluateAst(node.du, t) : evaluateAst(node.dv, t);
    }
    default:
      throw new Error('Cannot evaluate expression.');
  }
}

// ---------------------------------------------------------------------
// Symbolic differentiation
// ---------------------------------------------------------------------

function differentiatePow(node) {
  const { a, b } = node;
  const bIsConst = !containsVar(b);
  const aIsConst = !containsVar(a);

  if (bIsConst) {
    // d/dt[a^b] = b * a^(b-1) * a'   (power rule, constant exponent)
    return {
      t: 'mul',
      a: { t: 'mul', a: b, b: { t: 'pow', a, b: { t: 'sub', a: b, b: num(1) } } },
      b: differentiate(a),
    };
  }
  if (aIsConst) {
    // d/dt[a^b] = a^b * ln(a) * b'   (constant base, variable exponent)
    return {
      t: 'mul',
      a: { t: 'mul', a: node, b: { t: 'call', name: 'log', args: [a] } },
      b: differentiate(b),
    };
  }
  // d/dt[a^b] = a^b * ( b' * ln(a) + b * a'/a )  (logarithmic differentiation, general case)
  return {
    t: 'mul',
    a: node,
    b: {
      t: 'add',
      a: { t: 'mul', a: differentiate(b), b: { t: 'call', name: 'log', args: [a] } },
      b: { t: 'div', a: { t: 'mul', a: b, b: differentiate(a) }, b: a },
    },
  };
}

function differentiateCall(node) {
  const { name, args } = node;

  if (name === 'pow') return differentiatePow({ t: 'pow', a: args[0], b: args[1] });
  if (name === 'min' || name === 'max') {
    return { t: 'minmaxDeriv', which: name, u: args[0], v: args[1], du: differentiate(args[0]), dv: differentiate(args[1]) };
  }
  // floor/ceil/round are piecewise-constant almost everywhere; sign()
  // is generated only internally (by abs()'s own derivative below) and
  // is likewise piecewise-constant almost everywhere - so differentiating
  // it again (e.g. the second derivative of abs(sin(t))) is also zero.
  if (name === 'floor' || name === 'ceil' || name === 'round' || name === 'sign') return num(0);

  const u = args[0];
  const du = differentiate(u);
  const sq = (n) => ({ t: 'pow', a: n, b: num(2) });

  switch (name) {
    case 'sin':
      return { t: 'mul', a: du, b: { t: 'call', name: 'cos', args: [u] } };
    case 'cos':
      return { t: 'neg', a: { t: 'mul', a: du, b: { t: 'call', name: 'sin', args: [u] } } };
    case 'tan':
      return { t: 'div', a: du, b: sq({ t: 'call', name: 'cos', args: [u] }) };
    case 'asin':
      return { t: 'div', a: du, b: { t: 'call', name: 'sqrt', args: [{ t: 'sub', a: num(1), b: sq(u) }] } };
    case 'acos':
      return { t: 'neg', a: { t: 'div', a: du, b: { t: 'call', name: 'sqrt', args: [{ t: 'sub', a: num(1), b: sq(u) }] } } };
    case 'atan':
      return { t: 'div', a: du, b: { t: 'add', a: num(1), b: sq(u) } };
    case 'sqrt':
      return { t: 'div', a: du, b: { t: 'mul', a: num(2), b: { t: 'call', name: 'sqrt', args: [u] } } };
    case 'exp':
      return { t: 'mul', a: du, b: { t: 'call', name: 'exp', args: [u] } };
    case 'log':
      return { t: 'div', a: du, b: u };
    case 'abs':
      return { t: 'mul', a: du, b: { t: 'call', name: 'sign', args: [u] } };
    default:
      throw new Error(`Cannot differentiate function "${name}".`);
  }
}

/**
 * @param {object} node - AST from parseExpression
 * @returns {object} AST of d(node)/dt
 */
export function differentiate(node) {
  switch (node.t) {
    case 'num':
    case 'const':
      return num(0);
    case 'var':
      return num(1);
    case 'neg':
      return { t: 'neg', a: differentiate(node.a) };
    case 'add':
      return { t: 'add', a: differentiate(node.a), b: differentiate(node.b) };
    case 'sub':
      return { t: 'sub', a: differentiate(node.a), b: differentiate(node.b) };
    case 'mul':
      // product rule: (a*b)' = a'*b + a*b'
      return {
        t: 'add',
        a: { t: 'mul', a: differentiate(node.a), b: node.b },
        b: { t: 'mul', a: node.a, b: differentiate(node.b) },
      };
    case 'div':
      // quotient rule: (a/b)' = (a'*b - a*b') / b^2
      return {
        t: 'div',
        a: {
          t: 'sub',
          a: { t: 'mul', a: differentiate(node.a), b: node.b },
          b: { t: 'mul', a: node.a, b: differentiate(node.b) },
        },
        b: { t: 'pow', a: node.b, b: num(2) },
      };
    case 'pow':
      return differentiatePow(node);
    case 'call':
      return differentiateCall(node);
    case 'minmaxDeriv':
      // Differentiating a min/max derivative again (e.g. the second
      // derivative of min(u,v)) keeps the same u-vs-v comparison and
      // differentiates whichever branch it resolves to at eval time.
      return { t: 'minmaxDeriv', which: node.which, u: node.u, v: node.v, du: differentiate(node.du), dv: differentiate(node.dv) };
    default:
      throw new Error('Cannot differentiate this expression.');
  }
}

// ---------------------------------------------------------------------
// Simplification - keeps derivative strings readable. Not a full CAS;
// just enough constant-folding and identity-removal (x*1, x+0, x*0,
// double negation, etc.) that a differentiated expression reads close
// to what a person would write by hand.
// ---------------------------------------------------------------------

const isNum = (node, v) => node.t === 'num' && (v === undefined || node.v === v);
const numOf = (v) => ({ t: 'num', v });

export function simplify(node) {
  switch (node.t) {
    case 'num':
    case 'var':
    case 'const':
      return node;
    case 'neg': {
      const a = simplify(node.a);
      if (a.t === 'num') return numOf(-a.v);
      if (a.t === 'neg') return a.a;
      if (a.t === 'mul') {
        if (a.a.t === 'num') return simplify({ t: 'mul', a: numOf(-a.a.v), b: a.b });
        if (a.b.t === 'num') return simplify({ t: 'mul', a: a.a, b: numOf(-a.b.v) });
      }
      if (a.t === 'div' && a.a.t === 'num') return simplify({ t: 'div', a: numOf(-a.a.v), b: a.b });
      return { t: 'neg', a };
    }
    case 'add': {
      const a = simplify(node.a);
      const b = simplify(node.b);
      if (isNum(a, 0)) return b;
      if (isNum(b, 0)) return a;
      if (a.t === 'num' && b.t === 'num') return numOf(a.v + b.v);
      if (b.t === 'neg') return simplify({ t: 'sub', a, b: b.a });
      if (b.t === 'num' && b.v < 0) return simplify({ t: 'sub', a, b: numOf(-b.v) });
      return { t: 'add', a, b };
    }
    case 'sub': {
      const a = simplify(node.a);
      const b = simplify(node.b);
      if (isNum(b, 0)) return a;
      if (isNum(a, 0)) return simplify({ t: 'neg', a: b });
      if (a.t === 'num' && b.t === 'num') return numOf(a.v - b.v);
      if (b.t === 'neg') return simplify({ t: 'add', a, b: b.a });
      if (b.t === 'num' && b.v < 0) return simplify({ t: 'add', a, b: numOf(-b.v) });
      return { t: 'sub', a, b };
    }
    case 'mul': {
      const a = simplify(node.a);
      const b = simplify(node.b);
      if (isNum(a, 0) || isNum(b, 0)) return numOf(0);
      if (isNum(a, 1)) return b;
      if (isNum(b, 1)) return a;
      if (isNum(a, -1)) return simplify({ t: 'neg', a: b });
      if (isNum(b, -1)) return simplify({ t: 'neg', a });
      if (a.t === 'num' && b.t === 'num') return numOf(a.v * b.v);
      if (a.t === 'neg' && b.t === 'neg') return simplify({ t: 'mul', a: a.a, b: b.a });
      if (a.t === 'neg') return simplify({ t: 'neg', a: { t: 'mul', a: a.a, b } });
      if (b.t === 'neg') return simplify({ t: 'neg', a: { t: 'mul', a, b: b.a } });
      return { t: 'mul', a, b };
    }
    case 'div': {
      const a = simplify(node.a);
      const b = simplify(node.b);
      if (isNum(a, 0)) return numOf(0);
      if (isNum(b, 1)) return a;
      if (isNum(b, -1)) return simplify({ t: 'neg', a });
      if (a.t === 'num' && b.t === 'num' && b.v !== 0) return numOf(a.v / b.v);
      if (a.t === 'neg' && b.t === 'neg') return simplify({ t: 'div', a: a.a, b: b.a });
      if (a.t === 'neg') return simplify({ t: 'neg', a: { t: 'div', a: a.a, b } });
      if (b.t === 'neg') return simplify({ t: 'neg', a: { t: 'div', a, b: b.a } });
      return { t: 'div', a, b };
    }
    case 'pow': {
      const a = simplify(node.a);
      const b = simplify(node.b);
      if (isNum(b, 0)) return numOf(1);
      if (isNum(b, 1)) return a;
      if (isNum(a, 0)) return numOf(0);
      if (isNum(a, 1)) return numOf(1);
      if (a.t === 'num' && b.t === 'num') return numOf(Math.pow(a.v, b.v));
      return { t: 'pow', a, b };
    }
    case 'call': {
      const args = node.args.map(simplify);
      if (args.every((x) => x.t === 'num')) {
        try {
          return numOf(evaluateCall({ t: 'call', name: node.name, args }, 0));
        } catch {
          // fall through - keep the call symbolic (e.g. log(0))
        }
      }
      return { t: 'call', name: node.name, args };
    }
    case 'minmaxDeriv':
      return { t: 'minmaxDeriv', which: node.which, u: simplify(node.u), v: simplify(node.v), du: simplify(node.du), dv: simplify(node.dv) };
    default:
      return node;
  }
}

// ---------------------------------------------------------------------
// Readable string rendering
// ---------------------------------------------------------------------

function formatNum(vIn) {
  const v = Object.is(vIn, -0) ? 0 : vIn;
  if (Number.isInteger(v)) return String(v);
  const rounded = Math.round(v * 1e6) / 1e6;
  return String(rounded);
}

const isPrimaryLike = (node) => node.t === 'num' || node.t === 'var' || node.t === 'const' || node.t === 'call';

function wrapAddend(node) {
  if (node.t === 'add' || node.t === 'sub') return `(${toStr(node)})`;
  return toStr(node);
}

function wrapFactor(node, isFirst) {
  if (node.t === 'add' || node.t === 'sub' || node.t === 'neg') return `(${toStr(node)})`;
  if (!isFirst && node.t === 'num' && node.v < 0) return `(${toStr(node)})`;
  return toStr(node);
}

function wrapPowSide(node) {
  if (isPrimaryLike(node) && !(node.t === 'num' && node.v < 0)) return toStr(node);
  return `(${toStr(node)})`;
}

function wrapDivNumerator(node) {
  if (node.t === 'add' || node.t === 'sub') return `(${toStr(node)})`;
  return toStr(node);
}

function wrapDivDenominator(node) {
  // Stricter than wrapFactor: a plain "a/b*c" would parse as (a/b)*c,
  // not a/(b*c) - so unlike multiplication, a mul/div denominator must
  // always be parenthesized here, not just add/sub/neg.
  if (isPrimaryLike(node) && !(node.t === 'num' && node.v < 0)) return toStr(node);
  return `(${toStr(node)})`;
}

export function toStr(node) {
  switch (node.t) {
    case 'num':
      return formatNum(node.v);
    case 'var':
      return 't';
    case 'const':
      return node.name;
    case 'neg': {
      const inner = node.a;
      if (inner.t === 'add' || inner.t === 'sub') return `-(${toStr(inner)})`;
      return `-${toStr(inner)}`;
    }
    case 'add': {
      const { a, b } = node;
      if (b.t === 'neg') return `${toStr(a)} - ${wrapAddend(b.a)}`;
      if (b.t === 'num' && b.v < 0) return `${toStr(a)} - ${formatNum(-b.v)}`;
      return `${toStr(a)} + ${toStr(b)}`;
    }
    case 'sub': {
      const { a, b } = node;
      if (b.t === 'neg') return `${toStr(a)} + ${wrapAddend(b.a)}`;
      if (b.t === 'num' && b.v < 0) return `${toStr(a)} + ${formatNum(-b.v)}`;
      if (b.t === 'add' || b.t === 'sub') return `${toStr(a)} - (${toStr(b)})`;
      return `${toStr(a)} - ${toStr(b)}`;
    }
    case 'mul':
      return `${wrapFactor(node.a, true)}*${wrapFactor(node.b, false)}`;
    case 'div':
      return `${wrapDivNumerator(node.a)}/${wrapDivDenominator(node.b)}`;
    case 'pow':
      return `${wrapPowSide(node.a)}^${wrapPowSide(node.b)}`;
    case 'call':
      return `${node.name}(${node.args.map(toStr).join(', ')})`;
    case 'minmaxDeriv':
      return `d/dt[${node.which}(${toStr(node.u)}, ${toStr(node.v)})]`;
    default:
      return '?';
  }
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Parses `exprStr`, differentiates it twice with respect to t, and
 * returns everything the Step-by-Step Derivation panel needs: readable
 * text for the first/second derivative, and evaluators that compute
 * their numeric value at any t (using the same Math.* functions the
 * app's own compiled equations use).
 * @param {string} exprStr - an expression already accepted by expressionCompiler.js
 * @returns {{
 *   original: string,
 *   evaluateOriginal: (t:number)=>number,
 *   firstDerivative: {text: string, evaluate: (t:number)=>number},
 *   secondDerivative: {text: string, evaluate: (t:number)=>number},
 * }}
 * @throws {Error} if `exprStr` cannot be parsed or differentiated in closed form
 */
export function differentiateExpression(exprStr) {
  const ast = parseExpression(exprStr);
  const d1 = simplify(simplify(differentiate(ast)));
  const d2 = simplify(simplify(differentiate(d1)));
  return {
    original: exprStr,
    evaluateOriginal: (t) => evaluateAst(ast, t),
    firstDerivative: { text: toStr(d1), evaluate: (t) => evaluateAst(d1, t) },
    secondDerivative: { text: toStr(d2), evaluate: (t) => evaluateAst(d2, t) },
  };
}

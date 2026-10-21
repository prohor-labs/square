/**
 * LaTeX support for question text.
 *
 * The sheets in this bank are typed as plain maths — `A^-1`, `sqrt(x + 1)`,
 * `tan^-1`, `∠A = 600`, `dy/dx` — usually without `$…$` around them. KaTeX
 * (through remark-math) only renders what is delimited, so this module wraps
 * every maths-looking run in `$…$` and rewrites the plain notation (`^2`,
 * `sqrt(…)`, `*`, `√`, `π`, …) into real LaTeX. Row-of-tuples matrices such as
 * `[(1, 0), (0, 1)]` become real row/column `bmatrix` blocks.
 *
 * Anything that is not maths is left byte-for-byte alone: HTML, markdown
 * images and links, URLs, fenced/inline code, and text that is already
 * delimited stay untouched.
 */

const PROTECT_START = "\uE000";
const PROTECT_END = "\uE001";

/**
 * Characters a candidate maths run may contain. Bengali letters are not here
 * on purpose: they split a sentence into the maths pieces around them.
 */
const MATH_RUN =
  /[A-Za-z0-9\s+\-*/^_=()[\]{}.,;:<>|!?'"%\\√π∞∑∫∠Δ°±×÷·−≤≥≠→←↔⇒⇔αβγδεζηθικλμνξρστυφχψωΓΘΛΞΠΣΦΨΩℝℕℤℚℂ]+/g;

/** Enough on its own to call a run maths. */
const STRONG_SIGNAL =
  /[\^=<>√π∞∑∫∠Δ°±×÷·−≤≥≠→←↔⇒⇔αβγδεζηθικλμνξρστυφχψωΓΘΛΞΠΣΦΨΩℝℕℤℚℂ]|\\[A-Za-z]+|\b(?:sqrt|cbrt|frac|sin|cos|tan|cot|sec|csc|log|ln|lim|int|sum|prod|det)\b|\bd[a-zA-Z]\s*\/\s*d[a-zA-Z]\b/;

/** Only counts together with a letter and a digit (`x/2`, not `20/10/2026`). */
const WEAK_SIGNAL = /[+\-*/%]/;

const PLACEHOLDER = new RegExp(`${PROTECT_START}(\\d+)${PROTECT_END}`, "g");

function findClosingParen(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "(") depth++;
    if (text[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function topLevelComma(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(" || text[i] === "[" || text[i] === "{") depth++;
    if (text[i] === ")" || text[i] === "]" || text[i] === "}") depth--;
    if (text[i] === "," && depth === 0) return i;
  }
  return -1;
}

/** Index of the bracket that closes the one at `start`, or -1. */
function findMatching(
  text: string,
  start: number,
  open: string,
  close: string,
): number {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth++;
    if (text[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Splits on `separator` while ignoring anything inside (), [] or {}. */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of text) {
    if (char === "(" || char === "[" || char === "{") depth++;
    if (char === ")" || char === "]" || char === "}") depth--;

    if (char === separator && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  parts.push(current);
  return parts;
}

/**
 * The sheets write matrices as rows of tuples: `[(1, 0), (0, 1)]`.
 * `[1, 2; 3, 4]` and `[1 2; 3 4]` are accepted too.
 */
function matrixFromInner(inner: string): string | null {
  const trimmed = inner.trim();
  if (!trimmed) return null;

  // Row-per-semicolon notation.
  const semicolonRows = splitTopLevel(trimmed, ";");
  if (semicolonRows.length > 1) {
    const rows: string[][] = [];

    for (const row of semicolonRows) {
      const byComma = splitTopLevel(row, ",");
      if (byComma.length > 1) {
        rows.push(byComma);
        continue;
      }

      const cells = row.trim().replace(/\s+/g, " ").split(" ");
      if (!cells.every((cell) => /^-?[\w.]+$/.test(cell))) return null;
      rows.push(cells);
    }

    const columns = rows[0]?.length ?? 0;
    if (columns < 2 || !rows.every((row) => row.length === columns)) {
      return null;
    }

    return buildMatrix(rows);
  }

  // Tuple rows, the notation used by every imported matrix question.
  const groups = splitTopLevel(trimmed, ",");
  if (groups.length < 2) return null;

  const rows: string[][] = [];
  for (const group of groups) {
    const cell = group.trim();
    if (!cell.startsWith("(") || !cell.endsWith(")")) return null;
    if (findMatching(cell, 0, "(", ")") !== cell.length - 1) return null;

    rows.push(splitTopLevel(cell.slice(1, -1), ","));
  }

  const columns = rows[0]?.length ?? 0;
  if (columns < 1 || !rows.every((row) => row.length === columns)) {
    return null;
  }

  return buildMatrix(rows);
}

function buildMatrix(rows: readonly string[][]): string {
  const body = rows
    .map((row) => row.map((cell) => cell.trim()).join(" & "))
    .join(" \\\\ ");
  return `\\begin{bmatrix}${body}\\end{bmatrix}`;
}

/** Rewrites every `[…]` that holds a matrix into a real `bmatrix`. */
function replaceMatrices(text: string): string {
  let out = "";
  let index = 0;

  while (index < text.length) {
    if (text[index] !== "[") {
      out += text[index];
      index++;
      continue;
    }

    const close = findMatching(text, index, "[", "]");
    if (close < 0) {
      out += text[index];
      index++;
      continue;
    }

    const matrix = matrixFromInner(text.slice(index + 1, close));
    if (!matrix) {
      out += text[index];
      index++;
      continue;
    }

    out += matrix;
    index = close + 1;
  }

  return out;
}

/** `sqrt(1 - t^2)` → `\sqrt{1 - t^2}`, keeping nested parentheses intact. */
function replaceCall(text: string, name: string, command: string): string {
  let out = text;
  let from = 0;

  while (from < out.length) {
    const index = out.indexOf(`${name}(`, from);
    if (index < 0) break;

    // A real command already, not plain text.
    if (index > 0 && out[index - 1] === "\\") {
      from = index + name.length + 1;
      continue;
    }

    const open = index + name.length;
    const close = findClosingParen(out, open);
    if (close < 0) break;

    const inner = out.slice(open + 1, close);
    const replacement = `${command}{${inner}}`;
    out = `${out.slice(0, index)}${replacement}${out.slice(close + 1)}`;
    from = index + replacement.length;
  }

  return out;
}

/** `sqrt[3](27)` → `\sqrt[3]{27}`. */
function replaceRootCall(text: string): string {
  return text.replace(
    /(?<!\\)sqrt\s*\[([^\]]*)\]\s*\(([^()]*)\)/g,
    "\\sqrt[$1]{$2}",
  );
}

/** `frac(a, b)` → `\frac{a}{b}`. */
function replaceFrac(text: string): string {
  let out = text;
  let from = 0;

  while (from < out.length) {
    const index = out.indexOf("frac(", from);
    if (index < 0) break;

    if (index > 0 && out[index - 1] === "\\") {
      from = index + 5;
      continue;
    }

    const open = index + 4;
    const close = findClosingParen(out, open);
    if (close < 0) break;

    const inner = out.slice(open + 1, close);
    const comma = topLevelComma(inner);
    if (comma < 0) {
      from = index + 5;
      continue;
    }

    const numerator = inner.slice(0, comma).trim();
    const denominator = inner.slice(comma + 1).trim();
    const replacement = `\\frac{${numerator}}{${denominator}}`;
    out = `${out.slice(0, index)}${replacement}${out.slice(close + 1)}`;
    from = index + replacement.length;
  }

  return out;
}

/** Turns one plain-text maths run into LaTeX (without the `$` delimiters). */
function toLatex(raw: string): string {
  // Matrices first: `[(1, 0), (0, 1)]` becomes a real row/column bmatrix.
  let text = replaceMatrices(raw);

  // Calls next, so their arguments still look like plain text.
  text = replaceRootCall(text);
  text = replaceCall(text, "sqrt", "\\sqrt");
  text = replaceCall(text, "cbrt", "\\sqrt[3]");
  text = replaceFrac(text);

  // Unicode maths → commands.
  text = text
    .replace(/√\s*\(([^()]*)\)/g, "\\sqrt{$1}")
    .replace(/√\s*([0-9A-Za-z])/g, "\\sqrt{$1}")
    .replace(/∞/g, "\\infty ")
    .replace(/π/g, "\\pi ")
    .replace(/α/g, "\\alpha ")
    .replace(/β/g, "\\beta ")
    .replace(/γ/g, "\\gamma ")
    .replace(/δ/g, "\\delta ")
    .replace(/ε/g, "\\epsilon ")
    .replace(/ζ/g, "\\zeta ")
    .replace(/η/g, "\\eta ")
    .replace(/θ/g, "\\theta ")
    .replace(/ι/g, "\\iota ")
    .replace(/κ/g, "\\kappa ")
    .replace(/λ/g, "\\lambda ")
    .replace(/μ/g, "\\mu ")
    .replace(/ν/g, "\\nu ")
    .replace(/ξ/g, "\\xi ")
    .replace(/ρ/g, "\\rho ")
    .replace(/σ/g, "\\sigma ")
    .replace(/τ/g, "\\tau ")
    .replace(/υ/g, "\\upsilon ")
    .replace(/φ/g, "\\phi ")
    .replace(/χ/g, "\\chi ")
    .replace(/ψ/g, "\\psi ")
    .replace(/ω/g, "\\omega ")
    .replace(/Γ/g, "\\Gamma ")
    .replace(/Θ/g, "\\Theta ")
    .replace(/Λ/g, "\\Lambda ")
    .replace(/Ξ/g, "\\Xi ")
    .replace(/Π/g, "\\Pi ")
    .replace(/Σ/g, "\\Sigma ")
    .replace(/Φ/g, "\\Phi ")
    .replace(/Ψ/g, "\\Psi ")
    .replace(/Ω/g, "\\Omega ")
    .replace(/∠/g, "\\angle ")
    .replace(/Δ/g, "\\Delta ")
    .replace(/∑/g, "\\sum ")
    .replace(/∫/g, "\\int ")
    .replace(/°/g, "^{\\circ}")
    .replace(/±/g, "\\pm ")
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ")
    .replace(/·/g, "\\cdot ")
    .replace(/−/g, "-")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/⇒/g, "\\Rightarrow ")
    .replace(/⇔/g, "\\Leftrightarrow ")
    .replace(/→/g, "\\to ")
    .replace(/←/g, "\\leftarrow ")
    .replace(/<=/g, "\\le ")
    .replace(/>=/g, "\\ge ")
    .replace(/!=/g, "\\ne ")
    .replace(/->/g, "\\to ")
    .replace(/ℝ/g, "\\mathbb{R} ")
    .replace(/ℕ/g, "\\mathbb{N} ")
    .replace(/ℤ/g, "\\mathbb{Z} ")
    .replace(/ℚ/g, "\\mathbb{Q} ")
    .replace(/ℂ/g, "\\mathbb{C} ");

  // `alpha in ℝ` reads as set membership once the set symbol is there.
  if (text.includes("\\mathbb{")) {
    text = text.replace(/\bin\b/g, "\\in ");
  }

  // dy/dx → a real fraction.
  text = text.replace(
    /\bd([a-zA-Z])\s*\/\s*d([a-zA-Z])\b/g,
    "\\frac{d$1}{d$2}",
  );

  // Function names, but not ones that already carry a backslash. The lookahead
  // keeps `lim_{x→0}` and `sin^2` working (`_` is a word character, so `\b`
  // would stop at it).
  // `sinalpha` / `cosalpha` — a function glued to a Greek name.
  text = text.replace(
    /(?<!\\)\b(sin|cos|tan|cot|sec|csc|log|ln)(alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|phi|omega)\b/g,
    "\\$1 \\$2",
  );
  text = text.replace(
    /(?<!\\)\b(sin|cos|tan|cot|sec|csc|log|ln|lim|max|min|det)(?=[\s_^(]|$)/g,
    "\\$1 ",
  );
  text = text.replace(/(?<!\\)\bint(?=[\s_^(]|$)/g, "\\int ");
  text = text.replace(/(?<!\\)\bsum(?=[\s_^(]|$)/g, "\\sum ");
  text = text.replace(/(?<!\\)\bprod(?=[\s_^(]|$)/g, "\\prod ");

  // Greek names typed as words, e.g. `alpha` or the tail of `sinalpha`.
  text = text.replace(
    /(?<!\\)\b(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|rho|sigma|tau|phi|omega)\b/g,
    "\\$1 ",
  );

  // Powers and subscripts. A parenthesised power comes first so
  // `int_0^(pi/8)` does not turn into a superscript over `(`.
  text = text.replace(/\^\s*\(([^()]*)\)/g, "^{($1)}");
  text = text.replace(/\^\s*\{([^{}]*)\}/g, "^{$1}");
  text = text.replace(/\^\s*(-?\d+(?:\.\d+)?)/g, "^{$1}");
  text = text.replace(/\^\s*(-?[A-Za-z])\b/g, "^{$1}");
  text = text.replace(/_\s*\(([^()]*)\)/g, "_{($1)}");
  text = text.replace(/_\s*\{([^{}]*)\}/g, "_{$1}");
  text = text.replace(/_\s*(\d+)/g, "_{$1}");
  text = text.replace(/_\s*([A-Za-z])\b/g, "_{$1}");

  // `pi` is typed far more often than the word itself in a maths run.
  text = text.replace(/(?<![\\A-Za-z])pi(?![A-Za-z])/g, "\\pi ");

  text = text
    .replace(/\*/g, "\\cdot ")
    .replace(/(?<!\\)%/g, "\\%")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text;
}

/** Splits `C =?` into `"", "C =", "?"` so the `?` stays outside the maths. */
function splitPunctuation(core: string): [string, string, string] {
  const lead = core.match(/^[?!.,;:]+\s*/)?.[0] ?? "";
  let rest = core.slice(lead.length);

  const trail = rest.match(/[?!.,;:]+$/)?.[0] ?? "";
  if (trail) rest = rest.slice(0, rest.length - trail.length);

  return [lead, rest, trail];
}

/**
 * Wraps plain-text maths in `$…$` and converts it to LaTeX. Safe to call more
 * than once: content that is already delimited is skipped.
 */
export function normalizeMath(text: string): string {
  if (!text) return text;

  const stash: string[] = [];
  const keep = (match: string): string => {
    stash.push(match);
    return `${PROTECT_START}${stash.length - 1}${PROTECT_END}`;
  };

  let out = text
    // Code and HTML must survive untouched.
    .replace(/```[\s\S]*?```/g, keep)
    .replace(/`[^`\n]*`/g, keep)
    .replace(/<[^>]+>/g, keep)
    // Markdown images/links before their URLs. A bare `[3](27)` is cube-root
    // notation, not a link, so the target has to look like one.
    .replace(/!?\[[^\]]*\]\((?=[^)]*(?:https?:|mailto:|\/|#|\.))[^)]*\)/g, keep)
    .replace(/https?:\/\/\S+/g, keep);

  // \( … \) and \[ … \] are LaTeX delimiters too.
  out = out
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, body: string) => `$$${body}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, body: string) => `$${body}$`);

  // Anything already delimited is rendered by remark-math as it is.
  out = out
    .replace(/\$\$[\s\S]*?\$\$/g, keep)
    .replace(/\$(?:[^$\\\n]|\\.)+\$/g, keep);

  out = out.replace(MATH_RUN, (raw) => {
    const lead = raw.match(/^\s*/)?.[0] ?? "";
    const trail = raw.match(/\s*$/)?.[0] ?? "";
    const body = raw.slice(lead.length, raw.length - trail.length);
    if (!body) return raw;

    // Blockquote marker, not a comparison.
    if (/^>\s/.test(body)) return raw;

    // Markdown emphasis is not maths.
    if (body.includes("**") || /^_.*_$/.test(body)) return raw;

    const [leadPunct, core, trailPunct] = splitPunctuation(body);
    if (core.length < 2) return raw;

    const hasLetter = /[A-Za-z]/.test(core);
    const hasDigit = /\d/.test(core);
    if (!hasLetter && !hasDigit) return raw;

    const isMath =
      STRONG_SIGNAL.test(core) ||
      (WEAK_SIGNAL.test(core) && hasLetter && hasDigit);
    if (!isMath) return raw;

    return `${lead}${leadPunct}$${toLatex(core)}$${trailPunct}${trail}`;
  });

  return out.replace(
    PLACEHOLDER,
    (_, index: string) => stash[Number(index)] ?? "",
  );
}

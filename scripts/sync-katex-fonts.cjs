/**
 * Copies the local KaTeX fonts to public/ so the stylesheet can reference them
 * with absolute URLs.
 *
 * Why a copy: Turbopack merges the imported KaTeX stylesheet into the app CSS
 * and resolves `url(fonts/…)` against `src/app/`, which breaks the build. With
 * `url(/katex/fonts/…)` the URL is left untouched and served straight from
 * public/. `src/fonts/katex` stays the source of truth.
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const from = path.join(root, "src", "fonts", "katex", "fonts");
const to = path.join(root, "public", "katex", "fonts");

if (!fs.existsSync(from)) {
  console.error(`KaTeX fonts not found at ${from}`);
  process.exit(1);
}

fs.mkdirSync(to, { recursive: true });

let copied = 0;
for (const file of fs.readdirSync(from)) {
  if (!/\.(woff2?|ttf)$/i.test(file)) continue;
  fs.copyFileSync(path.join(from, file), path.join(to, file));
  copied++;
}

console.log(`synced ${copied} KaTeX fonts → public/katex/fonts`);

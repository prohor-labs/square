import type { ReactElement } from "react";

/**
 * Wraps the query words inside a result label in `<mark>`.
 *
 * Only the label's own text is ever rendered — no HTML from the database — so
 * a chapter name containing `<` is shown as text, never parsed.
 */
export function QbHighlight({
  text,
  term,
}: {
  readonly text: string;
  readonly term: string;
}): ReactElement {
  const tokens = term
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  if (tokens.length === 0) return <>{text}</>;

  const escaped = tokens.map((token) =>
    token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);
  const wanted = new Set(tokens.map((token) => token.toLowerCase()));

  return (
    <>
      {parts.map((part, index) =>
        wanted.has(part.toLowerCase()) ? (
          <mark
            // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional slices of one string
            key={index}
            className="rounded bg-primary/25 px-0.5 text-foreground"
          >
            {part}
          </mark>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional slices of one string
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

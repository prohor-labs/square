import type React from "react";
import type { Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { normalizeMath } from "@/lib/latex";
import { cn } from "@/lib/utils";

/**
 * The one plugin list every question renderer uses.
 *
 * `throwOnError: false` matters for imported sheets: a single malformed
 * expression then shows as red text instead of taking the whole question down.
 */
export const markdownRemarkPlugins: NonNullable<Options["remarkPlugins"]> = [
  remarkMath,
  remarkGfm,
  remarkBreaks,
];

export const markdownRehypePlugins: NonNullable<Options["rehypePlugins"]> = [
  rehypeRaw,
  [rehypeKatex, { throwOnError: false, strict: false, output: "html" }],
];

/**
 * Sanitizes and normalizes question / explanation text so that:
 * 1. CSV-escaped quotes like <img class=""qimg"" src=""https://..."" > become <img class="qimg" src="https://..." >
 * 2. Variant markdown image syntax like [!img](url) or [!img}(url) becomes ![](url)
 * 3. Standalone image URLs on their own line become ![](url)
 * 4. Plain-text maths (`A^-1`, `sqrt(x+1)`, `∠A`, `dy/dx`) becomes `$…$` LaTeX
 */
export function sanitizeQuestionContent(content?: string | null): string {
  if (!content) return "";
  let text = String(content).trim();

  // 1. Strip leading spaces on lines containing HTML tags so markdown doesn't parse them as code blocks
  text = text
    .split("\n")
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("<") || trimmed.startsWith("![")) {
        return trimmed;
      }
      return line;
    })
    .join("\n");

  // 2. Fix doubled quotes inside HTML tags: e.g. <img class=""qimg"" src=""https://..."" >
  text = text.replace(/(<[^>]+>)/g, (match) => match.replace(/""/g, '"'));

  // 3. Fix variants like [!img](url), [!img}(url), ![img}(url), [!image](url)
  text = text.replace(
    /\[!(?:img|image)[\]}]\((https?:\/\/[^\s)]+)\)/gi,
    "![]($1)",
  );
  text = text.replace(/!\[([^\]]*)\]\}\((https?:\/\/[^\s)]+)\)/gi, "![$1]($2)");

  // 4. Standalone image URL on its own line: convert to ![](url)
  text = text.replace(
    /^(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:\s*)$/gim,
    "![]($1)",
  );

  // 5. Plain maths → `$…$` (already-delimited maths is left alone).
  return normalizeMath(text);
}

/**
 * A standalone image column (`question_image`, `mcq_options.image`, …).
 *
 * Same look and zoom behaviour as images written inline in the text, so a
 * separate image column does not render differently from an embedded one.
 */
export function QuestionImage({
  src,
  alt,
  className,
  zoomable = true,
}: {
  readonly src?: string | null;
  readonly alt?: string;
  readonly className?: string;
  /** Off for images inside an option button — clicking should pick the option. */
  readonly zoomable?: boolean;
}) {
  if (!src) return null;

  if (!zoomable) {
    return (
      <span className="my-1 inline-block max-w-full align-middle">
        <img
          src={src}
          alt={alt || "Question Illustration"}
          loading="lazy"
          className={cn(
            "inline-block h-auto max-h-40 max-w-full rounded-xl border border-border/60 bg-background object-contain",
            className,
          )}
        />
      </span>
    );
  }

  const Image = markdownComponents.img;
  return <Image src={src} alt={alt} className={className} />;
}

/**
 * Custom ReactMarkdown components for proper image rendering and external links
 */
export const markdownComponents = {
  img: ({
    node,
    className,
    src,
    alt,
    ...props
  }: React.ComponentPropsWithoutRef<"img"> & { node?: unknown }) => {
    if (!src) return null;

    return (
      <span className="inline-block my-2 max-w-full overflow-hidden align-middle">
        <img
          src={src}
          alt={alt || "Question Illustration"}
          className={cn(
            "max-w-full h-auto max-h-[420px] rounded-xl border border-border/60 shadow-xs object-contain bg-background cursor-zoom-in hover:opacity-95 transition-all inline-block",
            className,
          )}
          loading="lazy"
          onClick={() => {
            const url = typeof src === "string" ? src : undefined;
            if (typeof window !== "undefined" && url) {
              window.open(url, "_blank", "noopener,noreferrer");
            }
          }}
          {...props}
        />
      </span>
    );
  },
  a: ({
    node,
    className,
    href,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"a"> & { node?: unknown }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-primary underline font-semibold hover:opacity-80",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  ),
};

"use client";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
  markdownComponents,
  sanitizeQuestionContent,
} from "@/lib/question-content";
import { cn } from "@/lib/utils";

/**
 * Question text and explanations as the rest of the site renders them: markdown
 * with LaTeX, KaTeX formulas, and the <img> tags the uploads carry.
 *
 * A client component because `markdownComponents` opens a lightbox on click,
 * which a server component cannot pass down.
 */
export function RichText({
  text,
  compact,
}: {
  readonly text: string;
  readonly compact?: boolean;
}) {
  return (
    <div
      className={cn("text-sm leading-relaxed [&_p]:m-0", compact && "text-xs")}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={markdownComponents}
      >
        {sanitizeQuestionContent(text)}
      </ReactMarkdown>
    </div>
  );
}

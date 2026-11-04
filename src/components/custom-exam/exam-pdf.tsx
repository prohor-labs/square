"use client";

import { useEffect, useRef, useState } from "react";
import type { Options } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { DocumentDownload } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { toBengaliDigits } from "@/lib/calendar-date";
import type { CustomExam, CustomExamQuestion } from "@/lib/qb-exam-types";
import {
  markdownRehypePlugins,
  markdownRemarkPlugins,
  sanitizeQuestionContent,
} from "@/lib/question-content";

/**
 * Exports a finished custom exam as an A4 PDF.
 *
 * The page is drawn in the browser and captured as a picture — jsPDF cannot
 * shape Bengali conjuncts, so text is never re-typeset. Layout is two passes:
 * measure every question at column width, then place whole blocks into sheets
 * so a question is never cut in half by a page break.
 */

const SHEET_WIDTH = 794;
const SHEET_HEIGHT = 1123;
const PAD_X = 40;
const PAD_TOP = 32;
const PAD_BOTTOM = 26;
const HEADER_HEIGHT = 50;
const HEADER_GAP = 12;
const FOOTER_HEIGHT = 24;
const COLUMN_GAP = 16;
const CONTENT_WIDTH = SHEET_WIDTH - PAD_X * 2;
const COLUMN_WIDTH = (CONTENT_WIDTH - COLUMN_GAP) / 2;
const BODY_HEIGHT =
  SHEET_HEIGHT -
  PAD_TOP -
  PAD_BOTTOM -
  HEADER_HEIGHT -
  HEADER_GAP -
  FOOTER_HEIGHT;
const BLOCK_GAP = 14;

const OPTION_KEYS = ["ক", "খ", "গ", "ঘ", "ঙ"];

/**
 * The on-screen renderer sets `loading="lazy"`, which never fires here: the
 * sheet sits off-screen, so the picture is never considered near the viewport
 * and the capture would wait on it forever. The PDF copy loads eagerly and
 * drops the zoom affordances that mean nothing on paper.
 */
const pdfMarkdownComponents: Options["components"] = {
  img: ({ src, alt }) => {
    if (!src) return null;
    return (
      // biome-ignore lint/performance/noImgElement: the canvas capture needs the raw element
      <img
        src={typeof src === "string" ? src : undefined}
        alt={alt || "প্রশ্নের চিত্র"}
        loading="eager"
        decoding="sync"
        style={{
          display: "block",
          margin: "4px 0",
          maxWidth: "100%",
          maxHeight: 340,
          height: "auto",
          objectFit: "contain",
        }}
      />
    );
  },
  a: ({ children }) => (
    <span style={{ color: "#1d4ed8", textDecoration: "underline" }}>
      {children}
    </span>
  ),
};

interface SheetLayout {
  readonly left: readonly number[];
  readonly right: readonly number[];
  /** A block too tall for one column gets a sheet of its own, full width. */
  readonly wide: number | null;
}

function buildSheets(heights: readonly number[]): SheetLayout[] {
  const sheets: SheetLayout[] = [];
  let left: number[] = [];
  let right: number[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  const flush = () => {
    if (left.length === 0 && right.length === 0) return;
    sheets.push({ left, right, wide: null });
    left = [];
    right = [];
    leftHeight = 0;
    rightHeight = 0;
  };

  heights.forEach((height, index) => {
    const needed = height + BLOCK_GAP;

    if (height > BODY_HEIGHT) {
      flush();
      sheets.push({ left: [], right: [], wide: index });
      return;
    }
    if (leftHeight + needed <= BODY_HEIGHT) {
      left.push(index);
      leftHeight += needed;
      return;
    }
    if (rightHeight + needed <= BODY_HEIGHT) {
      right.push(index);
      rightHeight += needed;
      return;
    }
    flush();
    left.push(index);
    leftHeight = needed;
  });

  flush();
  return sheets;
}

async function nextFrame(): Promise<void> {
  // rAF stalls in a background tab, so the wait carries its own fallback.
  await Promise.race([
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    ),
    new Promise<void>((resolve) => setTimeout(resolve, 120)),
  ]);
}

/** Fonts and pictures must be in place before the sheet is painted. */
const ASSET_TIMEOUT = 6000;

async function waitForAssets(root: HTMLElement | null): Promise<void> {
  if (!root) return;

  const pending = [...root.querySelectorAll("img")].filter(
    (image) => !(image.complete && image.naturalWidth > 0),
  );
  for (const image of pending) {
    // A picture marked lazy before it entered the DOM has to be told again,
    // otherwise it stays queued behind a viewport it will never reach.
    image.loading = "eager";
  }

  const images = Promise.all(
    pending.map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );

  // A host that never answers must not freeze the export, so the wait is capped.
  await Promise.race([
    Promise.all([document.fonts.ready, images]),
    new Promise<void>((resolve) => setTimeout(resolve, ASSET_TIMEOUT)),
  ]);
}

function PdfBlock({
  question,
  index,
}: {
  readonly question: CustomExamQuestion;
  readonly index: number;
}): React.ReactElement {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "10px 12px",
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 4,
          fontSize: 9.5,
          lineHeight: 1.35,
          fontWeight: 700,
          color: "#b91c1c",
        }}
      >
        প্রশ্ন {toBengaliDigits(index + 1)}
        {question.context.length > 0 ? (
          <span style={{ color: "#64748b", fontWeight: 600 }}>
            {" · "}
            {question.context.join(" · ")}
          </span>
        ) : null}
      </p>

      <div
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          fontWeight: 700,
          color: "#0f172a",
        }}
      >
        <ReactMarkdown
          remarkPlugins={markdownRemarkPlugins}
          rehypePlugins={markdownRehypePlugins}
          components={pdfMarkdownComponents}
        >
          {sanitizeQuestionContent(question.text)}
        </ReactMarkdown>
        {question.image ? (
          // biome-ignore lint/performance/noImgElement: the canvas capture needs the raw element
          <img
            src={question.image}
            alt="প্রশ্নের চিত্র"
            loading="eager"
            style={{ maxWidth: "100%", height: "auto", marginTop: 4 }}
          />
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px 10px",
          marginTop: 7,
        }}
      >
        {question.options.map((option, optionIndex) => (
          <div
            key={option.id}
            style={{
              display: "flex",
              gap: 6,
              fontSize: 12,
              lineHeight: 1.5,
              color: option.isCorrect ? "#047857" : "#1e293b",
              fontWeight: option.isCorrect ? 700 : 500,
            }}
          >
            <span style={{ flexShrink: 0 }}>
              {OPTION_KEYS[optionIndex] ?? optionIndex + 1}
              {")"}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <ReactMarkdown
                remarkPlugins={markdownRemarkPlugins}
                rehypePlugins={markdownRehypePlugins}
                components={pdfMarkdownComponents}
              >
                {sanitizeQuestionContent(option.text)}
              </ReactMarkdown>
              {option.image ? (
                // biome-ignore lint/performance/noImgElement: the canvas capture needs the raw element
                <img
                  src={option.image}
                  alt="অপশনের চিত্র"
                  loading="eager"
                  style={{ maxWidth: "100%", height: "auto", marginTop: 2 }}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {question.explanation || question.explanationImage ? (
        <div
          style={{
            marginTop: 7,
            padding: "7px 9px",
            borderTop: "1px dashed #cbd5e1",
            borderRadius: 6,
            backgroundColor: "#f8fafc",
            fontSize: 11.5,
            lineHeight: 1.5,
            color: "#334155",
          }}
        >
          <span style={{ fontWeight: 700, color: "#0f172a" }}>ব্যাখ্যা: </span>
          <div style={{ display: "inline" }}>
            <ReactMarkdown
              remarkPlugins={markdownRemarkPlugins}
              rehypePlugins={markdownRehypePlugins}
              components={pdfMarkdownComponents}
            >
              {sanitizeQuestionContent(question.explanation)}
            </ReactMarkdown>
          </div>
          {question.explanationImage ? (
            // biome-ignore lint/performance/noImgElement: the canvas capture needs the raw element
            <img
              src={question.explanationImage}
              alt="ব্যাখ্যার চিত্র"
              loading="eager"
              style={{ maxWidth: "100%", height: "auto", marginTop: 4 }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SheetChrome({
  title,
  total,
  minutes,
  negative,
}: {
  readonly title: string;
  readonly total: number;
  readonly minutes: number;
  readonly negative: number;
}): React.ReactElement {
  const date = new Date().toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* biome-ignore lint/performance/noImgElement: the canvas capture needs the raw element */}
      <img
        src="/brand.png"
        alt=""
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 400,
          transform: "translate(-50%, -50%)",
          opacity: 0.07,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", height: HEADER_HEIGHT }}>
        {/* Ribbon drawn as SVG: html2canvas renders polygons reliably, while
            clip-path on a div often comes out as a plain rectangle. */}
        <svg
          width={CONTENT_WIDTH}
          height={HEADER_HEIGHT}
          style={{ position: "absolute", left: 0, top: 0 }}
          aria-hidden="true"
        >
          <rect width={CONTENT_WIDTH} height={HEADER_HEIGHT} fill="#fdf3cf" />
          <polygon
            points={`0,0 440,0 424,${HEADER_HEIGHT} 0,${HEADER_HEIGHT}`}
            fill="#d32027"
          />
          <polygon
            points={`426,0 433,0 417,${HEADER_HEIGHT} 410,${HEADER_HEIGHT}`}
            fill="#fdf3cf"
          />
          <polygon
            points={`446,0 452,0 436,${HEADER_HEIGHT} 430,${HEADER_HEIGHT}`}
            fill="#d32027"
            opacity="0.9"
          />
          <rect
            x={448}
            y={HEADER_HEIGHT - 5}
            width={CONTENT_WIDTH - 448}
            height={1.6}
            fill="#d32027"
            opacity="0.55"
          />
          <polygon
            points={`${CONTENT_WIDTH - 22},0 ${CONTENT_WIDTH},0 ${CONTENT_WIDTH},${HEADER_HEIGHT} ${CONTENT_WIDTH - 10},${HEADER_HEIGHT}`}
            fill="#0b3d33"
          />
        </svg>

        <div
          style={{
            position: "absolute",
            left: 16,
            top: 0,
            width: 374,
            height: HEADER_HEIGHT,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 8.5,
              letterSpacing: "0.16em",
              fontWeight: 700,
              color: "#ffe9a8",
              textTransform: "uppercase",
            }}
          >
            স্কয়ার · কাস্টম এক্সাম
          </span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: "#ffffff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            right: 42,
            top: 0,
            height: HEADER_HEIGHT,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 2,
            color: "#7f1d1d",
          }}
        >
          <span style={{ fontSize: 10.5, fontWeight: 800 }}>
            প্রশ্ন {toBengaliDigits(total)} · সময় {toBengaliDigits(minutes)} মিনিট
          </span>
          <span style={{ fontSize: 8.5, fontWeight: 600, color: "#8a5a12" }}>
            {negative > 0
              ? `নেগেটিভ ${toBengaliDigits(negative)}`
              : "নেগেটিভ নেই"}{" "}
            · {date}
          </span>
        </div>
      </div>
    </>
  );
}

function SheetFooter({
  page,
  total,
}: {
  readonly page: number;
  readonly total: number;
}): React.ReactElement {
  return (
    <div
      style={{
        position: "absolute",
        left: PAD_X,
        right: PAD_X,
        bottom: 12,
        display: "flex",
        justifyContent: "space-between",
        fontSize: 9,
        color: "#64748b",
      }}
    >
      <span>স্কয়ার · অনলাইন প্রশ্নব্যাংক</span>
      <span>
        পৃষ্ঠা {toBengaliDigits(page)} / {toBengaliDigits(total)}
      </span>
    </div>
  );
}

export interface ExamPdfDownloadProps {
  readonly exam: CustomExam;
  readonly title: string;
  readonly fileName: string;
}

export function ExamPdfDownload({
  exam,
  title,
  fileName,
}: ExamPdfDownloadProps): React.ReactElement {
  const [phase, setPhase] = useState<"idle" | "measure" | "capture">("idle");
  const [layout, setLayout] = useState<SheetLayout[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const measureRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sheetRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (phase !== "measure") return;
    let cancelled = false;

    void (async () => {
      try {
        await waitForAssets(measureRef.current);
        await nextFrame();
        if (cancelled) return;

        const heights = exam.questions.map(
          (_, index) => blockRefs.current[index]?.offsetHeight ?? 0,
        );
        const sheets = buildSheets(heights);
        if (sheets.length === 0) {
          setError("PDF বানানোর জন্য কোনো প্রশ্ন পাওয়া যায়নি।");
          setPhase("idle");
          return;
        }
        setLayout(sheets);
        setPhase("capture");
      } catch {
        if (cancelled) return;
        setError("PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।");
        setPhase("idle");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, exam.questions]);

  useEffect(() => {
    if (phase !== "capture" || !layout) return;
    let cancelled = false;

    void (async () => {
      try {
        const pages = sheetRefs.current
          .slice(0, layout.length)
          .filter((page): page is HTMLDivElement => Boolean(page));
        await Promise.all(pages.map((page) => waitForAssets(page)));
        await nextFrame();

        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
          import("html2canvas-pro"),
          import("jspdf"),
        ]);

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        for (const [index, page] of pages.entries()) {
          if (cancelled) return;
          const canvas = await html2canvas(page, {
            backgroundColor: "#ffffff",
            // 3x keeps 12–14px text crisp once the sheet is laid on A4.
            scale: 3,
            useCORS: true,
            logging: false,
            imageTimeout: 20000,
          });
          const image = canvas.toDataURL("image/jpeg", 0.95);
          if (index > 0) pdf.addPage();
          pdf.addImage(image, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        }

        if (cancelled) return;
        const name = fileName.endsWith(".pdf")
          ? fileName
          : `${fileName}-${new Date().toISOString().slice(0, 10)}.pdf`;
        pdf.save(name);
      } catch {
        if (cancelled) return;
        setError(
          "PDF তৈরি করা যায়নি। ইন্টারনেট বা প্রশ্নের ছবির লিংক ঠিক আছে কিনা দেখে আবার চেষ্টা করুন।",
        );
      } finally {
        if (!cancelled) {
          setPhase("idle");
          setLayout(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, layout, fileName]);

  const busy = phase !== "idle";

  return (
    <div className="flex w-full flex-col gap-1.5 sm:w-auto">
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => {
          setError(null);
          setLayout(null);
          setPhase("measure");
        }}
        className="h-9 w-full rounded-xl text-xs font-bold sm:w-auto"
      >
        <DocumentDownload className="size-4" aria-hidden="true" />
        {busy ? "PDF তৈরি হচ্ছে…" : "PDF ডাউনলোড"}
      </Button>

      {error ? (
        <p
          role="alert"
          className="max-w-56 text-[10px] font-semibold leading-snug text-destructive"
        >
          {error}
        </p>
      ) : null}

      {phase === "measure" ? (
        <div
          ref={measureRef}
          aria-hidden="true"
          className="pdf-doc"
          style={{
            position: "fixed",
            left: -12000,
            top: 0,
            width: COLUMN_WIDTH,
            zIndex: -1,
          }}
        >
          {exam.questions.map((question, index) => (
            <div
              key={question.id}
              ref={(element) => {
                blockRefs.current[index] = element;
              }}
              style={{ width: COLUMN_WIDTH, marginBottom: BLOCK_GAP }}
            >
              <PdfBlock question={question} index={index} />
            </div>
          ))}
        </div>
      ) : null}

      {phase === "capture" && layout ? (
        <div
          aria-hidden="true"
          className="pdf-doc"
          style={{
            position: "fixed",
            left: -12000,
            top: 0,
            zIndex: -1,
          }}
        >
          {layout.map((sheet, sheetIndex) => {
            const firstIndex = sheet.wide ?? sheet.left[0] ?? sheet.right[0];
            return (
              <div
                key={firstIndex ?? `sheet-${sheetIndex}`}
                ref={(element) => {
                  sheetRefs.current[sheetIndex] = element;
                }}
                style={{
                  position: "relative",
                  width: SHEET_WIDTH,
                  height: SHEET_HEIGHT,
                  paddingTop: PAD_TOP,
                  paddingLeft: PAD_X,
                  paddingRight: PAD_X,
                  paddingBottom: PAD_BOTTOM,
                  backgroundColor: "#ffffff",
                  overflow: "hidden",
                }}
              >
                <SheetChrome
                  title={title}
                  total={exam.questions.length}
                  minutes={exam.minutes}
                  negative={exam.negative}
                />

                <div
                  style={{
                    display: "flex",
                    gap: COLUMN_GAP,
                    height: BODY_HEIGHT,
                    marginTop: HEADER_GAP,
                    overflow: "hidden",
                  }}
                >
                  {sheet.wide !== null ? (
                    <div style={{ width: CONTENT_WIDTH }}>
                      <PdfBlock
                        question={exam.questions[sheet.wide]}
                        index={sheet.wide}
                      />
                    </div>
                  ) : (
                    <>
                      <PdfColumn
                        items={sheet.left}
                        questions={exam.questions}
                      />
                      <PdfColumn
                        items={sheet.right}
                        questions={exam.questions}
                      />
                    </>
                  )}
                </div>

                <SheetFooter page={sheetIndex + 1} total={layout.length} />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function PdfColumn({
  items,
  questions,
}: {
  readonly items: readonly number[];
  readonly questions: readonly CustomExamQuestion[];
}): React.ReactElement {
  return (
    <div
      style={{
        width: COLUMN_WIDTH,
        display: "flex",
        flexDirection: "column",
        gap: BLOCK_GAP,
        overflow: "hidden",
      }}
    >
      {items.map((questionIndex) => (
        <PdfBlock
          key={questions[questionIndex].id}
          question={questions[questionIndex]}
          index={questionIndex}
        />
      ))}
    </div>
  );
}

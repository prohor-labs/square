"use client";

import { useId, useMemo, useState } from "react";
import {
  Copy,
  DocumentDownload,
  FileDown,
  FileText,
  TickCircle,
  Warning,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useImportQuestions } from "@/hooks/use-admin-qb";
import { parseQuestionsCsv } from "@/lib/csv-parser";
import type { ImportQuestionItem, QuestionStandard } from "@/types";

interface ImportQuestionsFormProps {
  readonly chapterId: string;
  readonly topicId?: string;
  readonly topicName?: string;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}

function cleanJsonInput(raw: string): string {
  // 1. Remove comments outside of strings
  let insideString = false;
  let escaping = false;
  let stage1 = "";

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (insideString) {
      stage1 += ch;
      if (escaping) {
        escaping = false;
      } else if (ch === "\\") {
        escaping = true;
      } else if (ch === '"') {
        insideString = false;
      }
      continue;
    }

    if (ch === '"') {
      insideString = true;
      stage1 += ch;
      continue;
    }

    if (ch === "/" && next === "*") {
      i += 2;
      while (i < raw.length && !(raw[i] === "*" && raw[i + 1] === "/")) {
        i++;
      }
      i++; // skip /
      continue;
    }

    if (ch === "/" && next === "/") {
      i += 2;
      while (i < raw.length && raw[i] !== "\n" && raw[i] !== "\r") {
        i++;
      }
      continue;
    }

    stage1 += ch;
  }

  // 2. Fix unescaped LaTeX backslashes & unescaped newlines inside strings
  let insideStr = false;
  let result = "";

  // Common LaTeX commands that start with standard JSON escape chars (t, f, b, r, n)
  const latexConflictRegex =
    /^(theta|text|tan|times|tau|to|top|textbf|textit|frac|forall|beta|bar|begin|bf|bold|bm|breve|bullet|rho|right|rangle|neq|nu|nabla|nearrow|not|newline)/i;

  for (let i = 0; i < stage1.length; i++) {
    const ch = stage1[i];

    if (!insideStr) {
      if (ch === '"') {
        insideStr = true;
      }
      result += ch;
      continue;
    }

    // Inside string
    if (ch === '"') {
      insideStr = false;
      result += ch;
      continue;
    }

    // Handle raw unescaped newlines inside string
    if (ch === "\n") {
      result += "\\n";
      continue;
    }
    if (ch === "\r") {
      continue;
    }

    if (ch === "\\") {
      const nextChar = stage1[i + 1];
      const remainder = stage1.slice(i + 1);

      if (nextChar === "\\") {
        result += "\\\\";
        i++;
        continue;
      }

      if (nextChar === '"' || nextChar === "/") {
        result += `\\${nextChar}`;
        i++;
        continue;
      }

      // Check Unicode \uXXXX
      if (
        nextChar === "u" &&
        /^[0-9a-fA-F]{4}/.test(stage1.slice(i + 2, i + 6))
      ) {
        result += `\\${stage1.slice(i + 1, i + 6)}`;
        i += 5;
        continue;
      }

      // Check if it's a LaTeX command starting with t, f, b, r, n
      if (
        (nextChar === "t" ||
          nextChar === "f" ||
          nextChar === "b" ||
          nextChar === "r" ||
          nextChar === "n") &&
        latexConflictRegex.test(remainder)
      ) {
        result += "\\\\";
        continue;
      }

      // If it's a standard standalone JSON escape
      if (
        (nextChar === "n" ||
          nextChar === "r" ||
          nextChar === "t" ||
          nextChar === "b" ||
          nextChar === "f") &&
        !/^[a-zA-Z]/.test(stage1.slice(i + 2, i + 3))
      ) {
        result += `\\${nextChar}`;
        i++;
        continue;
      }

      // Other backslashes in LaTeX (e.g. \v for \vec, \s for \sqrt)
      result += "\\\\";
      continue;
    }

    result += ch;
  }

  return result.trim();
}

const COMMENTED_SAMPLE_JSON_STRING = `/**
 * ═══════════════════════════════════════════════════════════════════════
 * SQUARE QUESTION BANK — JSON IMPORT SCHEMA & FORMAT GUIDE
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * HOW TO USE WITH AI (ChatGPT, Claude, DeepSeek):
 * Copy this entire template (including comments) and provide it to your AI along with raw questions.
 * The AI will read the field rules and format your questions into this exact JSON array.
 * 
 * SPECIFICATIONS FOR EVERY FIELD:
 * 
 * 1. "type" (String, REQUIRED):
 *    - "mcq" -> Multiple Choice Question (বহুনির্বাচনী প্রশ্ন)
 *    - "cq"  -> Creative / Structured Question (সৃজনশীল প্রশ্ন)
 * 
 * 2. "standard" (String, REQUIRED):
 *    Must be one of these 4 exact values:
 *    - "HSC"         -> Board exam & HSC college level
 *    - "Varsity"     -> University admission (DU, RU, JU, CU, GST, Agri)
 *    - "Engineering" -> Engineering admission (BUET, CK-RUET, IUT, BUTEX, MIST)
 *    - "Medical"     -> Medical & Dental admission (MAT, DAT)
 * 
 * 3. "source" (String, REQUIRED):
 *    Exam name, board name, university or year. Examples:
 *    - Board: "ঢাকা বোর্ড ২০২৩", "কুমিল্লা বোর্ড ২০২২", "রাজশাহী বোর্ড ২০২৩"
 *    - Engineering: "BUET 21-22", "CKRUET 22-23", "IUT 20-21", "BUTEX 19-20"
 *    - Varsity: "ঢাবি ২০-২১", "রাবি ২১-২২", "জাবি ২২-২৩", "গুচ্ছ ২১-২২"
 *    - Medical: "মেডিকেল ১৯-২০", "ম্যাট ২১-২২", "ডেন্টাল ২০-২১"
 *    - Custom: "Custom" (if no specific exam source is provided)
 * 
 * 4. "questionText" (String, REQUIRED):
 *    - For MCQ: The question stem.
 *    - For CQ:  The stimulus / context paragraph (উদ্দীপক).
 *    - LaTeX inline math: $formula$ (e.g. "$\\\\vec{A} \\\\cdot \\\\vec{B} = 0$")
 *    - LaTeX display math: $$ formula $$ or "$$\\\\n\\\\vec{A} = 2\\\\hat{i} + 3\\\\hat{j}\\\\n$$"
 *    - New lines / paragraphs: Use "\\n\\n" for paragraph breaks, "\\n" for single line breaks.
 *    - Markdown formatting: **bold**, *italic*, bullet lists, numbered lists are supported.
 * 
 * 5. "explanation" (String, OPTIONAL):
 *    - Detailed step-by-step solution, mathematical working, or theory explanation.
 *
 * 5b. "questionImage" / "explanationImage" (String URL, OPTIONAL):
 *    - Image shown under the question stem / under the explanation.
 *    - Either a URL or "" — the file is not embedded in the text.
 * 
 * 6. "mcqOptions" (Array of Objects, REQUIRED if type == "mcq"):
 *    - Exactly 4 options for standard MCQ.
 *    - "optionText": Text of option (supports LaTeX: "$\\\\vec{A} \\\\times \\\\vec{B}$").
 *    - "image": (Optional) URL of the option image; the text may be left empty.
 *    - "isCorrect": true for the 1 correct option, false for the other 3 distractors.
 *    - More than one option may be correct if the question allows it.
 * 
 * 7. "cqParts" (Array of 4 Objects, REQUIRED if type == "cq"):
 *    - "partKey": "a" (ক), "b" (খ), "c" (গ), "d" (ঘ)
 *    - "questionText": Question text for this part.
 *    - "answerText": (Optional) Model answer / solution.
 *    - "marks": Marks allocated: 1 for 'a', 2 for 'b', 3 for 'c', 4 for 'd'.
 * ═══════════════════════════════════════════════════════════════════════
 */
[
  // -------------------------------------------------------------
  // EXAMPLE 1: Board Standard MCQ (HSC Board)
  // -------------------------------------------------------------
  {
    "type": "mcq",                            // Question type: "mcq"
    "standard": "HSC",                        // Standard: "HSC" | "Varsity" | "Engineering" | "Medical"
    "source": "ঢাকা বোর্ড ২০২৩",              // Exam source: Board name and year
    "questionText": "দুটি ভেক্টর $\\\\vec{A}$ ও $\\\\vec{B}$ পরস্পর লম্ব হলে নিচের কোনটি সঠিক?", // Question stem with LaTeX
    "explanation": "দুটি ভেক্টর পরস্পর লম্ব হলে তাদের স্কেলার বা ডট গুণন শূন্য হয়, অর্থাৎ $\\\\vec{A} \\\\cdot \\\\vec{B} = 0$", // Explanation with LaTeX
    "mcqOptions": [
      { "optionText": "$\\\\vec{A} \\\\cdot \\\\vec{B} = 0$", "isCorrect": true },  // Correct answer (isCorrect: true)
      { "optionText": "$\\\\vec{A} \\\\times \\\\vec{B} = 0$", "isCorrect": false }, // Distractor 1
      { "optionText": "$\\\\vec{A} + \\\\vec{B} = 0$", "isCorrect": false },      // Distractor 2
      { "optionText": "$\\\\vec{A} - \\\\vec{B} = 0$", "isCorrect": false }       // Distractor 3
    ]
  },

  // -------------------------------------------------------------
  // EXAMPLE 2: Engineering Standard MCQ (BUET / CKRUET)
  // -------------------------------------------------------------
  {
    "type": "mcq",
    "standard": "Engineering",                // Standard: "Engineering"
    "source": "BUET 21-22",                   // Exam source: "BUET 21-22"
    "questionText": "যদি $\\\\vec{A} = 2\\\\hat{i} + 3\\\\hat{j} - \\\\hat{k}$ এবং $\\\\vec{B} = -\\\\hat{i} + 2\\\\hat{j} + 4\\\\hat{k}$ হয়, তবে $\\\\vec{A} \\\\cdot \\\\vec{B}$ এর মান কত?",
    "explanation": "ডট গুণনের সূত্রানুসারে:\\n$$\\\\vec{A} \\\\cdot \\\\vec{B} = A_x B_x + A_y B_y + A_z B_z$$\\n$$= (2)(-1) + (3)(2) + (-1)(4) = -2 + 6 - 4 = 0$$\\nঅতএব সঠিক মান $0$।",
    "mcqOptions": [
      { "optionText": "0", "isCorrect": true },
      { "optionText": "4", "isCorrect": false },
      { "optionText": "-2", "isCorrect": false },
      { "optionText": "6", "isCorrect": false }
    ]
  },

  // -------------------------------------------------------------
  // EXAMPLE 3: University Admission MCQ (Varsity)
  // -------------------------------------------------------------
  {
    "type": "mcq",
    "standard": "Varsity",                    // Standard: "Varsity"
    "source": "ঢাবি ২০-২১",                   // Exam source: "ঢাবি ২০-২১"
    "questionText": "কোনো ভেক্টর $\\\\vec{A}$ এর দিক বরাবর একক ভেক্টর কোনটি?",
    "explanation": "কোনো অশূন্য ভেক্টরকে তার মান দ্বারা ভাগ করলে ওই ভেক্টরের দিক বরাবর একক ভেক্টর পাওয়া যায়:\\n$$\\\\hat{a} = \\\\frac{\\\\vec{A}}{|\\\\vec{A}|}$$",
    "mcqOptions": [
      { "optionText": "$\\\\frac{\\\\vec{A}}{|\\\\vec{A}|}$", "isCorrect": true },
      { "optionText": "$\\\\vec{A} \\\\cdot |\\\\vec{A}|$", "isCorrect": false },
      { "optionText": "$\\\\frac{|\\\\vec{A}|}{\\\\vec{A}}$", "isCorrect": false },
      { "optionText": "$\\\\vec{A} \\\\times |\\\\vec{A}|$", "isCorrect": false }
    ]
  },

  // -------------------------------------------------------------
  // EXAMPLE 4: Medical Admission MCQ (Medical)
  // -------------------------------------------------------------
  {
    "type": "mcq",
    "standard": "Medical",                    // Standard: "Medical"
    "source": "মেডিকেল ১৯-২০",                // Exam source: "মেডিকেল ১৯-২০"
    "questionText": "স্কেলার গুণনের অপর নাম কী?",
    "explanation": "স্কেলার গুণনকে **ডট গুণন** (Dot Product) বলা হয়। কারণ দুটি ভেক্টরের স্কেলার গুণফল একটি স্কেলার রাশি।",
    "mcqOptions": [
      { "optionText": "ডট গুণন", "isCorrect": true },
      { "optionText": "ক্রস গুণন", "isCorrect": false },
      { "optionText": "ভেক্টর গুণন", "isCorrect": false },
      { "optionText": "মিশ্র গুণন", "isCorrect": false }
    ]
  },

  // -------------------------------------------------------------
  // EXAMPLE 5: Creative / Structured Question (CQ - সৃজনশীল)
  // -------------------------------------------------------------
  {
    "type": "cq",                             // Question type: "cq"
    "standard": "HSC",                        // Standard: "HSC"
    "source": "কুমিল্লা বোর্ড ২০২২",          // Exam source
    "questionText": "উদ্দীপক:\\nএকটি নদীতে স্রোতের বেগ $u = 3\\\\text{ km/h}$ এবং নৌকার বেগ $v = 6\\\\text{ km/h}$। নদীর প্রস্থ $d = 1.5\\\\text{ km}$।\\n\\nনৌকাটি নদী পার হওয়ার চেষ্টা করছে।", // CQ Stimulus / উদ্দীপক
    "explanation": "নদী পারাপারের গতিবিদ্যা ও ভেক্টর সংক্রান্ত সূত্রাবলী প্রয়োগ করতে হবে।",
    "cqParts": [
      {
        "partKey": "a",                       // (ক) জ্ঞানমূলক (Marks: 1)
        "questionText": "ভেক্টর কাকে বলে?",
        "answerText": "যে সকল ভৌত রাশিকে সম্পূর্ণরূপে প্রকাশ করার জন্য মান ও দিক উভয়ের প্রয়োজন হয়, তাদেরকে ভেক্টর রাশি বলে।",
        "marks": 1
      },
      {
        "partKey": "b",                       // (খ) অনুধাবনমূলক (Marks: 2)
        "questionText": "নাল ভেক্টরের দিক নির্দিষ্ট নয় কেন ব্যাখ্যা কর।",
        "answerText": "যে ভেক্টরের মান শূন্য তাকে নাল ভেক্টর বলে ($|\\\\vec{0}| = 0$)। এর আদি বিন্দু ও শেষ বিন্দু একই হওয়ায় এর কোনো নির্দিষ্ট দিক থাকে না।",
        "marks": 2
      },
      {
        "partKey": "c",                       // (গ) প্রয়োগমূলক (Marks: 3)
        "questionText": "নৌকাটির ক্ষুদ্রতম দূরত্বে অপর পাড়ে পৌঁছাতে কত কোণে রওনা হতে হবে?",
        "answerText": "ক্ষুদ্রতম দূরত্বের ক্ষেত্রে কোণ:\\n$$\\\\cos\\\\alpha = -\\\\frac{u}{v} = -\\\\frac{3}{6} = -0.5 \\\\implies \\\\alpha = 120^\\\\circ$$\\nঅতএব, $120^\\\\circ$ কোণে রওনা হতে হবে।",
        "marks": 3
      },
      {
        "partKey": "d",                       // (ঘ) উচ্চতর দক্ষতামূলক (Marks: 4)
        "questionText": "নৌকাটি যদি সর্বনিম্ন সময়ে নদী পার হতে চায়, তবে তার অতিক্রান্ত দূরত্ব কত হবে গাণিতিকভাবে বিশ্লেষণ কর।",
        "answerText": "সর্বনিম্ন সময়ে নদী পার হতে কোণ $\\\\alpha = 90^\\\\circ$ হতে হবে।\\nসময় $t = \\\\frac{d}{v} = \\\\frac{1.5}{6} = 0.25\\\\text{ hr}$\\nলব্ধি বেগ $w = \\\\sqrt{u^2 + v^2} = \\\\sqrt{3^2 + 6^2} = \\\\sqrt{45}\\\\text{ km/h}$\\nঅতিক্রান্ত দূরত্ব $s = w \\\\times t = \\\\sqrt{45} \\\\times 0.25 \\\\approx 1.677\\\\text{ km}$।",
        "marks": 4
      }
    ]
  }
]
`;

export function ImportQuestionsForm({
  chapterId,
  topicId,
  topicName,
  onSuccess,
  onCancel,
}: ImportQuestionsFormProps) {
  const fileInputId = useId();
  const [jsonText, setJsonText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const importMutation = useImportQuestions();

  const handleLoadSample = () => {
    setJsonText(COMMENTED_SAMPLE_JSON_STRING);
  };

  const copyTextSafely = async (text: string, e: React.MouseEvent) => {
    let success = false;
    if (typeof window !== "undefined") {
      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          success = true;
        } catch {
          success = false;
        }
      }

      if (!success) {
        try {
          const targetParent =
            (e.currentTarget as HTMLElement).closest("form") ||
            (e.currentTarget as HTMLElement).parentElement ||
            document.body;

          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.setAttribute("readonly", "");
          textArea.style.position = "absolute";
          textArea.style.left = "-9999px";
          textArea.style.top = "0";
          textArea.style.opacity = "0";
          targetParent.appendChild(textArea);
          textArea.focus({ preventScroll: true });
          textArea.select();
          textArea.setSelectionRange(0, text.length);
          success = document.execCommand("copy");
          targetParent.removeChild(textArea);
        } catch {
          success = false;
        }
      }
    }
    return success;
  };

  const handleCopySample = async (e: React.MouseEvent) => {
    const success = await copyTextSafely(COMMENTED_SAMPLE_JSON_STRING, e);
    if (!success) {
      setJsonText(COMMENTED_SAMPLE_JSON_STRING);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (fileName.endsWith(".csv") || file.type.includes("csv")) {
        const parsedCsv = parseQuestionsCsv(content);
        if (parsedCsv && parsedCsv.length > 0) {
          setJsonText(JSON.stringify(parsedCsv, null, 2));
        } else {
          setJsonText(content);
        }
      } else {
        setJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  const validation = useMemo(() => {
    const trimmed = jsonText.trim();
    if (!trimmed) {
      return { isValid: false, errors: [], questions: [], summary: null };
    }

    let parsed: unknown;

    // Check if input is CSV format (e.g. starts with questions, or contains comma separated header)
    if (
      !trimmed.startsWith("[") &&
      !trimmed.startsWith("{") &&
      trimmed.includes(",")
    ) {
      try {
        const parsedCsv = parseQuestionsCsv(trimmed);
        if (parsedCsv && parsedCsv.length > 0) {
          parsed = parsedCsv;
        }
      } catch {
        // fallback to json cleaner
      }
    }

    if (!parsed) {
      const cleaned = cleanJsonInput(trimmed);
      if (!cleaned) {
        return { isValid: false, errors: [], questions: [], summary: null };
      }

      try {
        parsed = JSON.parse(cleaned);
      } catch (err: unknown) {
        // Try parsing as CSV before failing
        try {
          const parsedCsv = parseQuestionsCsv(trimmed);
          if (parsedCsv && parsedCsv.length > 0) {
            parsed = parsedCsv;
          } else {
            throw err;
          }
        } catch {
          const msg =
            err instanceof Error ? err.message : "অবৈধ JSON বা CSV বিন্যাস";
          return {
            isValid: false,
            errors: [`ইনভ্যালিড ফরম্যাট (JSON/CSV): ${msg}`],
            questions: [],
            summary: null,
          };
        }
      }
    }

    if (!Array.isArray(parsed)) {
      return {
        isValid: false,
        errors: ["ডেটা একটি অ্যারে (Array) বা ভ্যালিড CSV ফাইল হতে হবে।"],
        questions: [],
        summary: null,
      };
    }

    if (parsed.length === 0) {
      return {
        isValid: false,
        errors: ["অ্যারেতে কোনো প্রশ্ন পাওয়া যায়নি।"],
        questions: [],
        summary: null,
      };
    }

    const errors: string[] = [];
    const validQuestions: ImportQuestionItem[] = [];
    let mcqCount = 0;
    let cqCount = 0;

    const itemsList = parsed as Array<Record<string, unknown>>;

    itemsList.forEach((item, idx) => {
      const qNum = idx + 1;
      if (typeof item !== "object" || item === null) {
        errors.push(`প্রশ্ন #${qNum}: সঠিক অবজেক্ট ফরম্যাট নয়।`);
        return;
      }

      const qText = String(
        item.questionText || item.question_text || "",
      ).trim();
      if (!qText) {
        errors.push(`প্রশ্ন #${qNum}: প্রশ্নের বিবরণ (questionText) খালি।`);
        return;
      }

      const rawType = String(item.type || "")
        .toLowerCase()
        .trim();
      let type: "mcq" | "cq" = "mcq";
      if (rawType === "cq" || rawType === "2") {
        type = "cq";
      } else if (rawType === "mcq" || rawType === "1" || !rawType) {
        type = "mcq";
      } else {
        errors.push(`প্রশ্ন #${qNum}: type অবশ্যই 'mcq' অথবা 'cq' হতে হবে।`);
        return;
      }

      const rawStandard = String(item.standard || "").trim();
      let standard: QuestionStandard = "HSC";
      const stdLower = rawStandard.toLowerCase();
      if (stdLower === "varsity") standard = "Varsity";
      else if (stdLower === "engineering") standard = "Engineering";
      else if (stdLower === "medical") standard = "Medical";
      else standard = "HSC";

      const source = String(item.source || "").trim() || "Custom";
      const explanation = String(item.explanation || "").trim();
      const questionImage =
        String(item.questionImage || item.question_image || "").trim() ||
        undefined;
      const explanationImage =
        String(item.explanationImage || item.explanation_image || "").trim() ||
        undefined;

      if (type === "mcq") {
        const rawOptions = (item.mcqOptions ||
          item.mcq_options ||
          item.options) as Array<Record<string, unknown>> | undefined;
        if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
          errors.push(
            `প্রশ্ন #${qNum} (MCQ): অন্তত ২টি অপশন (mcqOptions) থাকতে হবে।`,
          );
          return;
        }

        const formattedOptions = rawOptions.map((opt, optIdx: number) => ({
          optionText: String(
            opt.optionText || opt.option_text || opt.text || "",
          ).trim(),
          image: String(opt.image || opt.image_url || "").trim() || undefined,
          isCorrect: Boolean(opt.isCorrect ?? opt.is_correct ?? optIdx === 0),
        }));

        const emptyOpt = formattedOptions.some(
          (o) => !o.optionText && !o.image,
        );
        if (emptyOpt) {
          errors.push(`প্রশ্ন #${qNum} (MCQ): কোনো অপশন খালি রাখা যাবে না।`);
          return;
        }

        const hasCorrect = formattedOptions.some((o) => o.isCorrect);
        if (!hasCorrect) {
          // If none marked, default first option as correct
          formattedOptions[0].isCorrect = true;
        }

        validQuestions.push({
          type: "mcq",
          source,
          standard,
          questionText: qText,
          questionImage,
          explanation: explanation || undefined,
          explanationImage,
          mcqOptions: formattedOptions,
        });
        mcqCount++;
      } else {
        const rawParts = (item.cqParts || item.cq_parts || item.parts) as
          | Array<Record<string, unknown>>
          | undefined;
        if (!Array.isArray(rawParts) || rawParts.length === 0) {
          errors.push(
            `প্রশ্ন #${qNum} (CQ): অন্তত ১টি উপ-প্রশ্ন (cqParts) থাকতে হবে।`,
          );
          return;
        }

        const defaultKeys: Array<"a" | "b" | "c" | "d"> = ["a", "b", "c", "d"];
        const formattedParts = rawParts.map((pt, ptIdx: number) => ({
          partKey: (pt.partKey || pt.part_key || defaultKeys[ptIdx] || "a") as
            | "a"
            | "b"
            | "c"
            | "d",
          questionText: String(
            pt.questionText || pt.question_text || "",
          ).trim(),
          answerText:
            String(pt.answerText || pt.answer_text || "").trim() || undefined,
          marks: Number.parseInt(String(pt.marks || ""), 10) || ptIdx + 1,
        }));

        const emptyPart = formattedParts.some((p) => !p.questionText);
        if (emptyPart) {
          errors.push(`প্রশ্ন #${qNum} (CQ): উপ-প্রশ্নের বিবরণ খালি রাখা যাবে না।`);
          return;
        }

        validQuestions.push({
          type: "cq",
          source,
          standard,
          questionText: qText,
          questionImage,
          explanation: explanation || undefined,
          explanationImage,
          cqParts: formattedParts,
        });
        cqCount++;
      }
    });

    return {
      isValid: errors.length === 0 && validQuestions.length > 0,
      errors,
      questions: validQuestions,
      summary: {
        total: validQuestions.length,
        mcqCount,
        cqCount,
      },
    };
  }, [jsonText]);

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid || validation.questions.length === 0) return;

    importMutation.mutate(
      {
        chapterId,
        topicId,
        questionsList: validation.questions,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleImportSubmit}
      className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1"
    >
      {importMutation.error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs sm:text-sm text-destructive flex items-center gap-2">
          <Warning className="size-4 shrink-0" />
          <span>{importMutation.error.message}</span>
        </div>
      )}

      {/* Header Info & Format Actions */}
      <div className="flex flex-col gap-3 p-3.5 bg-muted/30 border border-border/60 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              {topicName ? `${topicName} এ ইমপোর্ট` : "প্রশ্ন ইমপোর্ট"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              MCQ এবং CQ উভয় ধরনের প্রশ্ন একসাথে ইমপোর্ট করতে পারবেন।
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              className="rounded-xl text-xs font-bold gap-1.5 hover:border-primary/50"
            >
              <FileText className="size-3.5 text-primary" />
              <span>নমুনা লোড করুন</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopySample}
              className="rounded-xl text-xs font-bold gap-1.5 hover:border-primary/50 text-primary border-primary/30 bg-primary/5"
            >
              {copied ? (
                <>
                  <TickCircle className="size-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    কপি হয়েছে!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>নমুনা JSON ও AI প্রম্পট কপি</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="border border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-4 flex items-center justify-between gap-4 bg-muted/15 transition-colors">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <FileDown className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              ফাইল আপলোড (.json / .csv)
            </span>
            <span className="text-[11px] text-muted-foreground">
              {"কম্পিউটার থেকে .json বা .csv ফাইল সিলেক্ট করুন বা ড্রপ করুন"}
            </span>
          </div>
        </div>

        <input
          type="file"
          id={fileInputId}
          accept=".json,.csv,application/json,text/csv"
          onChange={handleFileUpload}
          className="hidden"
        />

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => document.getElementById(fileInputId)?.click()}
          className="rounded-xl text-xs font-bold shrink-0 gap-1.5"
        >
          <DocumentDownload className="size-3.5" />
          <span>ফাইল সিলেক্ট (.json / .csv)</span>
        </Button>
      </div>

      {/* JSON / CSV Paste / Editor Area */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <FileText className="size-3.5 text-primary" />
            JSON বা CSV পেস্ট করুন বা এডিট করুন:
          </span>
          {jsonText && (
            <button
              type="button"
              onClick={() => setJsonText("")}
              className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              মুছে ফেলুন
            </button>
          )}
        </div>

        <Textarea
          rows={8}
          placeholder={`[
  {
    "type": "mcq",
    "source": "কুমিল্লা বোর্ড ২০২৩",
    "standard": "HSC",
    "questionText": "দুটি ভেক্টর লম্ব হলে ডট গুণন কত?",
    "mcqOptions": [
      { "optionText": "0", "isCorrect": true },
      { "optionText": "1", "isCorrect": false }
    ]
  }
]`}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="font-mono text-xs leading-relaxed rounded-xl bg-muted/10"
        />
      </div>

      {/* Validation Feedback */}
      {validation.errors.length > 0 && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs flex flex-col gap-1.5 text-destructive">
          <div className="flex items-center gap-1.5 font-bold">
            <Warning className="size-4 shrink-0" />
            <span>ভ্যালিডেশন এরর ({validation.errors.length}টি):</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] max-h-32 overflow-y-auto">
            {validation.errors.map((err) => (
              <li key={`err-${err}`}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.isValid && validation.summary && (
        <div className="flex flex-col gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-800 dark:text-emerald-300 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <TickCircle className="size-4 text-emerald-500 shrink-0" />
              ভ্যালিডেশন সম্পন্ন: মোট {validation.summary.total}টি প্রশ্ন প্রস্তুত
            </span>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span>MCQ: {validation.summary.mcqCount}টি</span>
              <span>•</span>
              <span>CQ: {validation.summary.cqCount}টি</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="text-[11px] text-emerald-700 dark:text-emerald-400 underline self-start cursor-pointer hover:opacity-80"
          >
            {isPreviewOpen ? "প্রিভিউ লুকান" : "প্রশ্নের প্রিভিউ দেখুন"}
          </button>

          {isPreviewOpen && (
            <div className="mt-1 flex flex-col gap-2 max-h-48 overflow-y-auto p-2 bg-background rounded-lg border text-foreground">
              {validation.questions.map((q) => (
                <div
                  key={`prev-${q.type}-${q.source ?? "custom"}-${q.questionText.slice(0, 30)}`}
                  className="p-2 rounded-md bg-muted/30 border border-border/50 text-[11px] flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-primary">
                      {q.type}
                    </span>
                    <span className="font-semibold text-xs">{q.source}</span>
                    {q.standard && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        • {q.standard}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 font-medium">{q.questionText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40 mt-1">
        <Button type="button" variant="outline" onClick={onCancel}>
          বাতিল
        </Button>
        <Button
          type="submit"
          disabled={!validation.isValid || importMutation.isPending}
          className="gap-2 font-bold"
        >
          {importMutation.isPending ? (
            <>
              <Spinner className="size-4" />
              <span>ইমপোর্ট হচ্ছে...</span>
            </>
          ) : (
            <span>
              {validation.summary
                ? `${validation.summary.total}টি প্রশ্ন ইমপোর্ট করুন`
                : "ইমপোর্ট করুন"}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}

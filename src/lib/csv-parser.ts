/**
 * Robust CSV Parser supporting quotes, multi-line values, commas, and BOM.
 */

export interface ParsedCsvQuestion {
  questionText: string;
  type: "mcq" | "cq";
  standard: "HSC" | "Varsity" | "Engineering" | "Medical";
  source: string;
  marks: number;
  questionImage?: string;
  explanation?: string;
  explanationImage?: string;
  /** Per-row classification typed in the sheet, e.g. paper / chapter / topic names. */
  subjectName?: string;
  paperName?: string;
  chapterName?: string;
  topicName?: string;
  mcqOptions?: Array<{
    optionText: string;
    isCorrect: boolean;
    image?: string;
  }>;
  cqParts?: Array<{
    partKey: "a" | "b" | "c" | "d";
    questionText: string;
    answerText?: string;
    marks: number;
  }>;
}

/**
 * Parse standard CSV string into array of rows (array of strings)
 */
export function parseCsvRows(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, ""); // Remove UTF-8 BOM if present
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++;
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Converts Bengali digits to English digits
 */
export function toEnglishDigits(str: string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let res = str;
  bnDigits.forEach((bn, idx) => {
    res = res.replaceAll(bn, String(idx));
  });
  return res;
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/[\s_\-.:()]/g, "")
    .trim();
}

const LETTER_TO_INDEX: Record<string, number> = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  e: 4,
  ক: 0,
  খ: 1,
  গ: 2,
  ঘ: 3,
  ঙ: 4,
};

/**
 * Reads the answer column into every correct option index.
 *
 * One answer is the common case ("2", "খ", "option3"), but a multi-answer
 * sheet writes them together — "A,C", "1;3", "ক গ" — and all of those marks
 * every listed option correct.
 */
function parseCorrectIndexes(
  rawAnswer: string,
  optionTexts: readonly string[],
): number[] {
  const cleaned = toEnglishDigits(rawAnswer.trim().toLowerCase());
  if (!cleaned) return [];

  const found = new Set<number>();
  const tokens = cleaned.split(/[,;|/\\&+\s]+/).filter(Boolean);

  for (const token of tokens) {
    const optMatch = token.match(/^opt(?:ion)?\s*([1-9])$/);
    if (optMatch) {
      found.add(Number(optMatch[1]) - 1);
      continue;
    }
    if (/^[1-9]$/.test(token)) {
      found.add(Number(token) - 1);
      continue;
    }
    if (token in LETTER_TO_INDEX) {
      found.add(LETTER_TO_INDEX[token]);
    }
  }

  const inRange = [...found].filter(
    (idx) => idx >= 0 && idx < Math.max(optionTexts.length, 1),
  );
  if (inRange.length > 0) return inRange.sort((a, b) => a - b);

  // Last resort: the answer is the option text itself, whole or per token.
  const textMatch = optionTexts.findIndex(
    (opt) => opt.trim().toLowerCase() === cleaned,
  );
  if (textMatch >= 0) return [textMatch];

  for (const token of tokens) {
    const idx = optionTexts.findIndex(
      (opt) => opt.trim().toLowerCase() === token,
    );
    if (idx >= 0) found.add(idx);
  }
  return [...found].sort((a, b) => a - b);
}

/**
 * Parses CSV text matching the standard format:
 * Header columns:
 * questions/question/questionText, option1, option2, option3, option4, [option5], answer/correctOption, explanation/solution, type, section/source, standard, marks
 */
export function parseQuestionsCsv(csvText: string): ParsedCsvQuestion[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  const rawHeaders = rows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);
  const usedCols = new Set<number>();

  // Definition of exact and prefix/contains aliases for each column
  const colDefinitions: Array<{
    key: string;
    exactAliases: string[];
    prefixAliases?: string[];
  }> = [
    {
      key: "questionImage",
      exactAliases: [
        "questionimage",
        "qimage",
        "questionimg",
        "প্রশ্নেরছবি",
        "ছবি",
      ],
    },
    {
      key: "opt1Image",
      exactAliases: ["option1image", "opt1image", "option1img", "image1"],
    },
    {
      key: "opt2Image",
      exactAliases: ["option2image", "opt2image", "option2img", "image2"],
    },
    {
      key: "opt3Image",
      exactAliases: ["option3image", "opt3image", "option3img", "image3"],
    },
    {
      key: "opt4Image",
      exactAliases: ["option4image", "opt4image", "option4img", "image4"],
    },
    {
      key: "opt5Image",
      exactAliases: ["option5image", "opt5image", "option5img", "image5"],
    },
    {
      key: "explanationImage",
      exactAliases: [
        "explanationimage",
        "expimage",
        "explanationimg",
        "solutionimage",
        "ব্যাখ্যারছবি",
      ],
    },
    {
      key: "subjectName",
      exactAliases: ["subjectname", "subject", "বিষয়", "বিষয়"],
    },
    {
      key: "paperName",
      exactAliases: ["papername", "paper"],
    },
    {
      key: "chapterName",
      exactAliases: ["chaptername", "chapter", "অধ্যায়", "অধ্যায়"],
    },
    {
      key: "topicName",
      exactAliases: ["topicname", "topic", "subtopic", "টপিক", "টপিকনাম"],
    },
    {
      key: "question",
      exactAliases: [
        "question",
        "questions",
        "questiontext",
        "qtext",
        "stem",
        "q",
        "প্রশ্ন",
        "প্রশ্নবাউদ্দীপক",
        "উদ্দীপক",
      ],
      prefixAliases: ["question", "প্রশ্ন"],
    },
    {
      key: "opt1",
      exactAliases: [
        "option1",
        "opt1",
        "optiona",
        "opta",
        "a",
        "ক",
        "অপশন১",
        "অপশনক",
        "option1a",
      ],
      prefixAliases: ["option1", "opt1", "optiona", "অপশন১", "অপশনক"],
    },
    {
      key: "opt2",
      exactAliases: [
        "option2",
        "opt2",
        "optionb",
        "optb",
        "b",
        "খ",
        "অপশন২",
        "অপশনখ",
        "option2b",
      ],
      prefixAliases: ["option2", "opt2", "optionb", "অপশন২", "অপশনখ"],
    },
    {
      key: "opt3",
      exactAliases: [
        "option3",
        "opt3",
        "optionc",
        "optc",
        "c",
        "গ",
        "অপশন৩",
        "অপশনগ",
        "option3c",
      ],
      prefixAliases: ["option3", "opt3", "optionc", "অপশন৩", "অপশনগ"],
    },
    {
      key: "opt4",
      exactAliases: [
        "option4",
        "opt4",
        "optiond",
        "optd",
        "d",
        "ঘ",
        "অপশন৪",
        "অপশনঘ",
        "option4d",
      ],
      prefixAliases: ["option4", "opt4", "optiond", "অপশন৪", "অপশনঘ"],
    },
    {
      key: "opt5",
      exactAliases: [
        "option5",
        "opt5",
        "optione",
        "opte",
        "e",
        "ঙ",
        "অপশন৫",
        "অপশনঙ",
        "option5e",
      ],
      prefixAliases: ["option5", "opt5", "optione", "অপশন৫", "অপশনঙ"],
    },
    {
      key: "answer",
      exactAliases: [
        "answer",
        "ans",
        "correct",
        "correctoption",
        "correctoptions",
        "correctans",
        "correctanswer",
        "correctanswers",
        "correctindex",
        "correctidx",
        "rightans",
        "rightanswer",
        "key",
        "উত্তর",
        "সঠিকউত্তর",
        "সঠিকঅপশন",
      ],
      prefixAliases: ["correct", "answer", "উত্তর", "সঠিক"],
    },
    {
      key: "explanation",
      exactAliases: [
        "explanation",
        "exp",
        "solution",
        "sol",
        "solve",
        "ব্যাখ্যা",
        "সমাধান",
      ],
      prefixAliases: ["explanation", "solution", "ব্যাখ্যা", "সমাধান"],
    },
    {
      key: "type",
      exactAliases: [
        "type",
        "qtype",
        "questiontype",
        "typename",
        "ধরণ",
        "ধরন",
        "টাইপ",
      ],
      prefixAliases: ["questiontype", "qtype"],
    },
    {
      key: "source",
      exactAliases: [
        "source",
        "section",
        "tag",
        "tags",
        "topic",
        "উৎস",
        "ট্যাগ",
        "সেকশন",
      ],
      prefixAliases: ["source", "section", "topic"],
    },
    {
      key: "standard",
      exactAliases: ["standard", "std", "level", "মান"],
      prefixAliases: ["standard"],
    },
    {
      key: "marks",
      exactAliases: ["marks", "mark", "point", "points", "মার্কস", "মার্ক", "নম্বর"],
      prefixAliases: ["mark"],
    },
  ];

  const colMap: Record<string, number> = {};

  // Pass 1: Exact matches
  for (const def of colDefinitions) {
    const idx = normalizedHeaders.findIndex(
      (nh, i) => !usedCols.has(i) && def.exactAliases.includes(nh),
    );
    if (idx !== -1) {
      colMap[def.key] = idx;
      usedCols.add(idx);
    }
  }

  // Pass 2: Prefix / contains matches for multi-character keywords
  for (const def of colDefinitions) {
    if (colMap[def.key] !== undefined) continue;
    if (!def.prefixAliases || def.prefixAliases.length === 0) continue;

    const idx = normalizedHeaders.findIndex(
      (nh, i) =>
        !usedCols.has(i) &&
        def.prefixAliases!.some(
          (prefix) => prefix.length >= 3 && nh.includes(prefix),
        ),
    );
    if (idx !== -1) {
      colMap[def.key] = idx;
      usedCols.add(idx);
    }
  }

  const qCol = colMap.question !== undefined ? colMap.question : 0;
  const opt1Col = colMap.opt1 !== undefined ? colMap.opt1 : -1;
  const opt2Col = colMap.opt2 !== undefined ? colMap.opt2 : -1;
  const opt3Col = colMap.opt3 !== undefined ? colMap.opt3 : -1;
  const opt4Col = colMap.opt4 !== undefined ? colMap.opt4 : -1;
  const opt5Col = colMap.opt5 !== undefined ? colMap.opt5 : -1;
  const ansCol = colMap.answer !== undefined ? colMap.answer : -1;
  const expCol = colMap.explanation !== undefined ? colMap.explanation : -1;
  const typeCol = colMap.type !== undefined ? colMap.type : -1;
  const secCol = colMap.source !== undefined ? colMap.source : -1;
  const stdCol = colMap.standard !== undefined ? colMap.standard : -1;
  const marksCol = colMap.marks !== undefined ? colMap.marks : -1;
  const qImgCol =
    colMap.questionImage !== undefined ? colMap.questionImage : -1;
  const optImgCols = [
    colMap.opt1Image,
    colMap.opt2Image,
    colMap.opt3Image,
    colMap.opt4Image,
    colMap.opt5Image,
  ].map((c) => (c !== undefined ? c : -1));
  const expImgCol =
    colMap.explanationImage !== undefined ? colMap.explanationImage : -1;
  const paperCol = colMap.paperName !== undefined ? colMap.paperName : -1;
  const subjectCol = colMap.subjectName !== undefined ? colMap.subjectName : -1;
  const chapterCol = colMap.chapterName !== undefined ? colMap.chapterName : -1;
  const topicCol = colMap.topicName !== undefined ? colMap.topicName : -1;

  const results: ParsedCsvQuestion[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const questionText =
      (qCol >= 0 && qCol < row.length ? row[qCol] : row[0]) || "";
    if (!questionText.trim()) continue;

    const rawAns = ansCol >= 0 && ansCol < row.length ? row[ansCol] || "" : "";

    const cleanHtmlContent = (t: string) => {
      if (!t) return "";
      let s = t.trim();
      s = s
        .split("\n")
        .map((l) => (l.trimStart().startsWith("<") ? l.trimStart() : l))
        .join("\n");
      return s.replace(/(<[^>]+>)/g, (m) => m.replace(/""/g, '"'));
    };

    // Collect options together with their images, keeping the letters in sync.
    const rawOptions: Array<{ text: string; image: string }> = [];
    const optionCols = [opt1Col, opt2Col, opt3Col, opt4Col, opt5Col];
    for (let i = 0; i < 5; i++) {
      const col = optionCols[i];
      const imgCol = optImgCols[i];
      const text = col >= 0 && col < row.length ? (row[col] || "").trim() : "";
      const image =
        imgCol >= 0 && imgCol < row.length ? (row[imgCol] || "").trim() : "";
      // An option may be image-only, so either half is enough to keep it.
      if (text || image) rawOptions.push({ text, image });
    }

    // Fallback: If no option columns were found by header, read positional columns after question column
    if (rawOptions.length === 0 && row.length >= 5) {
      for (let i = 1; i <= 4; i++) {
        if (row[i] !== undefined && row[i].trim() !== "")
          rawOptions.push({ text: row[i], image: "" });
      }
      if (row.length >= 7 && row[5] !== undefined && row[5].trim() !== "") {
        rawOptions.push({ text: row[5], image: "" });
      }
    }

    const optionTexts = rawOptions.map((o) => cleanHtmlContent(o.text.trim()));
    const correctIndexes = parseCorrectIndexes(rawAns, optionTexts);
    // A sheet that leaves the answer blank still needs one correct option.
    if (correctIndexes.length === 0 && optionTexts.length > 0) {
      correctIndexes.push(0);
    }

    const mcqOptions = rawOptions.map((opt, idx) => ({
      optionText: cleanHtmlContent(opt.text.trim()),
      image: opt.image ? cleanHtmlContent(opt.image) : undefined,
      isCorrect: correctIndexes.includes(idx),
    }));

    const rawType = (typeCol >= 0 && typeCol < row.length ? row[typeCol] : "")
      .trim()
      .toLowerCase();
    const resolvedType: "mcq" | "cq" = rawType === "cq" ? "cq" : "mcq";

    const rawStd = (stdCol >= 0 && stdCol < row.length ? row[stdCol] : "")
      .trim()
      .toLowerCase();
    let resolvedStd: "HSC" | "Varsity" | "Engineering" | "Medical" = "HSC";
    if (rawStd.includes("varsity") || rawStd.includes("ভার্সিটি"))
      resolvedStd = "Varsity";
    else if (
      rawStd.includes("engineering") ||
      rawStd.includes("ইঞ্জিনিয়ারিং") ||
      rawStd.includes("ইঞ্জিনিয়ারিং")
    )
      resolvedStd = "Engineering";
    else if (rawStd.includes("medical") || rawStd.includes("মেডিকেল"))
      resolvedStd = "Medical";

    const explanation =
      expCol >= 0 && expCol < row.length && row[expCol]
        ? cleanHtmlContent(row[expCol])
        : undefined;
    const source =
      (secCol >= 0 && secCol < row.length ? row[secCol] : "")?.trim() || "";
    const rawMarks =
      marksCol >= 0 && marksCol < row.length
        ? parseInt(toEnglishDigits(row[marksCol]), 10)
        : 1;
    const marks = isNaN(rawMarks) || rawMarks <= 0 ? 1 : rawMarks;

    const cellText = (col: number) =>
      col >= 0 && col < row.length ? (row[col] || "").trim() : "";
    const questionImage = cellText(qImgCol);
    const explanationImage = cellText(expImgCol);
    const subjectName = cellText(subjectCol);
    const paperName = cellText(paperCol);
    const chapterName = cellText(chapterCol);
    const topicName = cellText(topicCol);

    results.push({
      questionText: cleanHtmlContent(questionText.trim()),
      questionImage: questionImage
        ? cleanHtmlContent(questionImage)
        : undefined,
      type: resolvedType,
      standard: resolvedStd,
      source,
      marks,
      explanation,
      explanationImage: explanationImage
        ? cleanHtmlContent(explanationImage)
        : undefined,
      subjectName: subjectName || undefined,
      paperName: paperName || undefined,
      chapterName: chapterName || undefined,
      topicName: topicName || undefined,
      mcqOptions: resolvedType === "mcq" ? mcqOptions : undefined,
    });
  }

  return results;
}

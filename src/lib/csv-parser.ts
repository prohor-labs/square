/**
 * Robust CSV Parser supporting quotes, multi-line values, commas, and BOM.
 */

export interface ParsedCsvQuestion {
  questionText: string;
  type: "mcq" | "cq";
  standard: "HSC" | "Varsity" | "Engineering" | "Medical";
  source: string;
  marks: number;
  explanation?: string;
  mcqOptions?: Array<{
    optionText: string;
    isCorrect: boolean;
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
  return h.toLowerCase().replace(/[\s_\-.:()]/g, "").trim();
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
        "correctans",
        "correctanswer",
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
      exactAliases: ["type", "qtype", "questiontype", "ধরণ", "ধরন", "টাইপ"],
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
      (nh, i) => !usedCols.has(i) && def.exactAliases.includes(nh)
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
        def.prefixAliases!.some((prefix) => prefix.length >= 3 && nh.includes(prefix))
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

  const results: ParsedCsvQuestion[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const questionText = (qCol >= 0 && qCol < row.length ? row[qCol] : row[0]) || "";
    if (!questionText.trim()) continue;

    const rawAns = ansCol >= 0 && ansCol < row.length ? row[ansCol] || "" : "";
    const cleanAns = toEnglishDigits(rawAns.trim().toLowerCase());

    // Collect options accurately
    const rawOptions: string[] = [];
    if (opt1Col >= 0 && opt1Col < row.length && row[opt1Col] !== undefined && row[opt1Col].trim() !== "") {
      rawOptions.push(row[opt1Col]);
    }
    if (opt2Col >= 0 && opt2Col < row.length && row[opt2Col] !== undefined && row[opt2Col].trim() !== "") {
      rawOptions.push(row[opt2Col]);
    }
    if (opt3Col >= 0 && opt3Col < row.length && row[opt3Col] !== undefined && row[opt3Col].trim() !== "") {
      rawOptions.push(row[opt3Col]);
    }
    if (opt4Col >= 0 && opt4Col < row.length && row[opt4Col] !== undefined && row[opt4Col].trim() !== "") {
      rawOptions.push(row[opt4Col]);
    }
    if (opt5Col >= 0 && opt5Col < row.length && row[opt5Col] !== undefined && row[opt5Col].trim() !== "") {
      rawOptions.push(row[opt5Col]);
    }

    // Fallback: If no option columns were found by header, read positional columns after question column
    if (rawOptions.length === 0 && row.length >= 5) {
      for (let i = 1; i <= 4; i++) {
        if (row[i] !== undefined && row[i].trim() !== "") rawOptions.push(row[i]);
      }
      if (row.length >= 7 && row[5] !== undefined && row[5].trim() !== "") {
        rawOptions.push(row[5]);
      }
    }

    // Determine correct index (1-based, letter, or text match)
    let correctIdx = -1;
    if (cleanAns === "1" || cleanAns === "a" || cleanAns === "ক" || cleanAns === "opt1" || cleanAns === "option1") correctIdx = 0;
    else if (cleanAns === "2" || cleanAns === "b" || cleanAns === "খ" || cleanAns === "opt2" || cleanAns === "option2") correctIdx = 1;
    else if (cleanAns === "3" || cleanAns === "c" || cleanAns === "গ" || cleanAns === "opt3" || cleanAns === "option3") correctIdx = 2;
    else if (cleanAns === "4" || cleanAns === "d" || cleanAns === "ঘ" || cleanAns === "opt4" || cleanAns === "option4") correctIdx = 3;
    else if (cleanAns === "5" || cleanAns === "e" || cleanAns === "ঙ" || cleanAns === "opt5" || cleanAns === "option5") correctIdx = 4;
    else {
      const parsedNum = parseInt(cleanAns, 10);
      if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= rawOptions.length) {
        correctIdx = parsedNum - 1;
      }
    }

    // Determine correct option by exact text match if not index
    if (correctIdx === -1 && rawAns) {
      const matchIdx = rawOptions.findIndex(
        (o) => o.trim().toLowerCase() === rawAns.trim().toLowerCase()
      );
      if (matchIdx >= 0) correctIdx = matchIdx;
    }
    if (correctIdx === -1) correctIdx = 0; // Default to first option

    const cleanHtmlContent = (t: string) => {
      if (!t) return "";
      let s = t.trim();
      s = s
        .split("\n")
        .map((l) => (l.trimStart().startsWith("<") ? l.trimStart() : l))
        .join("\n");
      return s.replace(/(<[^>]+>)/g, (m) => m.replace(/""/g, '"'));
    };

    const mcqOptions = rawOptions.map((opt, idx) => ({
      optionText: cleanHtmlContent(opt.trim()),
      isCorrect: idx === correctIdx,
    }));

    const rawType = (typeCol >= 0 && typeCol < row.length ? row[typeCol] : "").trim().toLowerCase();
    const resolvedType: "mcq" | "cq" = rawType === "cq" ? "cq" : "mcq";

    const rawStd = (stdCol >= 0 && stdCol < row.length ? row[stdCol] : "").trim().toLowerCase();
    let resolvedStd: "HSC" | "Varsity" | "Engineering" | "Medical" = "HSC";
    if (rawStd.includes("varsity") || rawStd.includes("ভার্সিটি")) resolvedStd = "Varsity";
    else if (rawStd.includes("engineering") || rawStd.includes("ইঞ্জিনিয়ারিং") || rawStd.includes("ইঞ্জিনিয়ারিং")) resolvedStd = "Engineering";
    else if (rawStd.includes("medical") || rawStd.includes("মেডিকেল")) resolvedStd = "Medical";

    const explanation =
      expCol >= 0 && expCol < row.length && row[expCol]
        ? cleanHtmlContent(row[expCol])
        : undefined;
    const source = (secCol >= 0 && secCol < row.length ? row[secCol] : "")?.trim() || "";
    const rawMarks =
      marksCol >= 0 && marksCol < row.length ? parseInt(toEnglishDigits(row[marksCol]), 10) : 1;
    const marks = isNaN(rawMarks) || rawMarks <= 0 ? 1 : rawMarks;

    results.push({
      questionText: cleanHtmlContent(questionText.trim()),
      type: resolvedType,
      standard: resolvedStd,
      source,
      marks,
      explanation,
      mcqOptions: resolvedType === "mcq" ? mcqOptions : undefined,
    });
  }

  return results;
}

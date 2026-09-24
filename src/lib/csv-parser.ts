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

/**
 * Parses CSV text matching the standard format:
 * Header columns:
 * questions/question/questionText, option1, option2, option3, option4, [option5], answer/correctOption, explanation/solution, type, section/source, standard, marks
 */
export function parseQuestionsCsv(csvText: string): ParsedCsvQuestion[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.toLowerCase().trim());

  // Helper to find column index
  const findCol = (...names: string[]) => {
    return header.findIndex((h) => names.some((n) => h === n || h.includes(n)));
  };

  const qCol = findCol(
    "question",
    "questions",
    "questiontext",
    "question_text",
    "q",
    "প্রশ্ন",
  );
  const opt1Col = findCol(
    "option1",
    "option_1",
    "option 1",
    "opt1",
    "opt_1",
    "optiona",
    "option_a",
    "option a",
    "a",
    "অপশন ১",
    "অপশন ১:",
    "অপশন ক",
    "ক",
  );
  const opt2Col = findCol(
    "option2",
    "option_2",
    "option 2",
    "opt2",
    "opt_2",
    "optionb",
    "option_b",
    "option b",
    "b",
    "অপশন ২",
    "অপশন ২:",
    "অপশন খ",
    "খ",
  );
  const opt3Col = findCol(
    "option3",
    "option_3",
    "option 3",
    "opt3",
    "opt_3",
    "optionc",
    "option_c",
    "option c",
    "c",
    "অপশন ৩",
    "অপশন ৩:",
    "অপশন গ",
    "গ",
  );
  const opt4Col = findCol(
    "option4",
    "option_4",
    "option 4",
    "opt4",
    "opt_4",
    "optiond",
    "option_d",
    "option d",
    "d",
    "অপশন ৪",
    "অপশন ৪:",
    "অপশন ঘ",
    "ঘ",
  );
  const opt5Col = findCol(
    "option5",
    "option_5",
    "option 5",
    "opt5",
    "opt_5",
    "optione",
    "option_e",
    "option e",
    "e",
    "অপশন ৫",
    "অপশন ৫:",
    "অপশন ঙ",
    "ঙ",
  );
  const ansCol = findCol(
    "answer",
    "correct",
    "correctoption",
    "correct_option",
    "correctindex",
    "correct_index",
    "correctidx",
    "correct_idx",
    "correct_ans",
    "correctans",
    "ans",
    "উত্তর",
    "সঠিক উত্তর",
  );
  const expCol = findCol(
    "explanation",
    "solution",
    "exp",
    "ব্যাখ্যা",
    "সমাধান",
  );
  const typeCol = findCol("type", "ধরণ", "ধরন");
  const secCol = findCol("section", "source", "উৎস");
  const stdCol = findCol("standard", "মান");
  const marksCol = findCol("marks", "মার্কস", "মার্ক");

  const results: ParsedCsvQuestion[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const questionText = (qCol >= 0 ? row[qCol] : row[0]) || "";
    if (!questionText.trim()) continue;

    const rawAns = ansCol >= 0 ? row[ansCol] || "" : "";
    const cleanAns = toEnglishDigits(rawAns.trim().toLowerCase());
    
    // Determine 1-based or 0-based or direct text answer
    let correctIdx = -1;
    if (cleanAns === "1" || cleanAns === "a" || cleanAns === "ক" || cleanAns === "opt1") correctIdx = 0;
    else if (cleanAns === "2" || cleanAns === "b" || cleanAns === "খ" || cleanAns === "opt2") correctIdx = 1;
    else if (cleanAns === "3" || cleanAns === "c" || cleanAns === "গ" || cleanAns === "opt3") correctIdx = 2;
    else if (cleanAns === "4" || cleanAns === "d" || cleanAns === "ঘ" || cleanAns === "opt4") correctIdx = 3;
    else if (cleanAns === "5" || cleanAns === "e" || cleanAns === "ঙ" || cleanAns === "opt5") correctIdx = 4;
    else {
      const parsedNum = parseInt(cleanAns, 10);
      if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 5) {
        correctIdx = parsedNum - 1;
      }
    }

    // Collect options
    const rawOptions: string[] = [];
    if (opt1Col >= 0 && row[opt1Col]) rawOptions.push(row[opt1Col]);
    if (opt2Col >= 0 && row[opt2Col]) rawOptions.push(row[opt2Col]);
    if (opt3Col >= 0 && row[opt3Col]) rawOptions.push(row[opt3Col]);
    if (opt4Col >= 0 && row[opt4Col]) rawOptions.push(row[opt4Col]);
    if (opt5Col >= 0 && row[opt5Col]) rawOptions.push(row[opt5Col]);

    // If options weren't found by named header, fallback to positions 1..5
    if (rawOptions.length === 0 && row.length >= 5) {
      for (let i = 1; i <= 4; i++) {
        if (row[i]) rawOptions.push(row[i]);
      }
      if (row[5] && row.length > 6) rawOptions.push(row[5]);
    }

    // Determine correct option by text match if not index
    if (correctIdx === -1 && rawAns) {
      const matchIdx = rawOptions.findIndex((o) => o.trim().toLowerCase() === rawAns.trim().toLowerCase());
      if (matchIdx >= 0) correctIdx = matchIdx;
    }
    if (correctIdx === -1) correctIdx = 0; // default to first option

    const mcqOptions = rawOptions.map((opt, idx) => ({
      optionText: opt.trim(),
      isCorrect: idx === correctIdx,
    }));

    const rawType = (typeCol >= 0 ? row[typeCol] : "").trim().toLowerCase();
    const resolvedType: "mcq" | "cq" = rawType === "cq" ? "cq" : "mcq";

    const rawStd = (stdCol >= 0 ? row[stdCol] : "").trim().toLowerCase();
    let resolvedStd: "HSC" | "Varsity" | "Engineering" | "Medical" = "HSC";
    if (rawStd === "varsity") resolvedStd = "Varsity";
    else if (rawStd === "engineering") resolvedStd = "Engineering";
    else if (rawStd === "medical") resolvedStd = "Medical";

    const cleanHtmlContent = (t: string) => {
      if (!t) return "";
      let s = t.trim();
      s = s
        .split("\n")
        .map((l) => (l.trimStart().startsWith("<") ? l.trimStart() : l))
        .join("\n");
      return s.replace(/(<[^>]+>)/g, (m) => m.replace(/""/g, '"'));
    };

    const explanation = expCol >= 0 && row[expCol] ? cleanHtmlContent(row[expCol]) : undefined;
    const source = (secCol >= 0 ? row[secCol] : "")?.trim() || "";
    const rawMarks = marksCol >= 0 ? parseInt(toEnglishDigits(row[marksCol]), 10) : 1;
    const marks = isNaN(rawMarks) || rawMarks <= 0 ? 1 : rawMarks;

    const sanitizedMcqOptions = mcqOptions.map((opt) => ({
      ...opt,
      optionText: cleanHtmlContent(opt.optionText),
    }));

    results.push({
      questionText: cleanHtmlContent(questionText.trim()),
      type: resolvedType,
      standard: resolvedStd,
      source,
      marks,
      explanation,
      mcqOptions: resolvedType === "mcq" ? sanitizedMcqOptions : undefined,
    });
  }

  return results;
}

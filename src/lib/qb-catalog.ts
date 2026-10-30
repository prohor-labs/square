import type { QbUploadedQuestion } from "@/lib/actions/qb-uploads";
import { toBengaliDigits } from "@/lib/calendar-date";
import { getQbSnapshot, type QbInstituteRef } from "@/lib/qb-bank";
import { qbSlug } from "@/lib/qb-meta-write";

/**
 * The student catalogue over the uploaded question bank.
 *
 * Every shelf the student can browse is derived here from the uploaded rows —
 * never from a hard-coded list. A new CSV therefore shows up on the landing
 * page, in its section and in search with no code change.
 *
 * The bank is already kept in memory by `qb-bank.ts` (one read per minute), so
 * building the tree is a walk over a small array, not another round trip.
 */

export const QB_PAGE_SIZE = 20;
/** Shown instead of a blank shelf value; also the URL key for that shelf. */
export const QB_GENERAL = "সাধারণ";

export type QbSectionId = "university" | "engineering" | "medical" | "subject";

export interface QbSectionMeta {
  readonly id: QbSectionId;
  readonly title: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly href: string;
}

export const QB_SECTIONS: readonly QbSectionMeta[] = [
  {
    id: "university",
    title: "বিশ্ববিদ্যালয়ভিত্তিক প্রশ্নব্যাংক",
    shortTitle: "বিশ্ববিদ্যালয়",
    description: "ভর্তি পরীক্ষার প্রশ্ন — বিশ্ববিদ্যালয়, ইউনিট ও সাল ধরে সাজানো।",
    href: "/qb/university",
  },
  {
    id: "engineering",
    title: "ইঞ্জিনিয়ারিংভিত্তিক প্রশ্নব্যাংক",
    shortTitle: "ইঞ্জিনিয়ারিং",
    description: "প্রকৌশল বিশ্ববিদ্যালয়ের ভর্তি প্রশ্ন — প্রতিষ্ঠান ও সাল ধরে।",
    href: "/qb/engineering",
  },
  {
    id: "medical",
    title: "মেডিকেলভিত্তিক প্রশ্নব্যাংক",
    shortTitle: "মেডিকেল",
    description: "মেডিকেল ও ডেন্টাল ভর্তি প্রশ্ন — ক্যাটাগরি ও সাল ধরে।",
    href: "/qb/medical",
  },
  {
    id: "subject",
    title: "বিষয়ভিত্তিক প্রশ্নব্যাংক",
    shortTitle: "বিষয়ভিত্তিক",
    description:
      "যেকোনো আপলোড করা প্রশ্ন বিষয়, পত্র, অধ্যায় ও টপিক ধরে — আলাদা করে আপলোড ছাড়াই।",
    href: "/qb/subject",
  },
];

export interface QbNode {
  readonly key: string;
  readonly label: string;
  readonly count: number;
  readonly hint: string;
  readonly href: string;
  /** Parent name shown above the label (year cards carry their university). */
  readonly context?: string;
}

export interface QbCrumb {
  readonly label: string;
  readonly href?: string;
}

export interface QbNodesPage {
  readonly kind: "nodes";
  readonly title: string;
  readonly description: string;
  readonly crumbs: readonly QbCrumb[];
  readonly basePath: string;
  readonly nodes: readonly QbNode[];
  readonly emptyTitle: string;
  readonly emptyBody: string;
}

export interface QbQuestionsPage {
  readonly kind: "questions";
  readonly title: string;
  readonly description: string;
  readonly crumbs: readonly QbCrumb[];
  readonly basePath: string;
  readonly questions: readonly QbUploadedQuestion[];
  /** Subject tabs (book-wise), taken from the questions of this node. */
  readonly subjects: readonly {
    readonly label: string;
    readonly count: number;
  }[];
  /** Currently selected subject tab; empty means "all". */
  readonly activeSubject: string;
  readonly total: number;
  readonly page: number;
  readonly pageCount: number;
  /** `?set=…` or `?chapter=…`, so the question page can keep the same order. */
  readonly contextQuery: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
}

export type QbPageData = QbNodesPage | QbQuestionsPage;

/* ── local shapes ─────────────────────────────────────────────────────────── */

type QbSetKind = "university" | "engineering" | "medical" | "board";

interface ShelfSet {
  readonly id: string;
  readonly fileName: string;
  readonly university: string;
  readonly unit: string;
  readonly year: string;
  readonly kind: QbSetKind;
  readonly questions: readonly QbUploadedQuestion[];
}

interface YearGroup {
  readonly key: string;
  readonly label: string;
  readonly questions: readonly QbUploadedQuestion[];
}

interface UnitGroup {
  readonly key: string;
  readonly label: string;
  readonly years: readonly YearGroup[];
  readonly questions: readonly QbUploadedQuestion[];
}

interface UniversityGroup {
  readonly key: string;
  readonly label: string;
  readonly units: readonly UnitGroup[];
  readonly questions: readonly QbUploadedQuestion[];
}

interface InstitutionGroup {
  readonly key: string;
  readonly label: string;
  readonly years: readonly YearGroup[];
  readonly questions: readonly QbUploadedQuestion[];
}

interface TopicGroup {
  readonly key: string;
  readonly label: string;
  readonly questions: readonly QbUploadedQuestion[];
}

interface ChapterGroup {
  readonly key: string;
  readonly label: string;
  readonly topics: readonly TopicGroup[];
  readonly questions: readonly QbUploadedQuestion[];
}

interface PaperGroup {
  readonly key: string;
  readonly label: string;
  readonly chapters: readonly ChapterGroup[];
  readonly questions: readonly QbUploadedQuestion[];
}

interface SubjectGroup {
  readonly key: string;
  readonly label: string;
  readonly papers: readonly PaperGroup[];
  readonly questions: readonly QbUploadedQuestion[];
}

interface QbCatalog {
  readonly questions: readonly QbUploadedQuestion[];
  readonly sets: readonly ShelfSet[];
  readonly universityGroups: readonly UniversityGroup[];
  readonly engineeringGroups: readonly InstitutionGroup[];
  readonly medicalGroups: readonly InstitutionGroup[];
  readonly subjectGroups: readonly SubjectGroup[];
}

/* ── small helpers ────────────────────────────────────────────────────────── */

const strip = (value: string | null | undefined): string =>
  (value ?? "").trim();

const compareBn = (a: string, b: string): number => a.localeCompare(b, "bn");

const unique = <T>(list: readonly T[]): T[] => [...new Set(list)];

const yearLabel = (value: string): string =>
  value ? toBengaliDigits(value) : "সাল নেই";

const unitLabel = (value: string): string => value || "ইউনিট নেই";

/** The URL segment for a shelf value; blank shelves share one reserved key. */
const shelfKey = (value: string): string => value || QB_GENERAL;

/** Decodes a route segment defensively — Next usually hands it over decoded. */
export function readSegment(value: string | undefined): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Matches a URL segment against a shelf value, tolerant of encoding/slug form. */
function matches(segment: string, value: string): boolean {
  if (!segment) return false;
  const wanted = strip(segment);
  if (value === wanted) return true;
  const slug = qbSlug(value);
  return slug.length > 0 && slug === qbSlug(wanted);
}

function href(path: string, segment: string): string {
  return `${path}/${encodeURIComponent(segment)}`;
}

function paginate<T>(
  items: readonly T[],
  page: number,
): { items: readonly T[]; total: number; page: number; pageCount: number } {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / QB_PAGE_SIZE));
  const safe = Math.min(
    Math.max(1, Number.isFinite(page) ? Math.trunc(page) : 1),
    pageCount,
  );
  return {
    items: items.slice((safe - 1) * QB_PAGE_SIZE, safe * QB_PAGE_SIZE),
    total,
    page: safe,
    pageCount,
  };
}

/* ── catalogue build ──────────────────────────────────────────────────────── */

const STANDARD_KIND: Record<string, QbSetKind> = {
  hsc: "board",
  board: "board",
  varsity: "university",
  university: "university",
  engineering: "engineering",
  medical: "medical",
};

function kindOf(questions: readonly QbUploadedQuestion[]): QbSetKind {
  let kind: QbSetKind = "board";
  for (const question of questions) {
    const next =
      STANDARD_KIND[strip(question.standard).toLowerCase()] ?? "board";
    if (next === "medical") return "medical";
    if (next === "engineering") kind = "engineering";
    else if (next === "university" && kind !== "engineering")
      kind = "university";
  }
  return kind;
}

/**
 * Words that name a section when the sheet's `standard` column does not.
 *
 * These are how the institutions are actually written in Bangla and English
 * (BUET is "বুয়েট", not "বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয়"), so both spellings
 * have to reach the same shelf.
 */
const INSTITUTE_WORDS: Partial<Record<QbSetKind, readonly string[]>> = {
  engineering: [
    "engineering",
    "ইঞ্জিনিয়ারিং",
    "প্রকৌশল",
    "বুয়েট",
    "কুয়েট",
    "রুয়েট",
    "চুয়েট",
    "iut",
  ],
  medical: [
    "medical",
    "মেডিকেল",
    "ডেন্টাল",
    "dental",
    "mbbs",
    "এমবিবিএস",
    "স্বাস্থ্য",
  ],
};

/**
 * Which section an uploaded file belongs to.
 *
 * The sheet's own `standard` wins when it names engineering or medical. When it
 * does not (most year-based imports are plain `HSC`), the institution typed in
 * the upload form decides — first against the curated `qb_institutes` list and
 * its slug, then against the common Bangla spellings. A file with a university
 * name that matches nothing is still a university file, never a guessed
 * medical one.
 */
function classifySet(
  university: string,
  unit: string,
  questions: readonly QbUploadedQuestion[],
  institutes: readonly QbInstituteRef[],
): QbSetKind {
  const declared = kindOf(questions);
  if (declared === "engineering" || declared === "medical") return declared;

  const haystack = normalizeQbText(`${university} ${unit}`);
  if (haystack) {
    for (const institute of institutes) {
      if (institute.type !== "engineering" && institute.type !== "medical") {
        continue;
      }
      const name = normalizeQbText(institute.name);
      const slug = normalizeQbText(institute.slug);
      if (
        (name.length > 0 && haystack.includes(name)) ||
        (slug.length > 0 && haystack.includes(slug))
      ) {
        return institute.type;
      }
    }

    for (const kind of ["engineering", "medical"] as const) {
      const words = INSTITUTE_WORDS[kind] ?? [];
      if (words.some((word) => haystack.includes(normalizeQbText(word)))) {
        return kind;
      }
    }
  }

  return strip(university) ? "university" : "board";
}

/** Distinct questions of a shelf, in the order the CSV listed them. */
function orderedQuestions(
  questions: readonly QbUploadedQuestion[],
  setId: string,
): QbUploadedQuestion[] {
  return [...questions].sort((a, b) => {
    const orderA =
      a.shelves.find((shelf) => shelf.setId === setId)?.orderNo ?? 0;
    const orderB =
      b.shelves.find((shelf) => shelf.setId === setId)?.orderNo ?? 0;
    return orderA - orderB || compareBn(a.id, b.id);
  });
}

function buildSets(
  questions: readonly QbUploadedQuestion[],
  institutes: readonly QbInstituteRef[],
): readonly ShelfSet[] {
  const byId = new Map<
    string,
    {
      fileName: string;
      university: string;
      unit: string;
      year: string;
      questions: QbUploadedQuestion[];
    }
  >();

  for (const question of questions) {
    for (const shelf of question.shelves) {
      let entry = byId.get(shelf.setId);
      if (!entry) {
        entry = {
          fileName: strip(shelf.fileName),
          university: strip(shelf.university),
          unit: strip(shelf.unit),
          year: strip(shelf.year),
          questions: [],
        };
        byId.set(shelf.setId, entry);
      }
      entry.questions.push(question);
    }
  }

  return [...byId.entries()].map(([id, entry]) => ({
    id,
    fileName: entry.fileName,
    university: entry.university,
    unit: entry.unit,
    year: entry.year,
    kind: classifySet(
      entry.university,
      entry.unit,
      entry.questions,
      institutes,
    ),
    questions: orderedQuestions(entry.questions, id),
  }));
}

function mergeQuestions(
  sets: readonly ShelfSet[],
): readonly QbUploadedQuestion[] {
  const seen = new Set<string>();
  const list: QbUploadedQuestion[] = [];
  for (const set of sets) {
    for (const question of set.questions) {
      if (seen.has(question.id)) continue;
      seen.add(question.id);
      list.push(question);
    }
  }
  return list;
}

function buildInstitutionGroups(
  sets: readonly ShelfSet[],
  kind: QbSetKind,
  keyOf: (set: ShelfSet) => string,
  labelOf: (key: string) => string,
): readonly InstitutionGroup[] {
  const groups = new Map<string, ShelfSet[]>();

  for (const set of sets) {
    if (set.kind !== kind) continue;
    const key = shelfKey(keyOf(set));
    const list = groups.get(key) ?? [];
    list.push(set);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([key, groupSets]) => {
      const years = groupByYear(groupSets);
      return {
        key,
        label: labelOf(key),
        years,
        questions: uniqueQuestions(years.flatMap((year) => year.questions)),
      };
    })
    .sort((a, b) => compareBn(a.label, b.label));
}

function uniqueQuestions(
  questions: readonly QbUploadedQuestion[],
): readonly QbUploadedQuestion[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

function buildUniversityGroups(
  sets: readonly ShelfSet[],
): readonly UniversityGroup[] {
  const universities = new Map<string, ShelfSet[]>();

  for (const set of sets) {
    if (set.kind !== "university") continue;
    const key = shelfKey(set.university);
    const list = universities.get(key) ?? [];
    list.push(set);
    universities.set(key, list);
  }

  return [...universities.entries()]
    .map(([key, universitySets]) => {
      const units = new Map<string, ShelfSet[]>();
      for (const set of universitySets) {
        const unitKey = shelfKey(set.unit);
        const list = units.get(unitKey) ?? [];
        list.push(set);
        units.set(unitKey, list);
      }

      const unitGroups: UnitGroup[] = [...units.entries()]
        .map(([unitKey, unitSets]) => {
          const years = groupByYear(unitSets);
          return {
            key: unitKey,
            label: unitLabel(unitKey === QB_GENERAL ? "" : unitKey),
            years,
            questions: uniqueQuestions(years.flatMap((year) => year.questions)),
          };
        })
        .sort((a, b) => compareBn(a.label, b.label));

      return {
        key,
        label: key,
        units: unitGroups,
        questions: uniqueQuestions(
          unitGroups.flatMap((unit) => unit.questions),
        ),
      };
    })
    .sort((a, b) => compareBn(a.label, b.label));
}

function groupByYear(sets: readonly ShelfSet[]): readonly YearGroup[] {
  const years = new Map<string, ShelfSet[]>();
  for (const set of sets) {
    const list = years.get(set.year) ?? [];
    list.push(set);
    years.set(set.year, list);
  }
  return [...years.entries()]
    .sort(([a], [b]) => compareBn(b, a))
    .map(([year, yearSets]) => ({
      key: shelfKey(year),
      label: yearLabel(year),
      questions: mergeQuestions(yearSets),
    }));
}

function buildSubjectGroups(
  questions: readonly QbUploadedQuestion[],
): readonly SubjectGroup[] {
  const subjects = new Map<
    string,
    {
      label: string;
      papers: Map<string, Map<string, Map<string, QbUploadedQuestion[]>>>;
    }
  >();

  for (const question of questions) {
    const subjectLabel = strip(question.subjectName) || QB_GENERAL;
    const subjectKey = qbSlug(subjectLabel) || "__general";
    if (!subjects.has(subjectKey)) {
      subjects.set(subjectKey, { label: subjectLabel, papers: new Map() });
    }
    const subject = subjects.get(subjectKey);
    if (!subject) continue;

    const paperLabel = strip(question.paperName);
    const paperKey = paperLabel ? qbSlug(paperLabel) : "__single";
    if (!subject.papers.has(paperKey)) subject.papers.set(paperKey, new Map());
    const chapters = subject.papers.get(paperKey);
    if (!chapters) continue;

    const chapterKey = question.chapterId;
    if (!chapters.has(chapterKey)) chapters.set(chapterKey, new Map());
    const topics = chapters.get(chapterKey);
    if (!topics) continue;

    const topicKey = question.topicId ?? "__none";
    const list = topics.get(topicKey) ?? [];
    list.push(question);
    topics.set(topicKey, list);
  }

  return [...subjects.entries()]
    .map(([key, subject]) => {
      const papers: PaperGroup[] = [...subject.papers.entries()]
        .map(([paperKey, chapters]) => {
          const chapterGroups: ChapterGroup[] = [...chapters.entries()]
            .map(([chapterId, topics]) => {
              const sample = [...topics.values()][0]?.[0];
              const topicGroups: TopicGroup[] = [...topics.entries()]
                .filter(([topicId]) => topicId !== "__none")
                .map(([topicId, list]) => ({
                  key: topicId,
                  label: strip(list[0]?.topicName) || QB_GENERAL,
                  questions: [...list],
                }))
                .sort((a, b) => compareBn(a.label, b.label));
              const chapterQuestions = uniqueQuestions(
                [...topics.values()].flat(),
              );
              return {
                key: sample?.chapterId ?? chapterId,
                label: strip(sample?.chapterName) || QB_GENERAL,
                topics: topicGroups,
                questions: chapterQuestions,
              };
            })
            .sort((a, b) => compareBn(a.label, b.label));

          const paperQuestions = uniqueQuestions(
            chapterGroups.flatMap((chapter) => chapter.questions),
          );
          return {
            key: paperKey,
            label: strip(paperQuestions[0]?.paperName) || "",
            chapters: chapterGroups,
            questions: paperQuestions,
          };
        })
        .sort((a, b) => compareBn(a.label, b.label));

      return {
        key,
        label: subject.label,
        papers: papers.filter((paper) => paper.questions.length > 0),
        questions: uniqueQuestions(papers.flatMap((paper) => paper.questions)),
      };
    })
    .sort((a, b) => compareBn(a.label, b.label));
}

function buildCatalog(
  questions: readonly QbUploadedQuestion[],
  institutes: readonly QbInstituteRef[],
): QbCatalog {
  const sets = buildSets(questions, institutes);
  return {
    questions,
    sets,
    universityGroups: buildUniversityGroups(sets),
    engineeringGroups: buildInstitutionGroups(
      sets,
      "engineering",
      (set) => set.university,
      (key) => key,
    ),
    // A medical file's `unit` is where its category is written ("ডেন্টাল"),
    // so the same shelf doubles as the category without guessing from the name.
    medicalGroups: buildInstitutionGroups(
      sets,
      "medical",
      (set) => set.unit,
      (key) => (key === QB_GENERAL ? "সাধারণ মেডিকেল" : key),
    ),
    subjectGroups: buildSubjectGroups(questions),
  };
}

async function loadCatalog(): Promise<QbCatalog> {
  const snapshot = await getQbSnapshot();
  return buildCatalog(snapshot.questions, snapshot.institutes);
}

/* ── landing ──────────────────────────────────────────────────────────────── */

export interface QbLanding {
  readonly sections: readonly (QbSectionMeta & {
    readonly total: number;
    readonly nodes: readonly QbNode[];
  })[];
  readonly universityCount: number;
  readonly engineeringCount: number;
  readonly medicalCount: number;
  readonly subjectCount: number;
  readonly setCount: number;
  readonly total: number;
}

export async function getQbLanding(): Promise<QbLanding> {
  const catalog = await loadCatalog();

  const university: QbNode[] = catalog.universityGroups.map((group) => ({
    key: group.key,
    label: group.label,
    count: group.questions.length,
    hint: `${toBengaliDigits(group.units.length)}টি ইউনিট · ${toBengaliDigits(
      unique(group.units.flatMap((unit) => unit.years.map((year) => year.key)))
        .length,
    )}টি সাল`,
    href: href("/qb/university", group.key),
  }));

  const engineering: QbNode[] = catalog.engineeringGroups.map((group) => ({
    key: group.key,
    label: group.label,
    count: group.questions.length,
    hint: `${toBengaliDigits(group.years.length)}টি সাল`,
    href: href("/qb/engineering", group.key),
  }));

  const medical: QbNode[] = catalog.medicalGroups.map((group) => ({
    key: group.key,
    label: group.label,
    count: group.questions.length,
    hint: `${toBengaliDigits(group.years.length)}টি সাল`,
    href: href("/qb/medical", group.key),
  }));

  const subject: QbNode[] = catalog.subjectGroups.map((group) => ({
    key: group.key,
    label: group.label,
    count: group.questions.length,
    hint:
      group.papers.length > 1
        ? `${toBengaliDigits(group.papers.length)}টি পত্র · ${toBengaliDigits(
            unique(
              group.papers.flatMap((paper) => paper.chapters.map((c) => c.key)),
            ).length,
          )}টি অধ্যায়`
        : `${toBengaliDigits(
            unique(
              group.papers.flatMap((paper) => paper.chapters.map((c) => c.key)),
            ).length,
          )}টি অধ্যায়`,
    href: href("/qb/subject", group.key),
  }));

  const nodesFor: Record<QbSectionId, readonly QbNode[]> = {
    university,
    engineering,
    medical,
    subject,
  };

  return {
    sections: QB_SECTIONS.map((section) => ({
      ...section,
      nodes: nodesFor[section.id],
      total: nodesFor[section.id].reduce((sum, node) => sum + node.count, 0),
    })),
    universityCount: university.length,
    engineeringCount: engineering.length,
    medicalCount: medical.length,
    subjectCount: subject.length,
    setCount: catalog.sets.length,
    total: catalog.questions.length,
  };
}

/* ── university section ───────────────────────────────────────────────────── */

const UNIVERSITY_ROOT: QbCrumb = { label: "প্রশ্নব্যাংক", href: "/qb" };

export async function getQbUniversityPage(
  segments: readonly string[],
  page: number,
  subject = "",
): Promise<QbPageData | null> {
  const catalog = await loadCatalog();
  const basePath = "/qb/university";
  const crumbs: QbCrumb[] = [
    UNIVERSITY_ROOT,
    { label: "বিশ্ববিদ্যালয়", href: basePath },
  ];

  if (segments.length === 0) {
    return {
      kind: "nodes",
      title: "বিশ্ববিদ্যালয়ভিত্তিক প্রশ্নব্যাংক",
      description: "বিশ্ববিদ্যালয় বেছে নিন, তারপর ইউনিট ও সাল।",
      crumbs,
      basePath,
      nodes: catalog.universityGroups.map((group) => ({
        key: group.key,
        label: group.label,
        count: group.questions.length,
        hint: `${toBengaliDigits(group.units.length)}টি ইউনিট`,
        href: href(basePath, group.key),
      })),
      emptyTitle: "কোনো বিশ্ববিদ্যালয়ের প্রশ্ন নেই",
      emptyBody:
        "অ্যাডমিন প্রশ্ন আপলোড করলে সেগুলো বিশ্ববিদ্যালয় ও ইউনিট ধরে এখানে দেখা যাবে।",
    };
  }

  const university = catalog.universityGroups.find((group) =>
    matches(segments[0], group.key),
  );
  if (!university) return null;

  const universityCrumbs = [
    ...crumbs,
    { label: university.label, href: href(basePath, university.key) },
  ];

  if (segments.length === 1) {
    return {
      kind: "nodes",
      title: university.label,
      description: "ইউনিট বেছে নিন, তারপর সাল।",
      crumbs: universityCrumbs,
      basePath: href(basePath, university.key),
      nodes: university.units.map((unit) => ({
        key: unit.key,
        label: unit.label,
        count: unit.questions.length,
        hint: `${toBengaliDigits(unit.years.length)}টি সাল`,
        href: href(href(basePath, university.key), unit.key),
      })),
      emptyTitle: "এই বিশ্ববিদ্যালয়ে কোনো ইউনিট নেই",
      emptyBody: "অন্য বিশ্ববিদ্যালয় বেছে দেখুন।",
    };
  }

  const unit = university.units.find((item) => matches(segments[1], item.key));
  if (!unit) return null;

  const unitPath = href(href(basePath, university.key), unit.key);
  const unitCrumbs = [
    ...universityCrumbs,
    { label: unit.label, href: unitPath },
  ];

  if (segments.length === 2) {
    return {
      kind: "nodes",
      title: unit.label,
      description: "সাল বেছে নিন।",
      crumbs: unitCrumbs,
      basePath: unitPath,
      nodes: unit.years.map((year) => ({
        key: year.key,
        label: year.label,
        count: year.questions.length,
        hint: `${toBengaliDigits(year.questions.length)}টি প্রশ্ন`,
        href: href(unitPath, year.key),
        context: university.label,
      })),
      emptyTitle: "এই ইউনিটে কোনো সাল নেই",
      emptyBody: "অন্য ইউনিট বেছে দেখুন।",
    };
  }

  const year = unit.years.find((item) => matches(segments[2], item.key));
  if (!year) return null;

  return questionsPage({
    title: `${university.label} · ${unit.label} · ${year.label}`,
    description: "প্রশ্ন ও উত্তর — ক্রম অনুযায়ী সাজানো।",
    crumbs: [...unitCrumbs, { label: year.label }],
    basePath: href(unitPath, year.key),
    questions: year.questions,
    page,
    contextQuery: "",
    subject,
  });
}

/* ── engineering / medical sections ───────────────────────────────────────── */

async function getFlatSectionPage(
  section: "engineering" | "medical",
  segments: readonly string[],
  page: number,
  subject = "",
): Promise<QbPageData | null> {
  const catalog = await loadCatalog();
  const basePath = `/qb/${section}`;
  const groups =
    section === "engineering"
      ? catalog.engineeringGroups
      : catalog.medicalGroups;
  const label = section === "engineering" ? "ইঞ্জিনিয়ারিং" : "মেডিকেল";
  const root: QbCrumb[] = [UNIVERSITY_ROOT, { label, href: basePath }];

  if (segments.length === 0) {
    return {
      kind: "nodes",
      title:
        section === "engineering"
          ? "ইঞ্জিনিয়ারিংভিত্তিক প্রশ্নব্যাংক"
          : "মেডিকেলভিত্তিক প্রশ্নব্যাংক",
      description:
        section === "engineering"
          ? "প্রকৌশল বিশ্ববিদ্যালয় বেছে নিন, তারপর সাল।"
          : "ক্যাটাগরি বেছে নিন, তারপর সাল।",
      crumbs: root,
      basePath,
      nodes: groups.map((group) => ({
        key: group.key,
        label: group.label,
        count: group.questions.length,
        hint: `${toBengaliDigits(group.years.length)}টি সাল`,
        href: href(basePath, group.key),
      })),
      emptyTitle:
        section === "engineering"
          ? "কোনো ইঞ্জিনিয়ারিং প্রশ্ন নেই"
          : "কোনো মেডিকেল প্রশ্ন নেই",
      emptyBody: "অ্যাডমিন এই ধরনের প্রশ্ন আপলোড করলে সেগুলো এখানে দেখা যাবে।",
    };
  }

  const group = groups.find((item) => matches(segments[0], item.key));
  if (!group) return null;

  const groupPath = href(basePath, group.key);
  const groupCrumbs = [...root, { label: group.label, href: groupPath }];

  if (segments.length === 1) {
    return {
      kind: "nodes",
      title: group.label,
      description: "সাল বেছে নিন।",
      crumbs: groupCrumbs,
      basePath: groupPath,
      nodes: group.years.map((year) => ({
        key: year.key,
        label: year.label,
        count: year.questions.length,
        hint: `${toBengaliDigits(year.questions.length)}টি প্রশ্ন`,
        href: href(groupPath, year.key),
        context: group.label,
      })),
      emptyTitle: "এই প্রতিষ্ঠানে কোনো সাল নেই",
      emptyBody: "অন্য প্রতিষ্ঠান বেছে দেখুন।",
    };
  }

  const year = group.years.find((item) => matches(segments[1], item.key));
  if (!year) return null;

  return questionsPage({
    title: `${group.label} · ${year.label}`,
    description: "প্রশ্ন ও উত্তর — ক্রম অনুযায়ী সাজানো।",
    crumbs: [...groupCrumbs, { label: year.label }],
    basePath: href(groupPath, year.key),
    questions: year.questions,
    page,
    contextQuery: "",
    subject,
  });
}

export async function getQbEngineeringPage(
  segments: readonly string[],
  page: number,
  subject = "",
): Promise<QbPageData | null> {
  return getFlatSectionPage("engineering", segments, page, subject);
}

export async function getQbMedicalPage(
  segments: readonly string[],
  page: number,
  subject = "",
): Promise<QbPageData | null> {
  return getFlatSectionPage("medical", segments, page, subject);
}

/* ── subject section ──────────────────────────────────────────────────────── */

export async function getQbSubjectPage(
  segments: readonly string[],
  page: number,
  subjectFilter = "",
): Promise<QbPageData | null> {
  const catalog = await loadCatalog();
  const basePath = "/qb/subject";
  const root = UNIVERSITY_ROOT;

  if (segments.length === 0) {
    return {
      kind: "nodes",
      title: "বিষয়ভিত্তিক প্রশ্নব্যাংক",
      description:
        "বিষয় বেছে নিন — তারপর পত্র, অধ্যায় ও টপিক। প্রতিটি আপলোড করা প্রশ্ন এখানে নিজে থেকেই যুক্ত হয়।",
      crumbs: [root, { label: "বিষয়ভিত্তিক" }],
      basePath,
      nodes: catalog.subjectGroups.map((group) => ({
        key: group.key,
        label: group.label,
        count: group.questions.length,
        hint:
          group.papers.length > 1
            ? `${toBengaliDigits(group.papers.length)}টি পত্র`
            : `${toBengaliDigits(
                unique(
                  group.papers.flatMap((paper) =>
                    paper.chapters.map((chapter) => chapter.key),
                  ),
                ).length,
              )}টি অধ্যায়`,
        href: href(basePath, group.key),
      })),
      emptyTitle: "কোনো বিষয়ের প্রশ্ন নেই",
      emptyBody:
        "অ্যাডমিন CSV আপলোড করলে subject_name, paper_name, chapter_name ও topic_name কলাম থেকে বিষয়গুলো নিজে থেকেই তৈরি হবে।",
    };
  }

  const subject = catalog.subjectGroups.find((group) =>
    matches(segments[0], group.key),
  );
  if (!subject) return null;

  const subjectPath = href(basePath, subject.key);
  const subjectCrumbs = [
    root,
    { label: "বিষয়ভিত্তিক", href: basePath },
    {
      label: subject.label,
      href: subjectPath,
    },
  ];

  const hasPaperSplit = subject.papers.some((paper) => paper.label.length > 0);

  if (segments.length === 1) {
    if (hasPaperSplit) {
      return {
        kind: "nodes",
        title: subject.label,
        description: "পত্র বেছে নিন।",
        crumbs: subjectCrumbs,
        basePath: subjectPath,
        nodes: subject.papers.map((paper) => ({
          key: paper.key,
          label: paper.label || "সাধারণ",
          count: paper.questions.length,
          hint: `${toBengaliDigits(paper.chapters.length)}টি অধ্যায়`,
          href: href(subjectPath, paper.key),
        })),
        emptyTitle: "এই বিষয়ে কোনো পত্র নেই",
        emptyBody: "অন্য বিষয় বেছে দেখুন।",
      };
    }
    return chapterNodes(
      subject.papers[0]?.chapters ?? [],
      subject,
      subjectCrumbs,
      subjectPath,
    );
  }

  const paper = hasPaperSplit
    ? subject.papers.find((item) => matches(segments[1], item.key))
    : subject.papers[0];
  if (!paper) return null;

  const paperSegments = hasPaperSplit ? segments.slice(2) : segments.slice(1);
  const paperPath = hasPaperSplit ? href(subjectPath, paper.key) : subjectPath;
  const paperCrumbs = hasPaperSplit
    ? [...subjectCrumbs, { label: paper.label || "সাধারণ", href: paperPath }]
    : subjectCrumbs;

  if (paperSegments.length === 0) {
    return chapterNodes(paper.chapters, subject, paperCrumbs, paperPath);
  }

  const chapter = paper.chapters.find(
    (item) =>
      matches(paperSegments[0], item.key) ||
      matches(paperSegments[0], item.label),
  );
  if (!chapter) return null;

  const chapterPath = href(paperPath, chapter.key);
  const chapterCrumbs = [
    ...paperCrumbs,
    { label: chapter.label, href: chapterPath },
  ];

  if (paperSegments.length === 1) {
    if (chapter.topics.length > 0) {
      return {
        kind: "nodes",
        title: chapter.label,
        description: "টপিক বেছে নিন, অথবা পুরো অধ্যায়ের প্রশ্ন দেখুন।",
        crumbs: chapterCrumbs,
        basePath: chapterPath,
        nodes: [
          {
            key: "__all",
            label: "পুরো অধ্যায়",
            count: chapter.questions.length,
            hint: `${toBengaliDigits(chapter.questions.length)}টি প্রশ্ন`,
            href: href(chapterPath, "__all"),
          },
          ...chapter.topics.map((topic) => ({
            key: topic.key,
            label: topic.label,
            count: topic.questions.length,
            hint: `${toBengaliDigits(topic.questions.length)}টি প্রশ্ন`,
            href: href(chapterPath, topic.key),
          })),
        ],
        emptyTitle: "এই অধ্যায়ে কোনো টপিক নেই",
        emptyBody: "পুরো অধ্যায়ের প্রশ্ন দেখুন।",
      };
    }

    return questionsPage({
      title: chapter.label,
      description: `${subject.label} · ${chapter.label}`,
      crumbs: chapterCrumbs,
      basePath: chapterPath,
      questions: chapter.questions,
      page,
      contextQuery: "",
      subject: subjectFilter,
    });
  }

  const topicSegment = paperSegments[1];
  if (topicSegment === "__all") {
    return questionsPage({
      title: `${chapter.label} · পুরো অধ্যায়`,
      description: `${subject.label} · ${chapter.label}`,
      crumbs: [...chapterCrumbs, { label: "পুরো অধ্যায়" }],
      basePath: href(chapterPath, "__all"),
      questions: chapter.questions,
      page,
      contextQuery: "",
      subject: subjectFilter,
    });
  }

  const topic = chapter.topics.find(
    (item) => item.key === topicSegment || matches(topicSegment, item.label),
  );
  if (!topic) return null;

  return questionsPage({
    title: topic.label,
    description: `${subject.label} · ${chapter.label} · ${topic.label}`,
    crumbs: [...chapterCrumbs, { label: topic.label }],
    basePath: href(chapterPath, topic.key),
    questions: topic.questions,
    page,
    contextQuery: "",
    subject: subjectFilter,
  });
}

function chapterNodes(
  chapters: readonly ChapterGroup[],
  subject: SubjectGroup,
  crumbs: readonly QbCrumb[],
  basePath: string,
): QbNodesPage {
  return {
    kind: "nodes",
    title: subject.label,
    description: "অধ্যায় বেছে নিন।",
    crumbs,
    basePath,
    nodes: chapters.map((chapter) => ({
      key: chapter.key,
      label: chapter.label,
      count: chapter.questions.length,
      hint:
        chapter.topics.length > 0
          ? `${toBengaliDigits(chapter.topics.length)}টি টপিক`
          : `${toBengaliDigits(chapter.questions.length)}টি প্রশ্ন`,
      href: href(basePath, chapter.key),
    })),
    emptyTitle: "এই বিষয়ে কোনো অধ্যায় নেই",
    emptyBody: "অন্য বিষয় বেছে দেখুন।",
  };
}

/* ── question page ────────────────────────────────────────────────────────── */

function questionsPage(args: {
  title: string;
  description: string;
  crumbs: readonly QbCrumb[];
  basePath: string;
  questions: readonly QbUploadedQuestion[];
  page: number;
  contextQuery: string;
  /** Subject tab picked by the reader; ignored when no question has it. */
  subject?: string;
}): QbQuestionsPage {
  /*
   * Tabs are per subject (the book), never per paper: the whole node's
   * questions are grouped by `subject_name` exactly as the CSV spells it.
   */
  const subjects = unique(
    args.questions
      .map((question) => strip(question.subjectName))
      .filter(Boolean),
  )
    .map((label) => ({
      label,
      count: args.questions.filter(
        (question) => strip(question.subjectName) === label,
      ).length,
    }))
    .sort((a, b) => compareBn(a.label, b.label));

  const activeSubject = subjects.some((item) => item.label === args.subject)
    ? (args.subject ?? "")
    : "";
  const list = activeSubject
    ? args.questions.filter(
        (question) => strip(question.subjectName) === activeSubject,
      )
    : args.questions;

  const paged = paginate(list, args.page);
  return {
    kind: "questions",
    title: args.title,
    description: args.description,
    crumbs: args.crumbs,
    basePath: args.basePath,
    questions: paged.items,
    subjects,
    activeSubject,
    total: paged.total,
    page: paged.page,
    pageCount: paged.pageCount,
    contextQuery: args.contextQuery,
    emptyTitle: "এই অংশে কোনো প্রশ্ন নেই",
    emptyBody: "অন্য অংশ বেছে দেখুন।",
  };
}

export interface QbQuestionContext {
  readonly question: QbUploadedQuestion;
  readonly contextLabel: string;
  readonly crumbs: readonly QbCrumb[];
  readonly position: { readonly index: number; readonly total: number };
  readonly prevId: string | null;
  readonly nextId: string | null;
  readonly backHref: string;
  /** The uploaded file whose order the prev/next links follow, if any. */
  readonly contextSetId: string | null;
}

export async function getQbQuestionContext(
  id: string,
  setId?: string,
): Promise<QbQuestionContext | null> {
  const catalog = await loadCatalog();
  const question = catalog.questions.find((item) => item.id === id);
  if (!question) return null;

  let ordered: readonly QbUploadedQuestion[] = [];
  let contextLabel = "";
  let backHref = "/qb";
  let contextSetId: string | null = null;

  if (setId) {
    const set = catalog.sets.find((item) => item.id === setId);
    if (set) {
      ordered = set.questions;
      contextLabel = [set.university, set.unit, set.year]
        .map(strip)
        .filter(Boolean)
        .join(" · ");
      backHref = `/qb/file/${set.id}`;
      contextSetId = set.id;
    }
  }

  if (ordered.length === 0) {
    const chapter = catalog.questions.filter(
      (item) => item.chapterId === question.chapterId,
    );
    ordered = chapter;
    contextLabel = [question.subjectName, question.chapterName]
      .filter(Boolean)
      .join(" · ");
  }

  const index = ordered.findIndex((item) => item.id === id);
  return {
    question,
    contextLabel,
    crumbs: [
      UNIVERSITY_ROOT,
      {
        label: question.subjectName,
        href: `/qb/subject/${qbSlug(question.subjectName) || "__general"}`,
      },
      { label: question.chapterName },
    ],
    position: { index: Math.max(0, index), total: ordered.length },
    prevId: index > 0 ? (ordered[index - 1]?.id ?? null) : null,
    nextId:
      index >= 0 && index < ordered.length - 1
        ? (ordered[index + 1]?.id ?? null)
        : null,
    backHref,
    contextSetId,
  };
}

/* ── search ───────────────────────────────────────────────────────────────── */

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

/**
 * One normalisation for both the query and the data.
 *
 * Bengali text arrives in several Unicode orders (a vowel sign before or after
 * its consonant), so `NFKC` runs first; digits then collapse to ASCII so
 * "২০২৪" and "2024" are the same query; punctuation becomes a space so a
 * chapter name pasted from a PDF still matches.
 */
export function normalizeQbText(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[০-৯]/g, (digit) => String(BENGALI_DIGITS.indexOf(digit)))
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Spellings students actually type for the institutions in the bank.
 *
 * Only pairs that mean the same thing are listed; the map never invents a
 * university, it just lets "ঢাবি" reach the row stored as "ঢাকা বিশ্ববিদ্যালয়".
 */
const QB_ALIASES: Record<string, readonly string[]> = {
  ঢাবি: ["ঢাকা বিশ্ববিদ্যালয়", "dhaka university"],
  "ঢাকা বিশ্ববিদ্যালয়": ["ঢাবি"],
  বুয়েট: ["বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয়", "buet"],
  buet: ["বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয়", "বুয়েট"],
  কুয়েট: ["খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়", "kuet"],
  kuet: ["খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়", "কুয়েট"],
  রুয়েট: ["রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়", "ruet"],
  ruet: ["রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়", "রুয়েট"],
  চুয়েট: ["চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়", "cuet"],
  cuet: ["চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়", "চুয়েট"],
  মেডিকেল: ["medical", "mbbs"],
  medical: ["মেডিকেল", "mbbs"],
  ইঞ্জিনিয়ারিং: ["engineering"],
  engineering: ["ইঞ্জিনিয়ারিং"],
  ভার্সিটি: ["ভার্সিটি", "varsity", "university"],
  varsity: ["ভার্সিটি", "university"],
};

/**
 * Groups of interchangeable spellings, one group per word the student typed.
 *
 * A query matches when *every group* has at least one member in the haystack.
 * That keeps the words of a multi-word query ANDed while letting "ঢাবি" and
 * "ঢাকা বিশ্ববিদ্যালয়" stand in for each other instead of being required at
 * the same time.
 */
function tokenGroups(term: string): readonly (readonly string[])[] {
  const base = normalizeQbText(term);
  if (!base) return [];

  return base
    .split(" ")
    .filter(Boolean)
    .map((token) => {
      const group = new Set<string>([token]);
      for (const alias of QB_ALIASES[token] ?? []) {
        const normalized = normalizeQbText(alias);
        if (normalized) group.add(normalized);
      }
      for (const [key, values] of Object.entries(QB_ALIASES)) {
        if (values.some((value) => normalizeQbText(value) === token)) {
          const normalizedKey = normalizeQbText(key);
          if (normalizedKey) group.add(normalizedKey);
        }
      }
      return [...group];
    });
}

function matchesGroups(
  haystack: string,
  groups: readonly (readonly string[])[],
): boolean {
  return groups.every((group) =>
    group.some((token) => token.length > 0 && haystack.includes(token)),
  );
}

/**
 * Drops markup, markdown images and URLs before matching.
 *
 * Explanations are stored as HTML and often carry an image URL with a date in
 * it ("…/ugc/2024-08-16/…"). Without this a search for "2024" would hit every
 * question whose screenshot happened to be uploaded that day.
 */
function plainSearchText(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/https?:\/\/\S+/g, " ");
}

function questionHaystack(question: QbUploadedQuestion): string {
  const parts: string[] = [
    plainSearchText(question.questionText),
    plainSearchText(question.explanation ?? ""),
    question.subjectName,
    question.paperName,
    question.chapterName,
    question.topicName ?? "",
    question.standard,
    ...question.mcqOptions.map((option) => plainSearchText(option.optionText)),
    ...question.cqParts.map((part) => plainSearchText(part.questionText)),
  ];
  for (const shelf of question.shelves) {
    parts.push(shelf.university, shelf.unit, shelf.year, shelf.fileName);
  }
  return normalizeQbText(parts.join(" "));
}

export interface QbSearchNodeHit {
  readonly label: string;
  readonly href: string;
  readonly count: number;
  readonly hint: string;
}

export interface QbSearchResult {
  readonly term: string;
  readonly questions: readonly QbUploadedQuestion[];
  readonly nodes: readonly QbSearchNodeHit[];
  readonly totalQuestions: number;
}

function collectSearchNodes(catalog: QbCatalog): QbSearchNodeHit[] {
  const nodes: QbSearchNodeHit[] = [];

  for (const group of catalog.universityGroups) {
    nodes.push({
      label: group.label,
      href: href("/qb/university", group.key),
      count: group.questions.length,
      hint: "বিশ্ববিদ্যালয়",
    });
    for (const unit of group.units) {
      nodes.push({
        label: `${group.label} · ${unit.label}`,
        href: href(href("/qb/university", group.key), unit.key),
        count: unit.questions.length,
        hint: "ইউনিট",
      });
    }
  }

  for (const group of catalog.engineeringGroups) {
    nodes.push({
      label: group.label,
      href: href("/qb/engineering", group.key),
      count: group.questions.length,
      hint: "ইঞ্জিনিয়ারিং",
    });
  }

  for (const group of catalog.medicalGroups) {
    nodes.push({
      label: group.label,
      href: href("/qb/medical", group.key),
      count: group.questions.length,
      hint: "মেডিকেল",
    });
  }

  for (const subject of catalog.subjectGroups) {
    nodes.push({
      label: subject.label,
      href: href("/qb/subject", subject.key),
      count: subject.questions.length,
      hint: "বিষয়",
    });
    for (const paper of subject.papers) {
      if (!paper.label) continue;
      const paperPath = href(href("/qb/subject", subject.key), paper.key);
      nodes.push({
        label: `${subject.label} · ${paper.label}`,
        href: paperPath,
        count: paper.questions.length,
        hint: "পত্র",
      });
      for (const chapter of paper.chapters) {
        nodes.push({
          label: `${subject.label} · ${chapter.label}`,
          href: href(paperPath, chapter.key),
          count: chapter.questions.length,
          hint: "অধ্যায়",
        });
      }
    }
    for (const paper of subject.papers) {
      for (const chapter of paper.chapters) {
        for (const topic of chapter.topics) {
          nodes.push({
            label: `${chapter.label} · ${topic.label}`,
            href: href(
              href(href("/qb/subject", subject.key), paper.key),
              chapter.key,
            )
              .concat("/")
              .concat(encodeURIComponent(topic.key)),
            count: topic.questions.length,
            hint: "টপিক",
          });
        }
      }
    }
  }

  return nodes;
}

export async function searchQb(
  term: string,
  limit = 30,
): Promise<QbSearchResult> {
  const groups = tokenGroups(term);
  if (groups.length === 0) {
    return { term, questions: [], nodes: [], totalQuestions: 0 };
  }

  const catalog = await loadCatalog();

  const matchedQuestions = catalog.questions.filter((question) =>
    matchesGroups(questionHaystack(question), groups),
  );

  const normalizedTerm = normalizeQbText(term);
  const nodes = collectSearchNodes(catalog).filter((node) => {
    const haystack = normalizeQbText(`${node.label} ${node.hint}`);
    return haystack.includes(normalizedTerm) || matchesGroups(haystack, groups);
  });

  return {
    term,
    questions: matchedQuestions.slice(0, limit),
    nodes: nodes.slice(0, 12),
    totalQuestions: matchedQuestions.length,
  };
}

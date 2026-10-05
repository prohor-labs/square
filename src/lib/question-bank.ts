/**
 * The four question-bank sections a student sees.
 *
 * A bank is a group of existing containers, not a new table: each bank's members
 * are listed in CONTAINER_BANK below. Nothing in the database has to be moved,
 * so existing question URLs keep working.
 *
 * Icons live with the components rather than here, so this module stays free of
 * icon-library imports and can be used from plain server logic.
 */
export const QB_BANK_SLUGS = [
  "varsity",
  "engineering",
  "medical",
  "board",
] as const;

export type QbBankSlug = (typeof QB_BANK_SLUGS)[number];

export interface QbBankMeta {
  readonly slug: QbBankSlug;
  readonly label: string;
  readonly description: string;
  /** Gradient stops for the card background. */
  readonly gradient: string;
  readonly chip: string;
}

/** Ordered as they should appear on the page. */
export const QB_BANKS: readonly QbBankMeta[] = [
  {
    slug: "varsity",
    label: "বিশ্ববিদ্যালয় প্রশ্ন ব্যাংক",
    description: "ভার্সিটি ভর্তি পরীক্ষার বিগত বছরের প্রশ্ন ও সমাধান",
    gradient: "from-indigo-500 via-indigo-600 to-indigo-700",
    chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    slug: "engineering",
    label: "ইঞ্জিনিয়ারিং প্রশ্ন ব্যাংক",
    description: "ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার প্রশ্ন ও সমাধান",
    gradient: "from-sky-500 via-sky-600 to-sky-700",
    chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    slug: "medical",
    label: "মেডিকেল প্রশ্ন ব্যাংক",
    description: "মেডিকেল ভর্তি পরীক্ষার প্রশ্ন ও সমাধান",
    gradient: "from-rose-500 via-rose-600 to-rose-700",
    chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    slug: "board",
    label: "বোর্ড প্রশ্ন ব্যাংক",
    description: "এইচএসসি বোর্ড পরীক্ষার অনুশীলনী ও মডেল টেস্ট প্রশ্ন",
    gradient: "from-emerald-500 via-emerald-600 to-emerald-700",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

const BANK_BY_SLUG = new Map(QB_BANKS.map((b) => [b.slug, b]));

export function getBankMeta(slug: string): QbBankMeta | null {
  return BANK_BY_SLUG.get(slug as QbBankSlug) ?? null;
}

/**
 * Which bank a container belongs to.
 *
 * Listed explicitly so mixed containers can be placed on purpose — the
 * chemistry container ("chem") holds HSC, medical and varsity questions in one
 * place, so deriving its bank from the questions alone would be arbitrary.
 *
 * A container missing from this list falls back to the dominant standard of its
 * questions, so a newly created engineering container lands in the engineering
 * bank without any code change.
 */
const CONTAINER_BANK: Readonly<Record<string, QbBankSlug>> = {
  // University / varsity
  "du-ka": "varsity",
  "ru-c": "varsity",
  // Medical
  medicalqb: "medical",
  // Board — textbook practice, the mixed chemistry pool, and the archive
  onushiloniqb: "board",
  chem: "board",
  "arc-qb": "board",
};

const STANDARD_BANK: Readonly<Record<string, QbBankSlug>> = {
  Varsity: "varsity",
  Engineering: "engineering",
  Medical: "medical",
  HSC: "board",
};

/** Questions grouped by `questions.standard`. */
export type StandardCounts = Readonly<Record<string, number>>;

export function resolveBankSlug(
  containerSlug: string,
  standardCounts?: StandardCounts | null,
): QbBankSlug {
  const explicit = CONTAINER_BANK[containerSlug];
  if (explicit) return explicit;

  let best: QbBankSlug = "board";
  let bestCount = -1;
  for (const [standard, n] of Object.entries(standardCounts ?? {})) {
    if (n > bestCount) {
      const bank = STANDARD_BANK[standard];
      if (bank) {
        best = bank;
        bestCount = n;
      }
    }
  }
  return best;
}

export interface QbContainerLike {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description?: string | null;
  readonly itemsCount?: number | null;
  readonly questionsCount?: number | null;
  readonly standardCounts?: StandardCounts | null;
}

/**
 * Name to show for a unit.
 *
 * The year-based containers were seeded with the placeholder "সালসমূহ" for
 * their single item, which says nothing on a card. Where that placeholder is
 * still in place the subject is taken from the container's own title instead —
 * "ঢাকা বিশ্ববিদ্যালয় ( বিজ্ঞান )" reads as "বিজ্ঞান". Containers with no
 * subject in the title fall back to a plain label.
 *
 * A unit the admin has actually named is returned untouched.
 */
export function unitLabel(itemName: string, containerTitle: string): string {
  const name = itemName.trim();
  if (name !== "সালসমূহ" && name !== "সালসমূহ ") return name;

  const subject = containerTitle.match(/[(（]([^)）]+)[)）]/)?.[1]?.trim();
  return subject || "সব প্রশ্ন";
}

export interface QbBankGroup {
  readonly meta: QbBankMeta;
  readonly containers: readonly QbContainerLike[];
}

/** Buckets containers into the four banks, preserving QB_BANKS order. */
export function groupContainersByBank(
  containers: readonly QbContainerLike[],
): QbBankGroup[] {
  return QB_BANKS.map((meta) => ({
    meta,
    containers: containers.filter(
      (c) => resolveBankSlug(c.slug, c.standardCounts) === meta.slug,
    ),
  }));
}

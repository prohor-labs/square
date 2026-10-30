/**
 * Recognised public universities of Bangladesh.
 *
 * The list follows the University Grants Commission's public-university
 * families (general, science & technology, engineering, agricultural, medical
 * and specialised) and deliberately excludes private universities. Each entry
 * carries what the admin upload form needs to search it:
 *
 * - `bn`    — the Bengali name stored on the uploaded set,
 * - `en`    — the English name,
 * - `short` — common abbreviations (both scripts) so "DU" or "ঢাবি" works,
 * - `units` — the admission units *that university* uses.
 *
 * `units` is empty when the university does not publish a unit-based split (or
 * when the split changed recently). The upload form always offers a custom unit
 * field, so an empty list never blocks an upload.
 */

export interface QbUniversity {
  /** Stable slug — used only inside the admin UI, never written to the bank. */
  readonly id: string;
  /** Bengali name, written to `new_question_sets.university`. */
  readonly bn: string;
  readonly en: string;
  readonly short: readonly string[];
  /** Units for this university only; empty means "no known unit split". */
  readonly units: readonly string[];
}

const UNITS_DU = ["ক ইউনিট", "খ ইউনিট", "গ ইউনিট", "ঘ ইউনিট"] as const;
const UNITS_RU = ["ক ইউনিট", "খ ইউনিট", "গ ইউনিট"] as const;
const UNITS_CU = ["ক ইউনিট", "খ ইউনিট", "গ ইউনিট", "ঘ ইউনিট"] as const;
const UNITS_JU = ["ক ইউনিট", "খ ইউনিট", "গ ইউনিট", "ঘ ইউনিট"] as const;
const UNITS_IU = ["ক ইউনিট", "খ ইউনিট", "গ ইউনিট"] as const;

export const QB_UNIVERSITIES: readonly QbUniversity[] = [
  /* ── general ─────────────────────────────────────────────────────────── */
  {
    id: "du",
    bn: "ঢাকা বিশ্ববিদ্যালয়",
    en: "University of Dhaka",
    short: ["DU", "ঢাবি", "ঢা.বি"],
    units: UNITS_DU,
  },
  {
    id: "ru",
    bn: "রাজশাহী বিশ্ববিদ্যালয়",
    en: "University of Rajshahi",
    short: ["RU", "রাবি"],
    units: UNITS_RU,
  },
  {
    id: "cu",
    bn: "চট্টগ্রাম বিশ্ববিদ্যালয়",
    en: "University of Chittagong",
    short: ["CU", "চবি"],
    units: UNITS_CU,
  },
  {
    id: "ju",
    bn: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",
    en: "Jahangirnagar University",
    short: ["JU", "জাবি"],
    units: UNITS_JU,
  },
  {
    id: "iu",
    bn: "ইসলামী বিশ্ববিদ্যালয়, বাংলাদেশ",
    en: "Islamic University, Bangladesh",
    short: ["IU", "ইবি"],
    units: UNITS_IU,
  },
  {
    id: "ku",
    bn: "খুলনা বিশ্ববিদ্যালয়",
    en: "Khulna University",
    short: ["KU", "খুবি"],
    units: [],
  },
  {
    id: "jnu",
    bn: "জগন্নাথ বিশ্ববিদ্যালয়",
    en: "Jagannath University",
    short: ["JnU", "জবি"],
    units: [],
  },
  {
    id: "cou",
    bn: "কুমিল্লা বিশ্ববিদ্যালয়",
    en: "Comilla University",
    short: ["CoU", "কুবি"],
    units: [],
  },
  {
    id: "jkkniu",
    bn: "জাতীয় কবি কাজী নজরুল ইসলাম বিশ্ববিদ্যালয়",
    en: "Jatiya Kabi Kazi Nazrul Islam University",
    short: ["JKKNIU"],
    units: [],
  },
  {
    id: "bup",
    bn: "বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস",
    en: "Bangladesh University of Professionals",
    short: ["BUP"],
    units: [],
  },
  {
    id: "brur",
    bn: "বেগম রোকেয়া বিশ্ববিদ্যালয়",
    en: "Begum Rokeya University",
    short: ["BRUR", "বেরোবি"],
    units: [],
  },
  {
    id: "bu",
    bn: "বরিশাল বিশ্ববিদ্যালয়",
    en: "University of Barishal",
    short: ["BU", "ববি"],
    units: [],
  },
  {
    id: "rub",
    bn: "রবীন্দ্র বিশ্ববিদ্যালয়",
    en: "Rabindra University",
    short: ["RUB", "রবি"],
    units: [],
  },
  {
    id: "nku",
    bn: "নেত্রকোণা বিশ্ববিদ্যালয়",
    en: "Netrokona University",
    short: ["NkU"],
    units: [],
  },
  {
    id: "kgu",
    bn: "কিশোরগঞ্জ বিশ্ববিদ্যালয়",
    en: "Kishoreganj University",
    short: ["KgU"],
    units: [],
  },
  {
    id: "mepu",
    bn: "মেহেরপুর বিশ্ববিদ্যালয়",
    en: "Meherpur University",
    short: ["MU"],
    units: [],
  },
  {
    id: "ub",
    bn: "বগুড়া বিশ্ববিদ্যালয়",
    en: "University of Bogura",
    short: ["UB"],
    units: [],
  },
  {
    id: "tu",
    bn: "ঠাকুরগাঁও বিশ্ববিদ্যালয়",
    en: "Thakurgaon University",
    short: ["TU"],
    units: [],
  },
  {
    id: "nau",
    bn: "নওগাঁ বিশ্ববিদ্যালয়",
    en: "Naogaon University",
    short: ["NaU"],
    units: [],
  },

  /* ── science & technology ────────────────────────────────────────────── */
  {
    id: "sust",
    bn: "শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Shahjalal University of Science and Technology",
    short: ["SUST", "শাবিপ্রবি"],
    units: [],
  },
  {
    id: "hstu",
    bn: "হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Hajee Mohammad Danesh Science and Technology University",
    short: ["HSTU", "হাবিপ্রবি"],
    units: [],
  },
  {
    id: "mbstu",
    bn: "মাওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Mawlana Bhashani Science and Technology University",
    short: ["MBSTU", "মাভাবিপ্রবি"],
    units: [],
  },
  {
    id: "pstu",
    bn: "পটুয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Patuakhali Science and Technology University",
    short: ["PSTU", "পবিপ্রবি"],
    units: [],
  },
  {
    id: "nstu",
    bn: "নোয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Noakhali Science and Technology University",
    short: ["NSTU", "নোবিপ্রবি"],
    units: [],
  },
  {
    id: "just",
    bn: "যশোর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Jashore University of Science and Technology",
    short: ["JUST", "যবিপ্রবি"],
    units: [],
  },
  {
    id: "pust",
    bn: "পাবনা বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Pabna University of Science and Technology",
    short: ["PUST", "পাবিপ্রবি"],
    units: [],
  },
  {
    id: "gstu",
    bn: "গোপালগঞ্জ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Gopalganj Science and Technology University",
    short: ["GSTU", "গবিপ্রবি"],
    units: [],
  },
  {
    id: "rmstu",
    bn: "রাঙ্গামাটি বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Rangamati Science and Technology University",
    short: ["RmSTU"],
    units: [],
  },
  {
    id: "jstu",
    bn: "জামালপুর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Jamalpur Science and Technology University",
    short: ["JSTU"],
    units: [],
  },
  {
    id: "cstu",
    bn: "চাঁদপুর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Chandpur Science and Technology University",
    short: ["CSTU"],
    units: [],
  },
  {
    id: "sstu",
    bn: "সুনামগঞ্জ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Sunamganj Science and Technology University",
    short: ["SSTU"],
    units: [],
  },
  {
    id: "lstu",
    bn: "লক্ষ্মীপুর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Lakshmipur Science and Technology University",
    short: ["LSTU"],
    units: [],
  },
  {
    id: "prstu",
    bn: "পিরোজপুর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Pirojpur Science and Technology University",
    short: ["PrSTU"],
    units: [],
  },
  {
    id: "saust",
    bn: "সাতক্ষীরা বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Satkhira University of Science and Technology",
    short: ["SaUST"],
    units: [],
  },
  {
    id: "ngstu",
    bn: "নারায়ণগঞ্জ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Narayanganj Science and Technology University",
    short: ["NGSTU"],
    units: [],
  },

  /* ── engineering ─────────────────────────────────────────────────────── */
  {
    id: "buet",
    bn: "বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয়",
    en: "Bangladesh University of Engineering and Technology",
    short: ["BUET", "বুয়েট"],
    units: [],
  },
  {
    id: "ruet",
    bn: "রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Rajshahi University of Engineering & Technology",
    short: ["RUET", "রুয়েট"],
    units: [],
  },
  {
    id: "kuet",
    bn: "খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Khulna University of Engineering & Technology",
    short: ["KUET", "কুয়েট"],
    units: [],
  },
  {
    id: "cuet",
    bn: "চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Chittagong University of Engineering & Technology",
    short: ["CUET", "চুয়েট"],
    units: [],
  },
  {
    id: "duet",
    bn: "ঢাকা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়",
    en: "Dhaka University of Engineering & Technology",
    short: ["DUET", "ডুয়েট"],
    units: [],
  },
  {
    id: "mist",
    bn: "মিলিটারি ইনস্টিটিউট অব সায়েন্স অ্যান্ড টেকনোলজি",
    en: "Military Institute of Science and Technology",
    short: ["MIST"],
    units: [],
  },

  /* ── agricultural ────────────────────────────────────────────────────── */
  {
    id: "bau",
    bn: "বাংলাদেশ কৃষি বিশ্ববিদ্যালয়",
    en: "Bangladesh Agricultural University",
    short: ["BAU", "বাকৃবি"],
    units: [],
  },
  {
    id: "bsmrau",
    bn: "বঙ্গবন্ধু শেখ মুজিবুর রহমান কৃষি বিশ্ববিদ্যালয়",
    en: "Bangabandhu Sheikh Mujibur Rahman Agricultural University",
    short: ["BSMRAU"],
    units: [],
  },
  {
    id: "sbau",
    bn: "শেরে বাংলা কৃষি বিশ্ববিদ্যালয়",
    en: "Sher-e-Bangla Agricultural University",
    short: ["SBAU", "শেকৃবি"],
    units: [],
  },
  {
    id: "sau",
    bn: "সিলেট কৃষি বিশ্ববিদ্যালয়",
    en: "Sylhet Agricultural University",
    short: ["SAU", "সিকৃবি"],
    units: [],
  },
  {
    id: "kau",
    bn: "খুলনা কৃষি বিশ্ববিদ্যালয়",
    en: "Khulna Agricultural University",
    short: ["KAU", "খুকৃবি"],
    units: [],
  },
  {
    id: "hau",
    bn: "হবিগঞ্জ কৃষি বিশ্ববিদ্যালয়",
    en: "Habiganj Agricultural University",
    short: ["HAU"],
    units: [],
  },
  {
    id: "kuriau",
    bn: "কুড়িগ্রাম কৃষি বিশ্ববিদ্যালয়",
    en: "Kurigram Agricultural University",
    short: ["KuriAU"],
    units: [],
  },
  {
    id: "shau",
    bn: "শরীয়তপুর কৃষি বিশ্ববিদ্যালয়",
    en: "Shariatpur Agricultural University",
    short: ["ShAU"],
    units: [],
  },

  /* ── medical ─────────────────────────────────────────────────────────── */
  {
    id: "bsmmu",
    bn: "বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয়",
    en: "Bangabandhu Sheikh Mujib Medical University",
    short: ["BSMMU", "বামেবি"],
    units: [],
  },
  {
    id: "cmu",
    bn: "চট্টগ্রাম মেডিকেল বিশ্ববিদ্যালয়",
    en: "Chittagong Medical University",
    short: ["CMU"],
    units: [],
  },
  {
    id: "rmu",
    bn: "রাজশাহী মেডিকেল বিশ্ববিদ্যালয়",
    en: "Rajshahi Medical University",
    short: ["RMU"],
    units: [],
  },
  {
    id: "smu",
    bn: "সিলেট মেডিকেল বিশ্ববিদ্যালয়",
    en: "Sylhet Medical University",
    short: ["SMU"],
    units: [],
  },
  {
    id: "kmu",
    bn: "খুলনা মেডিকেল বিশ্ববিদ্যালয়",
    en: "Khulna Medical University",
    short: ["KMU"],
    units: [],
  },

  /* ── specialised & national ──────────────────────────────────────────── */
  {
    id: "cvasu",
    bn: "চট্টগ্রাম ভেটেরিনারি ও অ্যানিম্যাল সায়েন্সেস বিশ্ববিদ্যালয়",
    en: "Chittagong Veterinary and Animal Sciences University",
    short: ["CVASU", "চভাসু"],
    units: [],
  },
  {
    id: "butex",
    bn: "বাংলাদেশ টেক্সটাইল বিশ্ববিদ্যালয়",
    en: "Bangladesh University of Textiles",
    short: ["BUTEX", "বুটেক্স"],
    units: [],
  },
  {
    id: "bsmrmu",
    bn: "বঙ্গবন্ধু শেখ মুজিবুর রহমান মেরিটাইম বিশ্ববিদ্যালয়",
    en: "Bangabandhu Sheikh Mujibur Rahman Maritime University",
    short: ["BSMRMU"],
    units: [],
  },
  {
    id: "bdu",
    bn: "বাংলাদেশ ডিজিটাল ইউনিভার্সিটি",
    en: "Bangladesh Digital University",
    short: ["BDU"],
    units: [],
  },
  {
    id: "aaub",
    bn: "বঙ্গবন্ধু শেখ মুজিবুর রহমান অ্যাভিয়েশন অ্যান্ড অ্যারোস্পেস বিশ্ববিদ্যালয়",
    en: "Bangabandhu Sheikh Mujibur Rahman Aviation and Aerospace University",
    short: ["AAUB"],
    units: [],
  },
  {
    id: "nu",
    bn: "জাতীয় বিশ্ববিদ্যালয়",
    en: "National University",
    short: ["NU", "জাতীয়"],
    units: [],
  },
  {
    id: "bou",
    bn: "বাংলাদেশ উন্মুক্ত বিশ্ববিদ্যালয়",
    en: "Bangladesh Open University",
    short: ["BOU"],
    units: [],
  },
  {
    id: "iau",
    bn: "ইসলামি আরবি বিশ্ববিদ্যালয়",
    en: "Islamic Arabic University",
    short: ["IAU"],
    units: [],
  },
  {
    id: "dcu",
    bn: "ঢাকা কেন্দ্রীয় বিশ্ববিদ্যালয়",
    en: "Dhaka Central University",
    short: ["DCU"],
    units: [],
  },
];

/** Label for sets that are not tied to a single university (board/general). */
export const QB_GENERAL_UNIVERSITY = "সাধারণ (বিশ্ববিদ্যালয়ভিত্তিক নয়)";

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Search key: lowercase, no spaces/dots/punctuation, Bengali digits → ASCII. */
export function qbKey(value: string): string {
  let text = "";
  for (const character of value) {
    const digit = BENGALI_DIGITS.indexOf(character);
    text += digit >= 0 ? String(digit) : character;
  }
  return text
    .toLowerCase()
    .replace(/[.,’'"`\-_/\\()]+/g, "")
    .replace(/\s+/g, "");
}

/** Every searchable string for one university. */
function searchKeys(university: QbUniversity): string[] {
  return [university.bn, university.en, ...university.short].map(qbKey);
}

/** Universities whose Bengali/English name or abbreviation matches the query. */
export function searchQbUniversities(
  query: string,
  limit = 8,
): readonly QbUniversity[] {
  const needle = qbKey(query);
  if (needle.length === 0) return QB_UNIVERSITIES.slice(0, limit);

  const scored: { university: QbUniversity; score: number }[] = [];
  for (const university of QB_UNIVERSITIES) {
    const keys = searchKeys(university);
    let score = -1;
    if (keys.some((key) => key === needle)) score = 3;
    else if (keys.some((key) => key.startsWith(needle))) score = 2;
    else if (keys.some((key) => key.includes(needle))) score = 1;
    if (score >= 0) scored.push({ university, score });
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.university.bn.localeCompare(b.university.bn, "bn"),
    )
    .slice(0, limit)
    .map((entry) => entry.university);
}

/** The known university a stored name belongs to, if any (abbreviations too). */
export function findQbUniversity(value: string): QbUniversity | undefined {
  const needle = qbKey(value);
  if (needle.length === 0) return undefined;
  return QB_UNIVERSITIES.find((university) =>
    searchKeys(university).some((key) => key === needle),
  );
}

/**
 * The single spelling stored on every set for a university.
 *
 * Known names/abbreviations collapse to the Bengali full name, so "ঢাবি" and
 * "ঢাকা বিশ্ববিদ্যালয়" can never become two university groups.
 */
export function canonicalUniversityName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  return findQbUniversity(trimmed)?.bn ?? trimmed.replace(/\s+/g, " ");
}

const BENGALI_LETTER_TO_LATIN: Readonly<Record<string, string>> = {
  ক: "a",
  খ: "b",
  গ: "c",
  ঘ: "d",
  ঙ: "e",
};

const LATIN_LETTER_TO_UNIT: Readonly<Record<string, string>> = {
  a: "ক ইউনিট",
  b: "খ ইউনিট",
  c: "গ ইউনিট",
  d: "ঘ ইউনিট",
  e: "ঙ ইউনিট",
};

/**
 * The units offered for one university: its own published split first, then
 * any units already stored in the bank for it (so a custom unit comes back as
 * a suggestion next time). Never a generic list.
 */
export function qbUnitsForUniversity(
  university: string,
  stored: readonly string[] = [],
): readonly string[] {
  const known = findQbUniversity(university)?.units ?? [];
  const extra = stored
    .map((unit) => unit.trim())
    .filter((unit) => unit.length > 0 && !known.includes(unit));
  return [...known, ...new Set(extra)].sort((a, b) => a.localeCompare(b, "bn"));
}

/** "ক", "A", "a ইউনিট" → "ক ইউনিট"; unknown units are only tidied. */
export function canonicalUnitName(university: string, value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) return "";

  const known = findQbUniversity(university)?.units ?? [];
  const direct = known.find((unit) => qbKey(unit) === qbKey(trimmed));
  if (direct) return direct;

  const letter = trimmed.replace(/\s*ইউনিট\s*/g, "").trim();
  const latin = BENGALI_LETTER_TO_LATIN[letter] ?? letter.toLowerCase();
  const mapped = LATIN_LETTER_TO_UNIT[latin];
  if (mapped && known.includes(mapped)) return mapped;

  return trimmed;
}

/** "২০২৪" or "2024 " → "2024"; anything that is not a plausible year → "". */
export function normalizeExamYear(value: string): string {
  let digits = "";
  for (const character of value.trim()) {
    const bengali = BENGALI_DIGITS.indexOf(character);
    digits += bengali >= 0 ? String(bengali) : character;
  }
  if (!/^(19|20)\d{2}$/.test(digits)) return "";
  const year = Number(digits);
  if (year < 1950 || year > 2100) return "";
  return String(year);
}

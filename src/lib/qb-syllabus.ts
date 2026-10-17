/**
 * The HSC syllabus, as subject → chapter.
 *
 * Kept in the repository rather than typed into the admin form one subject at a
 * time, because the same list has three jobs: it seeds the bank, it is what the
 * upload form offers as suggestions, and it is what a reader would check the
 * chapters against. Changing a chapter name here is one edit rather than a
 * hundred clicks.
 *
 * Subjects carry no paper split. A chapter often draws from both papers, and
 * splitting "রসায়ন" into two subjects would strand the questions already filed
 * under it. The `paper` column stays available for the cases that do need it.
 */

/** Which HSC stream a subject belongs to. */
export type QbStream = "science" | "humanities" | "commerce";

export interface SyllabusSubject {
  readonly name: string;
  readonly stream: QbStream;
  readonly chapters: readonly string[];
}

export const HSC_STREAMS: readonly {
  readonly id: QbStream;
  readonly label: string;
}[] = [
  { id: "science", label: "বিজ্ঞান" },
  { id: "humanities", label: "মানবিক" },
  { id: "commerce", label: "ব্যবসায়" },
];

/**
 * The order subjects appear in when the admin picks one.
 *
 * Science first because that is where most of the bank is, and a stream is
 * rarely shared between two subjects, so the reader only ever sees one list.
 */
export const HSC_SYLLABUS: readonly SyllabusSubject[] = [
  // ── বিজ্ঞান ──────────────────────────────────────────────────────────────
  {
    name: "পদার্থবিজ্ঞান",
    stream: "science",
    chapters: [
      "ভৌতবিজ্ঞানের মৌলিক ধারণা",
      "গতিবিদ্যা",
      "কার্যকর পরিবর্তন",
      "তরল ও গ্যাসের গতিশীত তত্ত্ব",
      "যন্ত্রতত্ত্ব ও তরলের গতিমাতা",
      "আলোর তত্ত্ব ও আলোর প্রতিফলন",
      "আধুনিক পদার্থবিজ্ঞানের সূচনা",
      "পরমাণুক্রিয়া",
      "ভৌত বিজ্ঞানের কিছু প্রয়োগ",
    ],
  },
  // রসায়ন is deliberately absent: it already exists with its ten chapters, and
  // seeding it again would either do nothing or fork it into two subjects.
  {
    name: "জীববিজ্ঞান",
    stream: "science",
    chapters: [
      "প্রাণীর বিবরণী ও বিভাজন",
      "কোষের গঠন ও কোষবিভাজন",
      "উদ্ভিদের বিবরণী ও বিভাজন",
      "উদ্ভিদের পুষ্টি ও শোষণ",
      "উদ্ভিদের বৃদ্ধি ও বিকাশ",
      "উদ্ভিদের পরিবহন ও উভিজ্ঞাত",
      "উদ্ভিদের প্রজনন",
      "জীবপুষ্টি",
      "জীবের রাসায়নিক কার্যক্রম",
      "জীবের বৈচিত্র্য ও উন্নয়ন",
      "মানুষের জন্ম ও বিকাশ",
      "জীবের আচরণ",
      "জীবের পরিবেশ ও সম্পর্ক",
    ],
  },
  {
    name: "উচ্চতর গণিত",
    stream: "science",
    chapters: [
      "সমীকরণ ও অসমীকরণ",
      "ফাংশন",
      "বীজগণিত",
      "ত্রিভুজ",
      "চক্র ও চতুর্ভুজ",
      "কোসিন সমীকরণ",
      "ত্রিকোণবিদ্যা ও প্যাটারন",
      "পরিসংখ্যান",
    ],
  },
  {
    name: "ইংরেজি",
    stream: "science",
    chapters: [
      "Prose",
      "Nemo",
      "Grammar & Vocabulary",
      "Writing Skills",
    ],
  },
  {
    name: "ইসলামী শিক্ষা",
    stream: "science",
    chapters: [
      "আকীদাহ",
      "ফিকহ",
      "আখলাক ও ইমান",
      "তাসীর ও হাদীস",
      "ফারাকের বিবরণ",
    ],
  },

  // ── মানবিক ──────────────────────────────────────────────────────────────
  {
    name: "সমাজবিজ্ঞান",
    stream: "humanities",
    chapters: [
      "মানব সমাজের উন্নয়ন",
      "সমাজ ব্যবস্থা ও সামাজিক প্রবণতা",
      "সমাজের মৌলিক প্রতিষ্ঠান",
      "ভূতত্ত্ব ও পরিবেশ",
      "অর্থনৈতিক ব্যবস্থা",
      "সমাজে নেতৃত্ব ও সামাজিক সমতা",
      "পরিবার ও সামাজিক প্রতিষ্ঠান",
      "জাতীয়তা ও নাগরিকতা",
    ],
  },
  {
    name: "পৌরনীতি",
    stream: "humanities",
    chapters: [
      "রাষ্ট্র ও শাসন",
      "সংবিধান",
      "বাংলাদেশের সমাজে সংবাদকার",
      "রাজনৈতিক সংকট ও দলীয়",
      "আন্তর্জাতিক সম্পর্ক",
      "পরিবেশ ও উন্নয়ন",
    ],
  },
  {
    name: "অর্থনীতি",
    stream: "humanities",
    chapters: [
      "অর্থবিজ্ঞানের পরিচিতি",
      "মুদ্রাস্ফীতি ও ব্যাংকিং",
      "আন্তর্জাতিক বাণিজ্য",
      "জাতীয় আয়",
      "পূর্ণ আয়ের ধারণা",
      "সরকারি রাজস্ব",
      "অর্থনৈতিক সমতা",
    ],
  },
  {
    name: "ভূগোল",
    stream: "humanities",
    chapters: [
      "পৃথিবীর পরিচিতি",
      "ভূতত্ত্ব",
      "আবহাওকা",
      "মানচিত্র",
      "জীবন্ত সমাজ",
      "পরিবেশ ও ভূতাত্ত্বিক ঝুঁকি",
    ],
  },
  {
    name: "ইতিহাস",
    stream: "humanities",
    chapters: [
      "প্রাচীন বাংলা",
      "মধ্যযুগীয় বাংলা",
      "আধুনিক বাংলার ভূমিকা",
      "স্বাধীনতা আন্দোলন",
      "ভারতবর্ষ ও পার্শ্ববর্তী দেশ",
      "বিশ্ব ইতিহাসের ধারা",
    ],
  },
  {
    name: "যুক্তিশাস্ত্র",
    stream: "humanities",
    chapters: [
      "যুক্তিবিদ্যার পরিচয়",
      "পদার্থবিদ্যা ও সেট",
      "সূত্র",
      "প্রমাণ",
      "ইন্ডাকশন",
      "বিশেষায়ন",
      "আরোহ বিধান",
    ],
  },

  // ── ব্যবসায় ─────────────────────────────────────────────────────────────
  {
    name: "ফিন্যান্স ও ব্যাংকিং",
    stream: "commerce",
    chapters: [
      "ফিন্যান্সের পরিচিতি",
      "সময়ের মূল্য",
      "ঝুঁকি ও বীমা",
      "উত্তোলন্ত পরিকল্পনা",
      "দেশি ও বৈদেশিক বাণিজ্য",
      "শেয়ার বাজার",
    ],
  },
  {
    name: "উচ্চতর বাংলা",
    stream: "commerce",
    chapters: [
      "ভাষা তত্ত্ব",
      "বাংলা কবিতা",
      "বাংলা গদ্য",
      "বাংলা নাটক",
    ],
  },
];

/** Bangla letters survive the slug: `\p{M}` covers the combining vowel signs. */
export function syllabusSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

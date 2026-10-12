/**
 * One university and the exams under it.
 *
 * The calendar only ever shows three things — the university, its unit and the
 * date — so that is all an admin edits. Everything else the old editor stored
 * (thumbnails, sections, column names, footers, categories) never reached the
 * page.
 */
export interface CalendarGroup {
  /** University or institute name. */
  label: string;
  /** One exam per row: the unit (may be blank) then the date. */
  rows: string[][];
}

/**
 * The ২০২৬–২৭ admission schedule, ordered the way the calendar reads: the soonest
 * exams first. Used when nothing has been saved yet, and as the single source
 * of truth for the seed script — so the data lives here only once.
 *
 * A trailing `*` on a unit marks a date that is expected rather than announced,
 * so it goes on the unit cell — the date cell is parsed for the countdown and
 * must stay a plain date.
 */
export const DEFAULT_CALENDAR_GROUPS: readonly CalendarGroup[] = [
  {
    label: "মেডিকেল",
    rows: [["", "০৪ ডিসেম্বর ২০২৬"]],
  },
  {
    label: "ঢাকা বিশ্ববিদ্যালয়",
    rows: [
      ["IBA", "০৫ ডিসেম্বর ২০২৬"],
      ["A ইউনিট", "১২ ডিসেম্বর ২০২৬"],
      ["B ইউনিট", "১৯ ডিসেম্বর ২০২৬"],
      ["CHA ইউনিট", "২২ ডিসেম্বর ২০২৬"],
      ["C ইউনিট", "২৬ ডিসেম্বর ২০২৬"],
    ],
  },
  {
    label: "এএইউবি",
    rows: [["", "০৫ ডিসেম্বর ২০২৬"]],
  },
  {
    label: "খুলনা বিশ্ববিদ্যালয়",
    rows: [
      ["C ইউনিট", "১৭ ডিসেম্বর ২০২৬"],
      ["D ইউনিট", "১৭ ডিসেম্বর ২০২৬"],
      ["A ইউনিট", "১৮ ডিসেম্বর ২০২৬"],
      ["B ইউনিট", "১৮ ডিসেম্বর ২০২৬"],
    ],
  },
  {
    label: "মিলিটারি ইনস্টিটিউট অব সায়েন্স অ্যান্ড টেকনোলজি (MIST)",
    rows: [
      ["C ইউনিট", "১৮ ডিসেম্বর ২০২৬"],
      ["A ইউনিট", "১৯ ডিসেম্বর ২০২৬"],
      ["B ইউনিট", "১৯ ডিসেম্বর ২০২৬"],
    ],
  },
  {
    label: "বাংলাদেশ ইউনিভার্সিটি অব প্রেসিডেন্স (BUP)",
    rows: [
      ["FBS", "০১ জানুয়ারি ২০২৭"],
      ["FASS", "০২ জানুয়ারি ২০২৭"],
      ["FST", "০৮ জানুয়ারি ২০২৭"],
      ["FSSS", "০৮ জানুয়ারি ২০২৭"],
      ["FBS", "০৯ জানুয়ারি ২০২৭"],
    ],
  },
  {
    label: "কৃষি গুচ্ছ",
    rows: [["", "০২ জানুয়ারি ২০২৭"]],
  },
  {
    label: "খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (কুয়েট)",
    rows: [
      ["A ইউনিট", "০৮ জানুয়ারি ২০২৭"],
      ["B ইউনিট", "০৮ জানুয়ারি ২০২৭"],
    ],
  },
  {
    label: "রাজশাহী বিশ্ববিদ্যালয়",
    rows: [
      ["B ইউনিট*", "০৮ জানুয়ারি ২০২৭"],
      ["C ইউনিট*", "০৯ জানুয়ারি ২০২৭"],
      ["A ইউনিট*", "১৬ জানুয়ারি ২০২৭"],
    ],
  },
  {
    label: "জগন্নাথ বিশ্ববিদ্যালয়",
    rows: [
      ["A ইউনিট", "০১ জানুয়ারি ২০২৭"],
      ["E ইউনিট", "০৮ জানুয়ারি ২০২৭"],
      ["B ইউনিট", "১৫ জানুয়ারি ২০২৭"],
      ["C ইউনিট", "২২ জানুয়ারি ২০২৭"],
      ["D ইউনিট", "২৩ জানুয়ারি ২০২৭"],
    ],
  },
  {
    label: "রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (রুয়েট)",
    rows: [
      ["A ইউনিট*", "১৪ জানুয়ারি ২০২৭"],
      ["B ইউনিট*", "১৪ জানুয়ারি ২০২৭"],
    ],
  },
  {
    label: "বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট)",
    rows: [
      ["A ইউনিট", "১৬ জানুয়ারি ২০২৭"],
      ["B ইউনিট", "১৬ জানুয়ারি ২০২৭"],
    ],
  },
  {
    label: "চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (চুয়েট)",
    rows: [["A ইউনিট*", "২৩ জানুয়ারি ২০২৭"]],
  },
  {
    label: "হাবিপ্রবি",
    rows: [["A ইউনিট*", "২৪ জানুয়ারি ২০২৭"]],
  },
  {
    label: "শাবিপ্রবি",
    rows: [
      ["A1 ইউনিট*", "২৬ জানুয়ারি ২০২৭"],
      ["B ইউনিট*", "২৭ জানুয়ারি ২০২৭"],
    ],
  },
  {
    label: "চট্টগ্রাম বিশ্ববিদ্যালয়",
    rows: [
      ["C ইউনিট*", "২৯ জানুয়ারি ২০২৭"],
      ["A ইউনিট*", "৩০ জানুয়ারি ২০২৭"],
      ["B1 ইউনিট*", "০৩ ফেব্রুয়ারি ২০২৭"],
      ["B2 ইউনিট*", "০৪ ফেব্রুয়ারি ২০২৭"],
      ["B ইউনিট*", "০৫ ফেব্রুয়ারি ২০২৭"],
      ["D ইউনিট*", "০৬ ফেব্রুয়ারি ২০২৭"],
      ["D1 ইউনিট*", "০৮ ফেব্রুয়ারি ২০২৭"],
    ],
  },
  {
    label: "বুটেক্স",
    rows: [["", "২৯ জানুয়ারি ২০২৭"]],
  },
  {
    label: "কুবি",
    rows: [
      ["A ইউনিট", "০৫ ফেব্রুয়ারি ২০২৭"],
      ["B ইউনিট", "০৬ ফেব্রুয়ারি ২০২৭"],
      ["C ইউনিট", "০৭ ফেব্রুয়ারি ২০২৭"],
    ],
  },
  {
    label: "গুচ্ছ",
    rows: [
      ["B ইউনিট", "১৯ মার্চ ২০২৭"],
      ["C ইউনিট", "২০ মার্চ ২০২৭"],
      ["A ইউনিট", "২৭ মার্চ ২০২৭"],
    ],
  },
];

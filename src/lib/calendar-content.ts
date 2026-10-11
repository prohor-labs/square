import type { CalendarCategory } from "@/types";

/**
 * A block of rows under an optional spanning heading, e.g. "ঢাকা বিশ্ববিদ্যালয়".
 * A label-less group becomes a flat table where the first column holds the
 * name itself.
 */
export interface CalendarTableGroup {
  label: string;
  rows: string[][];
}

export interface CalendarTableSection {
  /** Optional divider label between sections on the public page. */
  title: string;
  columns: string[];
  groups: CalendarTableGroup[];
  /** Only the last section of a category renders this. */
  footer: string;
}

export interface CalendarCategoryContent {
  category: CalendarCategory;
  thumbnail: string;
  thumbnailAlt: string;
  sections: CalendarTableSection[];
}

const FOOTER = "সহজ হোক প্রতিটি প্রস্তুতি\n- SQUARE Engr. Platform";

// Last column holds the exam date — the countdown column is derived from it.
// The first column is the unit and is left empty when the exam has none.
const UNIT_COLUMNS = ["ইউনিট", "পরীক্ষার তারিখ"];

// First-run content for each admission track, following the ২০২৬–২৭ admission
// schedule. Used as the fallback when there is no saved row yet (including when
// the database is unreachable), and as the single source of truth for the seed
// script — so the data lives here only once. Any admin save overrides this.
//
// A trailing `*` on a unit marks a date that is expected rather than announced,
// so it goes on the unit cell — the date cell is parsed for the countdown and
// must stay a plain date.
export const DEFAULT_CALENDAR_CONTENT: readonly CalendarCategoryContent[] = [
  {
    category: "medical",
    thumbnail:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200",
    thumbnailAlt: "মেডিকেল ভর্তি পরীক্ষা",
    sections: [
      {
        title: "",
        columns: UNIT_COLUMNS,
        groups: [
          {
            label: "মেডিকেল*",
            rows: [["", "০৪ ডিসেম্বর ২০২৬"]],
          },
        ],
        footer: FOOTER,
      },
    ],
  },
  {
    category: "varsity",
    thumbnail:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200",
    thumbnailAlt: "ভার্সিটি ভর্তি পরীক্ষা",
    sections: [
      {
        title: "",
        columns: UNIT_COLUMNS,
        groups: [
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
            label: "রাজশাহী বিশ্ববিদ্যালয়",
            rows: [
              ["B ইউনিট*", "০৮ জানুয়ারি ২০২৭"],
              ["C ইউনিট*", "০৯ জানুয়ারি ২০২৭"],
              ["A ইউনিট*", "১৬ জানুয়ারি ২০২৭"],
            ],
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
        ],
        footer: "",
      },
      {
        title: "অন্যান্য বিশ্ববিদ্যালয়",
        columns: UNIT_COLUMNS,
        groups: [
          { label: "এএইউবি", rows: [["", "০৫ ডিসেম্বর ২০২৬"]] },
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
          { label: "বুটেক্স", rows: [["", "২৯ জানুয়ারি ২০২৭"]] },
          {
            label: "কুবি",
            rows: [
              ["A ইউনিট", "০৫ ফেব্রুয়ারি ২০২৭"],
              ["B ইউনিট", "০৬ ফেব্রুয়ারি ২০২৭"],
              ["C ইউনিট", "০৭ ফেব্রুয়ারি ২০২৭"],
            ],
          },
        ],
        footer: FOOTER,
      },
    ],
  },
  {
    category: "engineering",
    thumbnail:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=1200",
    thumbnailAlt: "ইঞ্জিনিয়ারিং ভর্তি পরীক্ষা",
    sections: [
      {
        title: "",
        columns: UNIT_COLUMNS,
        groups: [
          {
            label: "মিলিটারি ইনস্টিটিউট অব সায়েন্স অ্যান্ড টেকনোলজি (MIST)",
            rows: [
              ["C ইউনিট", "১৮ ডিসেম্বর ২০২৬"],
              ["A ইউনিট", "১৯ ডিসেম্বর ২০২৬"],
              ["B ইউনিট", "১৯ ডিসেম্বর ২০২৬"],
            ],
          },
          {
            label: "খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (কুয়েট)",
            rows: [
              ["A ইউনিট", "০৮ জানুয়ারি ২০২৭"],
              ["B ইউনিট", "০৮ জানুয়ারি ২০২৭"],
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
        ],
        footer: FOOTER,
      },
    ],
  },
  {
    category: "guchcho",
    thumbnail:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1200",
    thumbnailAlt: "গুচ্ছ ভর্তি পরীক্ষা",
    sections: [
      {
        title: "কৃষি বিশ্ববিদ্যালয় ভর্তি পরীক্ষা",
        columns: UNIT_COLUMNS,
        groups: [{ label: "কৃষি গুচ্ছ", rows: [["", "০২ জানুয়ারি ২০২৭"]] }],
        footer: "",
      },
      {
        title: "গুচ্ছ ভর্তি পরীক্ষা",
        columns: UNIT_COLUMNS,
        groups: [
          {
            label: "গুচ্ছ",
            rows: [
              ["B ইউনিট", "১৯ মার্চ ২০২৭"],
              ["C ইউনিট", "২০ মার্চ ২০২৭"],
              ["A ইউনিট", "২৭ মার্চ ২০২৭"],
            ],
          },
        ],
        footer: FOOTER,
      },
    ],
  },
];

export function getDefaultCalendarContent(
  category: CalendarCategory,
): CalendarCategoryContent {
  return (
    DEFAULT_CALENDAR_CONTENT.find((item) => item.category === category) ?? {
      category,
      thumbnail: "",
      thumbnailAlt: "",
      sections: [],
    }
  );
}

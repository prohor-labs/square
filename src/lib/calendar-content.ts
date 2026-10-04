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
const UNIT_COLUMNS = ["ইউনিট", "পরীক্ষার তারিখ"];
const DATE_ONLY_COLUMNS = ["পরীক্ষার তারিখ"];

// First-run content for each admission track. Used as the fallback when there is
// no saved row yet (including when the database is unreachable), and as the
// single source of truth for the seed script — so the data lives here only once.
// Any admin save overrides this.
//
// December falls in the current admission year, January in the next one.
// Unit names carry no university prefix: it already sits in the group heading.
export const DEFAULT_CALENDAR_CONTENT: readonly CalendarCategoryContent[] = [
  {
    category: "medical",
    thumbnail:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200",
    thumbnailAlt: "মেডিকেল ভর্তি পরীক্ষা",
    sections: [],
  },
  {
    category: "varsity",
    thumbnail:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200",
    thumbnailAlt: "ভার্সিটি ভর্তি পরীক্ষা",
    sections: [
      {
        // Section titles stay empty by default — the admin can add one, which
        // then shows as a divider label on /calendar.
        title: "",
        columns: UNIT_COLUMNS,
        groups: [
          {
            label: "ঢাকা বিশ্ববিদ্যালয়",
            rows: [
              ["আইবিএ", "০৫ ডিসেম্বর ২০২৬"],
              ["ক ইউনিট", "১২ ডিসেম্বর ২০২৬"],
              ["খ ইউনিট", "১৯ ডিসেম্বর ২০২৬"],
              ["চ ইউনিট", "২২ ডিসেম্বর ২০২৬"],
              ["গ ইউনিট", "২৬ ডিসেম্বর ২০২৬"],
            ],
          },
          {
            label: "রাজশাহী বিশ্ববিদ্যালয়",
            rows: [
              ["খ ইউনিট", "০৮ জানুয়ারি ২০২৭"],
              ["গ ইউনিট", "০৯ জানুয়ারি ২০২৭"],
              ["ক ইউনিট", "১৬ জানুয়ারি ২০২৭"],
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
        ],
        footer: "",
      },
      {
        title: "",
        columns: UNIT_COLUMNS,
        groups: [
          {
            label: "বাংলাদেশ ইউনিভার্সিটি অব প্রেসিডেন্স (বিইউপি)",
            rows: [
              ["FBS", "০১/০৯ জানুয়ারি ২০২৭"],
              ["FASS", "০২ জানুয়ারি ২০২৭"],
              ["FST", "০৮ জানুয়ারি ২০২৭"],
              ["FSSS", "০৮ জানুয়ারি ২০২৭"],
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
            label: "মিলিটারি ইনস্টিটিউট অব সায়েন্স অ্যান্ড টেকনোলজি (এমআইএসটি)",
            rows: [
              ["ইউনিট C", "১৮ ডিসেম্বর ২০২৬"],
              ["ইউনিট B", "১৯ ডিসেম্বর ২০২৬"],
              ["ইউনিট A", "১৯ ডিসেম্বর ২০২৬"],
            ],
          },
        ],
        footer: "",
      },
      {
        title: "",
        // Engineering universities have no sub-units, so only the date column
        // is shown and each university gets its own card.
        columns: DATE_ONLY_COLUMNS,
        groups: [
          { label: "কুয়েট", rows: [["০৮ জানুয়ারি ২০২৭"]] },
          { label: "রুয়েট", rows: [["১৪ জানুয়ারি ২০২৭"]] },
          { label: "বুয়েট", rows: [["১৬ জানুয়ারি ২০২৭"]] },
          { label: "কুয়েট", rows: [["২৩ জানুয়ারি ২০২৭"]] },
          { label: "বুটেক্স", rows: [["২৯ জানুয়ারি ২০২৭"]] },
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
    sections: [],
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

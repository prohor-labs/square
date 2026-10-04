import type { IconComponent } from "reicon-react/createIcon";
import { Building, Calculator, GradCap, Stethoscope } from "@/components/icons";
import { CALENDAR_CATEGORIES } from "@/types";

export const CALENDAR_CATEGORY_ORDER = CALENDAR_CATEGORIES;

// Display metadata for the calendar. Deliberately free of DB imports so client
// components can use it without pulling drizzle into the bundle — the
// `satisfies Record<…>` below keeps it in sync with the category union.
export interface CalendarCategoryMeta {
  readonly label: string;
  readonly icon: IconComponent;
  /** Icon and heading colour. */
  readonly accent: string;
  /** Selected-category chip styling. */
  readonly chip: string;
  /** Solid dot colour used in legends. */
  readonly dot: string;
}

export const CALENDAR_CATEGORY_META = {
  medical: {
    label: "মেডিকেল",
    icon: Stethoscope,
    accent: "text-rose-600 dark:text-rose-400",
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    dot: "bg-rose-500",
  },
  varsity: {
    label: "ভার্সিটি",
    icon: GradCap,
    accent: "text-sky-600 dark:text-sky-400",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
    dot: "bg-sky-500",
  },
  engineering: {
    label: "ইঞ্জিনিয়ারিং",
    icon: Calculator,
    accent: "text-violet-600 dark:text-violet-400",
    chip: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
    dot: "bg-violet-500",
  },
  guchcho: {
    label: "গুচ্ছ",
    icon: Building,
    accent: "text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
} satisfies Record<(typeof CALENDAR_CATEGORIES)[number], CalendarCategoryMeta>;

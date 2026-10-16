/**
 * What a course feature is, and how it gets read out of the database.
 *
 * `batch_details.features` used to be a plain list of strings. Each entry now
 * carries an icon name alongside its text, so the admin can pick the picture
 * that matches the feature. Older rows are still plain strings, so everything
 * funnels through `toCourseFeatures` rather than trusting the shape.
 */

/** One line of a course's feature list. */
export interface CourseFeature {
  readonly label: string;
  /** A key from the icon registry; falls back when unknown. */
  readonly icon: string;
}

/** Shown when a feature has no icon yet, or names one that no longer exists. */
export const DEFAULT_FEATURE_ICON = "Check";

/**
 * Groups for the picker, in the order the admin sees them.
 *
 * The words here double as search terms, so a course about examinations finds
 * its icons from either a Bangla or an English query.
 */
export const FEATURE_ICON_GROUPS = [
  {
    id: "schedule",
    label: "সময় ও রুটিন",
    keywords:
      "সময় রুটিন ক্যালেন্ডার টাইমার রিপিট দৈনিক সাপ্তাহিক schedule routine calendar time timer daily weekly repeat",
  },
  {
    id: "exam",
    label: "পরীক্ষা ও প্রশ্ন",
    keywords:
      "পরীক্ষা প্রশ্ন প্রশ্নব্যাংক বই নোট লেখা মডেল কুইজ মডিউল exam question bank book note model test quiz paper",
  },
  {
    id: "result",
    label: "মার্ক ও ফলাফল",
    keywords:
      "মার্ক নম্বর ফলাফল রিজাল্ট স্কোর র‍্যাংকিং চার্ট গণিত তথ্য score marks result rank chart math data",
  },
  {
    id: "live",
    label: "লাইভ ও ক্লাস",
    keywords:
      "লাইভ ক্লাস ভিডিও রেকর্ডিং ক্যামেরা মাইক শিক্ষক শিক্ষার্থী গ্রুপ live class video record camera mic teacher student group",
  },
  {
    id: "success",
    label: "সাফল্য ও সনদ",
    keywords:
      "সাফল্য সনদ সার্টিফিকেট স্নাতক স্কুল স্বীকৃতি সুরক্ষা সিলিং মোটিভেশন success certificate diploma graduation school verified shield",
  },
  {
    id: "support",
    label: "সাপোর্ট ও যোগাযোগ",
    keywords:
      "সাপোর্ট সাহায্য চ্যাট মেসেজ ফোন ইমেইল নোটিফিকেশন হেল্পলাইন support help chat message phone call mail notification",
  },
  {
    id: "money",
    label: "টাকা ও অফার",
    keywords:
      "টাকা দাম ছাড় অফার পেমেন্ট ওয়ালেট ব্যাংকনোট কুপন মূল্য price money discount offer payment wallet coupon taka",
  },
  {
    id: "misc",
    label: "বিশেষ",
    keywords:
      "সাধারণ অন্যান্য আইডিয়া জাদু গোপন সুরক্ষা মূল তথ্য misc other idea magic lock key security general",
  },
] as const;

export type FeatureIconGroupId = (typeof FEATURE_ICON_GROUPS)[number]["id"];

/**
 * One selectable icon.
 *
 * `name` is what gets stored in the database, so it must stay stable — the
 * component that draws it lives in the registry beside it.
 */
export interface FeatureIconChoice {
  readonly name: string;
  /** Bangla name, so the admin can search in the language they work in. */
  readonly label: string;
  readonly group: FeatureIconGroupId;
}

/**
 * Turns whatever is in the database into something renderable.
 *
 * A plain string, an object without an icon, or an object naming an icon that
 * has since been removed from the registry — all three still come out the far
 * side with a label and a drawable icon, because a course page failing to load
 * over a cosmetic detail helps nobody.
 */
export function toCourseFeatures(raw: unknown): CourseFeature[] {
  if (!Array.isArray(raw)) return [];

  const out: CourseFeature[] = [];
  for (const entry of raw) {
    if (typeof entry === "string") {
      const label = entry.trim();
      if (label) out.push({ label, icon: DEFAULT_FEATURE_ICON });
      continue;
    }
    if (!entry || typeof entry !== "object") continue;

    const record = entry as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label.trim() : "";
    if (!label) continue;

    const icon = typeof record.icon === "string" ? record.icon.trim() : "";
    out.push({ label, icon: icon || DEFAULT_FEATURE_ICON });
  }
  return out;
}

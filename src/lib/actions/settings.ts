"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  type CalendarCategoryContent,
  getDefaultCalendarContent,
} from "@/lib/calendar-content";
import { CALENDAR_CATEGORIES } from "@/types";

export interface SliderItem {
  id: string;
  url: string;
  alt: string;
  title?: string;
  link?: string;
}

const DEFAULT_SLIDERS: SliderItem[] = [
  {
    id: "slide-1",
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200",
    alt: "Slider 1",
    title: "স্কয়ার এডুকেশন প্ল্যাটফর্ম",
  },
  {
    id: "slide-2",
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200",
    alt: "Slider 2",
    title: "অনলাইন প্র্যাকটিস ও পূর্ণাঙ্গ মডেল টেস্ট",
  },
  {
    id: "slide-3",
    url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200",
    alt: "Slider 3",
    title: "সেরা মেন্টরদের সাথে প্রস্তুতি",
  },
];

export async function getHeroSliders(): Promise<SliderItem[]> {
  try {
    const setting = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, "hero_sliders"),
    });

    if (setting?.value && Array.isArray(setting.value)) {
      return setting.value as SliderItem[];
    }
    return DEFAULT_SLIDERS;
  } catch (error) {
    console.error("Failed to fetch hero sliders:", error);
    return DEFAULT_SLIDERS;
  }
}

export async function updateHeroSliders(sliders: SliderItem[]) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "admin") {
      return {
        success: false,
        error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিনরা স্লাইডার পরিবর্তন করতে পারবেন।",
      };
    }

    const existing = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, "hero_sliders"),
    });

    if (existing) {
      await db
        .update(siteSettings)
        .set({
          value: sliders,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.key, "hero_sliders"));
    } else {
      await db.insert(siteSettings).values({
        key: "hero_sliders",
        value: sliders,
        updatedAt: new Date(),
      });
    }

    revalidatePath("/");
    revalidatePath("/admin/sliders");

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "স্লাইডার আপডেট করতে সমস্যা হয়েছে",
    };
  }
}

// ─── Calendar category content (thumbnail + custom info tables) ───────────────
// Stored as JSON in `site_settings`, same as `hero_sliders`. Each of the four
// admission tracks owns one thumbnail and any number of titled table sections.

export type {
  CalendarCategoryContent,
  CalendarTableGroup,
  CalendarTableSection,
} from "@/lib/calendar-content";

const CALENDAR_CONTENT_KEY = "calendar_categories";

/**
 * Public read. Always returns one entry per category, falling back to the
 * built-in default content for any track the admin has not saved yet — and for
 * every track when the database is unreachable, so the page still renders.
 */
export async function getCalendarCategoryContent(): Promise<
  CalendarCategoryContent[]
> {
  try {
    const setting = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, CALENDAR_CONTENT_KEY),
    });

    const stored = Array.isArray(setting?.value)
      ? (setting.value as CalendarCategoryContent[])
      : [];
    const byCategory = new Map(stored.map((item) => [item.category, item]));

    return CALENDAR_CATEGORIES.map(
      (category) =>
        byCategory.get(category) ?? getDefaultCalendarContent(category),
    );
  } catch (error) {
    console.error("Failed to fetch calendar category content:", error);
    return CALENDAR_CATEGORIES.map(getDefaultCalendarContent);
  }
}

export async function updateCalendarCategoryContent(
  items: CalendarCategoryContent[],
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "admin") {
      return {
        success: false,
        error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিনরা কনটেন্ট পরিবর্তন করতে পারবেন।",
      };
    }

    // Rows are re-padded to the current column count, so a stale row width from
    // the editor can never break rendering downstream.
    const value = items.map((item) => ({
      category: item.category,
      thumbnail: item.thumbnail.trim(),
      thumbnailAlt: item.thumbnailAlt.trim(),
      sections: item.sections.map((section) => ({
        title: section.title.trim(),
        columns: section.columns.map((column) => column.trim()),
        groups: section.groups.map((group) => ({
          label: group.label.trim(),
          rows: group.rows.map((row) =>
            section.columns.map((_, index) => (row[index] ?? "").trim()),
          ),
        })),
        footer: section.footer.trim(),
      })),
    }));

    const existing = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, CALENDAR_CONTENT_KEY),
    });

    if (existing) {
      await db
        .update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, CALENDAR_CONTENT_KEY));
    } else {
      await db.insert(siteSettings).values({
        key: CALENDAR_CONTENT_KEY,
        value,
        updatedAt: new Date(),
      });
    }

    revalidatePath("/calendar");
    revalidatePath("/admin/calendar");

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ক্যালেন্ডার কনটেন্ট সংরক্ষণ করতে সমস্যা হয়েছে",
    };
  }
}

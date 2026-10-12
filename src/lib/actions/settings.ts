"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  type CalendarGroup,
  DEFAULT_CALENDAR_GROUPS,
} from "@/lib/calendar-content";

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

// ─── Calendar groups ───────────────────────────────────────────────────────────
// Stored as JSON in `site_settings`, same as `hero_sliders`. One flat list of
// universities and their exam dates — the only thing the calendar renders.

export type { CalendarGroup } from "@/lib/calendar-content";

const CALENDAR_CONTENT_KEY = "calendar_groups";

/**
 * Public read. Falls back to the built-in schedule when nothing is saved, and
 * again when the database is unreachable, so the page always renders.
 */
export async function getCalendarGroups(): Promise<CalendarGroup[]> {
  try {
    const setting = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, CALENDAR_CONTENT_KEY),
    });

    const stored = Array.isArray(setting?.value)
      ? (setting.value as CalendarGroup[])
      : [];

    return stored.length > 0 ? stored : [...DEFAULT_CALENDAR_GROUPS];
  } catch (error) {
    console.error("Failed to fetch calendar groups:", error);
    return [...DEFAULT_CALENDAR_GROUPS];
  }
}

export async function updateCalendarGroups(groups: CalendarGroup[]) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "admin") {
      return {
        success: false,
        error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিনরা কনটেন্ট পরিবর্তন করতে পারবেন।",
      };
    }

    // Every row is re-padded to two cells, so a stale width from the editor can
    // never break rendering downstream. A row with neither cell is dropped, or
    // it would render as an empty line on the calendar.
    const value = groups.map((group) => ({
      label: group.label.trim(),
      rows: group.rows
        .map((row) => [(row[0] ?? "").trim(), (row[1] ?? "").trim()])
        .filter((row) => row[0] !== "" || row[1] !== ""),
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
      error: error instanceof Error ? error.message : "সংরক্ষণ করতে সমস্যা হয়েছে",
    };
  }
}

import { eq } from "drizzle-orm";
import { db } from "../db";
import { siteSettings } from "../db/schema";
import { DEFAULT_CALENDAR_CONTENT } from "../lib/calendar-content";

const CONTENT_KEY = "calendar_categories";

async function main() {
  console.log("Saving calendar thumbnails and info tables...");

  const value = DEFAULT_CALENDAR_CONTENT.map((item) => ({
    category: item.category,
    thumbnail: item.thumbnail,
    thumbnailAlt: item.thumbnailAlt,
    sections: item.sections,
  }));

  const existing = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.key, CONTENT_KEY),
  });

  if (existing) {
    await db
      .update(siteSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(siteSettings.key, CONTENT_KEY));
    console.log("Existing calendar_categories row updated.");
  } else {
    await db
      .insert(siteSettings)
      .values({ key: CONTENT_KEY, value, updatedAt: new Date() });
    console.log("New calendar_categories row inserted.");
  }

  for (const item of value) {
    const rows = item.sections.reduce(
      (total, section) =>
        total +
        section.groups.reduce((sum, group) => sum + group.rows.length, 0),
      0,
    );
    console.log(
      `  ${item.category}: ${item.sections.length} section(s), ${rows} row(s)`,
    );
  }

  console.log("Calendar content seed completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding calendar content:", err);
  process.exit(1);
});

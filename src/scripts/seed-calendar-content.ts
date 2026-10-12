import { eq } from "drizzle-orm";
import { db } from "../db";
import { siteSettings } from "../db/schema";
import { DEFAULT_CALENDAR_GROUPS } from "../lib/calendar-content";

const CONTENT_KEY = "calendar_groups";

async function main() {
  console.log("Saving the admission exam schedule...");

  const value = DEFAULT_CALENDAR_GROUPS.map((group) => ({
    label: group.label,
    rows: group.rows,
  }));

  const existing = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.key, CONTENT_KEY),
  });

  if (existing) {
    await db
      .update(siteSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(siteSettings.key, CONTENT_KEY));
    console.log("Existing calendar_groups row updated.");
  } else {
    await db
      .insert(siteSettings)
      .values({ key: CONTENT_KEY, value, updatedAt: new Date() });
    console.log("New calendar_groups row inserted.");
  }

  const rows = value.reduce((total, group) => total + group.rows.length, 0);
  console.log(`  ${value.length} universities, ${rows} exams`);

  console.log("Calendar content seed completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding calendar content:", err);
  process.exit(1);
});

/**
 * Course mentors, and how they get read out of the database.
 *
 * `batch_details.mentor_ids` is a JSON list of `{ name, role, institution }`.
 * A picture is optional on top of that — a course can be perfectly well
 * described by name alone — so the image is normalised to a plain string and
 * every reader decides what to show when it is empty.
 */

/** One person who teaches or supports a course. */
export interface CourseMentor {
  readonly name: string;
  readonly role: string;
  readonly institution: string;
  /** Blank when no picture has been set. */
  readonly image: string;
}

const blank = (name = ""): CourseMentor => ({
  name,
  role: "",
  institution: "",
  image: "",
});

/**
 * Turns whatever sits in the database into something renderable.
 *
 * Entries that are plain strings — an older shape, or a name typed straight
 * into the field — come out with the name filled and the rest empty rather
 * than dropping the person off the page.
 */
export function toCourseMentors(raw: unknown): CourseMentor[] {
  if (!Array.isArray(raw)) return [];

  const out: CourseMentor[] = [];
  for (const entry of raw) {
    if (typeof entry === "string") {
      const name = entry.trim();
      if (name) out.push(blank(name));
      continue;
    }
    if (!entry || typeof entry !== "object") continue;

    const record = entry as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!name) continue;

    out.push({
      name,
      role: typeof record.role === "string" ? record.role.trim() : "",
      institution:
        typeof record.institution === "string" ? record.institution.trim() : "",
      image: typeof record.image === "string" ? record.image.trim() : "",
    });
  }
  return out;
}

/**
 * The first letter of a name, for the placeholder when there is no picture.
 *
 * Bengali and Latin names both start with a single character, so there is no
 * need to care which script the name is written in.
 */
export function mentorInitial(name: string): string {
  return name.trim().charAt(0);
}

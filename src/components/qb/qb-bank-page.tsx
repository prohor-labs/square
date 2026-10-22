import type { ReactElement } from "react";
import { QbStudentLibrary } from "@/components/qb/qb-student-library";
import { getQbFileSummaries } from "@/lib/qb-bank";

/**
 * The question bank screen, shared by `/qb`, `/admin/qb` and
 * `/admin/qb/add-question`.
 *
 * Everyone — students and admins alike — gets the same read-only library, so
 * what an admin reviews on these routes is exactly what students see. Uploads
 * and management stay on the dedicated admin routes.
 */
export async function QbBankPage(): Promise<ReactElement> {
  const files = await getQbFileSummaries();
  return <QbStudentLibrary files={files} />;
}

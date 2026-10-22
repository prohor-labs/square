import type { ReactElement } from "react";
import { QbFilePage } from "@/components/qb/qb-file-page";

export const dynamic = "force-dynamic";

/**
 * Canonical file page: `/qb/file/<setId>`.
 *
 * The shorter `/qb/<setId>` keeps working for old bookmarks, but UI links use
 * this path so they can never be caught by the legacy redirect that browsers
 * have cached from earlier releases.
 */
export default async function QbFileByIdPage({
  params,
}: {
  readonly params: Promise<{ setId: string }>;
}): Promise<ReactElement> {
  const { setId } = await params;
  return <QbFilePage setId={setId} />;
}

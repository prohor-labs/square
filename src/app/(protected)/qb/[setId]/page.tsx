import type { ReactElement } from "react";
import { QbFilePage } from "@/components/qb/qb-file-page";

export const dynamic = "force-dynamic";

/** Backwards-compatible file page (`/qb/<setId>`); see `QbFilePage`. */
export default async function QbFilePageLegacyRoute({
  params,
}: {
  readonly params: Promise<{ setId: string }>;
}): Promise<ReactElement> {
  const { setId } = await params;
  return <QbFilePage setId={setId} />;
}

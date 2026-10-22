import type { ReactElement } from "react";
import { QbBankPage } from "@/components/qb/qb-bank-page";

export const dynamic = "force-dynamic";

/**
 * `/admin/qb` mirrors the read-only student library so admins review the bank
 * exactly as students see it. Management lives on the `[containerSlug]` routes.
 */
export default async function AdminQbBanksPage(): Promise<ReactElement> {
  return <QbBankPage />;
}

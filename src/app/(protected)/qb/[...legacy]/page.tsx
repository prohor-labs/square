import { redirect } from "next/navigation";
import type { ReactElement } from "react";

export const dynamic = "force-dynamic";

/**
 * Old question-bank hierarchy URLs (`/qb/<container>/<item>/...`) that no
 * longer exist land on the bank instead of a 404.
 *
 * This replaces the `redirects()` rule that used to live in `next.config.ts`.
 * That rule was permanent (308), and browsers cache permanent redirects
 * forever — which made the file pages unreachable long after the rule was
 * narrowed. `redirect()` here answers with a 307, so it can be changed later
 * without poisoning caches.
 */
export default function LegacyQbRoute(): ReactElement {
  redirect("/qb");
}

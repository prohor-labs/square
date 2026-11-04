import { redirect } from "next/navigation";

/**
 * The old poll entry point is now the custom exam.
 *
 * This lives outside `(protected)` so a bookmark still lands on the public
 * exam even when the visitor is logged out.
 */
export default function PollRedirectPage() {
  redirect("/exam");
}

import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";

/**
 * The current session, read once per server request.
 *
 * A layout, a page and an action can all ask for the session while rendering
 * the same request. Without this cache each call is a separate round trip to
 * the auth database (which is remote), so the /qb filter used to pay for the
 * same lookup twice before it even started reading questions.
 */
export const getCachedSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

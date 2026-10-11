"use client";

import { toast } from "sonner";

/** Shown wherever a feature is on screen but not finished yet. */
export const NOT_READY_MESSAGE = "এই সিস্টেমটি এখনো প্রস্তুত নয়";

/** Used by every entry that is visible but cannot be opened yet. */
export function notifyNotReady(): void {
  toast.info(NOT_READY_MESSAGE);
}

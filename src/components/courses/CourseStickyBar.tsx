"use client";

import { EnrollAction } from "@/components/courses/EnrollAction";

/**
 * The price and the call to action, pinned to the bottom of the screen.
 *
 * On a phone the sidebar has scrolled away long before the student reaches the
 * FAQ, and the enrolment button is the one thing that must never be out of
 * reach — so it travels with the viewport. Hidden on desktop, where the sticky
 * sidebar already holds the same pair and a second bar would just compete with
 * it.
 */
export function CourseStickyBar({
  courseId,
  courseName,
  slug,
  price,
  originalPrice,
  userId,
  status,
}: {
  readonly courseId: string;
  readonly courseName: string;
  readonly slug: string;
  readonly price: number;
  readonly originalPrice?: number | null;
  readonly userId?: string;
  readonly status: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
      {/* Room for the browser's own bottom bar on iOS. */}
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex min-w-0 flex-col">
          {originalPrice ? (
            <span className="text-[11px] font-semibold text-muted-foreground line-through tabular-nums">
              ৳{originalPrice}
            </span>
          ) : null}
          <span className="text-xl leading-none font-black text-emerald-600 tabular-nums dark:text-emerald-500">
            ৳{price}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <EnrollAction
            courseId={courseId}
            courseName={courseName}
            slug={slug}
            price={price}
            userId={userId}
            status={status}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}

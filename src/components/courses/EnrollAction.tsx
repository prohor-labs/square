"use client";

import Link from "next/link";
import { CheckoutModal } from "@/components/checkout-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The one call to action for a course, in every state it can be in.
 *
 * It appears twice on the page — in the sidebar and on the fixed bottom bar —
 * so the decision of what the button says and where it goes lives here once.
 * Without that, a new state would have to be added in two places and the bar
 * would quietly drift out of step with the sidebar.
 */
export function EnrollAction({
  courseId,
  courseName,
  slug,
  price,
  userId,
  status,
  size = "lg",
}: {
  readonly courseId: string;
  readonly courseName: string;
  readonly slug: string;
  readonly price: number;
  readonly userId?: string;
  readonly status: string;
  /** "lg" for the sidebar, "sm" for the bottom bar. */
  readonly size?: "lg" | "sm";
}) {
  const tall = size === "lg";
  const buttonClass = cn(
    "w-full bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold rounded-xl shadow-md transition-all cursor-pointer",
    tall
      ? "py-4 h-auto text-sm hover:scale-101"
      : "h-11 text-xs shadow-xs hover:scale-[1.01]",
  );

  if (status === "active") {
    return (
      <Button
        render={<Link href={`/my-courses/${courseId}`} />}
        className={cn(
          buttonClass,
          "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-100",
        )}
      >
        ইতিমধ্যে যুক্ত আছো &rarr;
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <div
        className={cn(
          "w-full rounded-xl border border-amber-500/30 bg-amber-500/10 text-center font-extrabold text-amber-600 shadow-xs",
          tall ? "py-3.5 text-sm" : "h-11 text-xs",
        )}
      >
        পেমেন্ট ভেরিফিকেশন প্রক্রিয়াধীন
      </div>
    );
  }

  if (!userId) {
    return (
      <Button
        render={<Link href={`/login?callbackUrl=/courses/${slug}`} />}
        className={buttonClass}
      >
        এখনই ভর্তি হোন
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {status === "rejected" && tall && (
        <div className="w-full rounded-xl border border-destructive/30 bg-destructive/10 text-center text-xs font-bold leading-snug text-destructive shadow-xs">
          পূর্বের পেমেন্ট রিকোয়েস্ট বাতিল হয়েছে। সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।
        </div>
      )}
      <CheckoutModal
        batchId={courseId}
        batchTitle={courseName}
        price={price}
        userId={userId}
      >
        <Button className={buttonClass}>
          {status === "rejected" ? "পুনরায় ভর্তি হোন" : "এখনই ভর্তি হোন"}
        </Button>
      </CheckoutModal>
    </div>
  );
}

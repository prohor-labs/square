import Link from "next/link";
import type { ReactElement } from "react";
import { Notification as QuestionIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

/**
 * Placeholder until the admin panel has a Q&A screen to write into. The page
 * exists so the sidebar link lands somewhere honest rather than a 404.
 */
export default function QaPage(): ReactElement {
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-16 pt-1 sm:pt-4 gap-5 px-2 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          প্রশ্ন ও উত্তর
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          সাধারণ জিজ্ঞাসা ও উত্তর
        </p>
      </div>

      <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl bg-muted/10 px-6">
        <div className="size-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4 text-primary">
          <QuestionIcon className="size-7" />
        </div>
        <p className="font-bold text-lg">এখনো কোনো প্রশ্ন ও উত্তর যোগ করা হয়নি</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md">
          সাপোর্ট টিমের পাঠানো প্রশ্ন ও উত্তর এখানে দেখা যাবে। জিজ্ঞাসা থাকলে টেলিগ্রাম গ্রুপে
          জানান।
        </p>
        <Link href="/qb" className="mt-6">
          <Button className="rounded-xl px-6 h-11 text-sm font-semibold">
            প্রশ্নব্যাংক দেখুন
          </Button>
        </Link>
      </div>
    </div>
  );
}

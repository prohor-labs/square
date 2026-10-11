import Link from "next/link";
import type { ReactElement } from "react";
import { DocumentDownload } from "@/components/icons";
import { Button } from "@/components/ui/button";

/**
 * Placeholder until solve sheets are uploaded. The page exists so the sidebar
 * link lands somewhere honest rather than a 404.
 */
export default function SolveSheetPage(): ReactElement {
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-16 pt-1 sm:pt-4 gap-5 px-2 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          সলভ শিট
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          সমাধানের নমুনা ও প্রশ্ন-পত্র
        </p>
      </div>

      <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl bg-muted/10 px-6">
        <div className="size-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4 text-primary">
          <DocumentDownload className="size-7" />
        </div>
        <p className="font-bold text-lg">এখনো কোনো সলভ শিট যোগ করা হয়নি</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md">
          অ্যাডমিন প্যানেল থেকে সলভ শিট আপলোড করলে সেগুলো এখানে দেখা যাবে।
        </p>
        <Link href="/pdf" className="mt-6">
          <Button className="rounded-xl px-6 h-11 text-sm font-semibold">
            পিডিএফ ও নোট দেখুন
          </Button>
        </Link>
      </div>
    </div>
  );
}

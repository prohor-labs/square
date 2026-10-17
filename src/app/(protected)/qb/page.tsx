import type { ReactElement } from "react";

export const dynamic = "force-dynamic";

/**
 * The bank is closed for now.
 *
 * The link stays in the menu so the slot is where it was, but there is nothing
 * behind it: the questions and every exam built on them are untouched, and the
 * admin screen still works. This page exists only so the menu item leads
 * somewhere honest rather than a 404.
 */
export default function QbPage(): ReactElement {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-5 pb-12 pt-2 md:py-8">
      <nav
        aria-label="ব্রেডক্রাম"
        className="text-xs text-muted-foreground sm:text-sm"
      >
        প্রশ্নব্যাংক
      </nav>

      <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center">
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          প্রশ্নব্যাংক
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          প্রশ্নব্যাংকটি এখন নতুন করে সাজানো হচ্ছে। খুব শীঘ্রই এখানে নতুন প্রশ্ন যোগ করা হবে।
        </p>
        <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground">
          আপনার পরীক্ষা ও পরীক্ষার প্রশ্ন যেমন ছিল তেমনই আছে — সেগুলোতে কোনো পরিবর্তন
          হয়নি।
        </p>
      </div>
    </div>
  );
}

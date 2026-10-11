import Link from "next/link";
import type { ReactElement } from "react";
import { Video } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { NOT_READY_MESSAGE } from "@/lib/not-ready";

export const dynamic = "force-dynamic";

/**
 * Live classes are not built yet. The page stays reachable by direct link and
 * says so, so the "not ready" answer is the same everywhere the feature
 * appears.
 */
export default function LiveClassesPage(): ReactElement {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-5 pb-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
          লাইভ ক্লাস
        </h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          কোর্স বেছে নিয়ে তার লাইভ ক্লাস দেখুন
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-muted/10 px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Video className="size-7" />
        </div>
        <p className="text-lg font-bold">{NOT_READY_MESSAGE}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          লাইভ ক্লাস সিস্টেমটি তৈরি হচ্ছে। ততক্ষণে রেকর্ডেড ক্লাস দেখতে পারবেন।
        </p>
        <Link href="/past-classes" className="mt-1">
          <Button className="rounded-xl px-6 font-semibold">
            পাস্ট ক্লাস দেখুন
          </Button>
        </Link>
      </div>
    </div>
  );
}

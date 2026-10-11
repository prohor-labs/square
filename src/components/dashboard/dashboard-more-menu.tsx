"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArchiveBox,
  CalendarTick,
  Chart,
  Clipboard,
  Dots,
  FileText,
  Home,
  Video,
} from "@/components/icons";

const ITEMS = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", Icon: Home },
  { href: "/live-classes", label: "লাইভ ক্লাস", Icon: Video },
  { href: "/routine", label: "কোর্সের রুটিন", Icon: CalendarTick },
  { href: "/exams?tab=live", label: "লাইভ পরীক্ষা", Icon: Clipboard },
  { href: "/my-results", label: "আগের পরীক্ষার সমূহ", Icon: ArchiveBox },
  { href: "/performance", label: "পারফরমেন্স রিপোর্ট", Icon: Chart },
  { href: "/pdf", label: "কোর্স কনটেন্ট পিডিএফ", Icon: FileText },
] as const;

/** Overflow menu on the dashboard — the seven destinations that do not fit
 *  in the five main buttons. */
export function DashboardMoreMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="আরও ফিচার"
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-accent"
      >
        <Dots className="size-5" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            {ITEMS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Icon size={16} className="shrink-0 text-primary" />
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

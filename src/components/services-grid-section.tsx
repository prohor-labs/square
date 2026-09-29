"use client";

import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Chart,
  FileDown,
  FileText,
  Flame,
  Star,
} from "@/components/icons";
import { Card } from "@/components/ui/card";

interface ServiceItem {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly icon: typeof Chart;
  readonly bgClass: string;
  readonly textClass: string;
}

const services: readonly ServiceItem[] = [
  {
    title: "আমাদের স্পেশাল কোর্স",
    description: "লাইভ ক্লাস ও এক্সাম",
    href: "/#courses-section",
    icon: BookOpen,
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "ফ্রী এক্সাম",
    description: "সবার জন্য উন্মুক্ত টেস্ট",
    href: "/free-exam",
    icon: FileText,
    bgClass: "bg-violet-500/10 dark:bg-violet-500/20",
    textClass: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "প্রশ্ন ব্যাংক",
    description: "বোর্ড ও ভার্সিটি সলভ",
    href: "/qb",
    icon: Star,
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "লাইভ পোল",
    description: "এমসিকিউ কুইজ প্র্যাকটিস",
    href: "/poll",
    icon: Chart,
    bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
    textClass: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "সাজেশন পোর্টাল",
    description: "এক্সক্লুসিভ পিডিএফ",
    href: "/pdf",
    icon: FileDown,
    bgClass: "bg-rose-500/10 dark:bg-rose-500/20",
    textClass: "text-rose-600 dark:text-rose-400",
  },
];

export function ServicesGridSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 w-full">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
          এক নজরে সকল সার্ভিস
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          তোমার একাডেমিক ও এডমিশন জার্নিকে সহজ ও গোছানো করার ডিজিটাল টুলস
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <Link key={service.title} href={service.href} className="group">
              <Card className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-5 bg-card/90 hover:bg-card border-border/70 group-hover:border-primary/50 rounded-2xl sm:rounded-3xl shadow-2xs group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 cursor-pointer active:scale-98 overflow-hidden relative">
                <div
                  className={`${service.bgClass} p-3 sm:p-4 rounded-2xl group-hover:bg-primary transition-all duration-300 transform group-hover:scale-110 flex items-center justify-center shrink-0 mb-2.5 sm:mb-3`}
                >
                  <Icon
                    className={`${service.textClass} group-hover:text-primary-foreground transition-colors size-6 sm:size-7 shrink-0`}
                  />
                </div>
                <h3 className="text-xs sm:text-sm lg:text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {service.title}
                </h3>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

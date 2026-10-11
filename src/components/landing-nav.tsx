"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  BookOpen,
  Calendar,
  CalendarTick,
  Chart,
  Danger,
  FileDown,
  Home,
  Send,
  TaskSquare,
  User,
} from "@/components/icons";
import { Button } from "@/components/ui/button";

import { useSession } from "@/lib/auth-client";

export function LandingHeader() {
  const { data: session, isPending } = useSession();

  return (
    <nav
      id="main-nav"
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/80 shadow-xs transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-18 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1.5 cursor-pointer group"
        >
          <div className="size-14 p-0.5 border-2 border-transparent group-hover:border-foreground rounded-xl transition-all duration-300 flex items-center justify-center">
            <Image
              alt="Logo"
              className="size-full object-contain"
              src="https://raw.githubusercontent.com/shuyaib105/square/refs/heads/main/1536-removebg-preview.png"
              width={56}
              height={56}
              unoptimized
            />
          </div>
          <span className="text-xl font-extrabold text-foreground tracking-tight">
            Engr. Platform
          </span>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {isPending ? (
            <div className="w-24 h-10 rounded-full bg-muted animate-pulse" />
          ) : session?.user ? (
            <Button
              render={
                <Link href="/dashboard" className="flex items-center gap-2" />
              }
              className="rounded-full px-6 py-2.5 font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-102 text-sm cursor-pointer"
            >
              <User data-icon="inline-start" className="size-4" />
              <span>ড্যাশবোর্ড</span>
            </Button>
          ) : (
            <Button
              render={
                <Link href="/login" className="flex items-center gap-2" />
              }
              className="rounded-full px-6 py-2.5 font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-102 text-sm cursor-pointer"
            >
              <User data-icon="inline-start" className="size-4" />
              <span>লগইন</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

export function LandingFooter() {
  return (
    <footer
      id="main-footer"
      className="mt-16 border-t border-white/10 bg-gradient-to-b from-red-950 via-neutral-950 to-neutral-950 text-white transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-8 md:px-8">
        <div className="space-y-10">
          {/* Brand — the logo and name match the header exactly. */}
          <div className="space-y-4">
            <Link
              href="/"
              className="group flex w-fit cursor-pointer items-center gap-1.5"
            >
              <div className="flex size-14 items-center justify-center rounded-xl border-2 border-white bg-white p-0.5 transition-all duration-300">
                <Image
                  alt="Logo"
                  className="size-full object-contain"
                  src="https://raw.githubusercontent.com/shuyaib105/square/refs/heads/main/1536-removebg-preview.png"
                  width={56}
                  height={56}
                  unoptimized
                />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Engr. Platform
              </span>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-white/60">
              শুধু পড়াশোনা নয়, তৈরি করো নিজেকে যুগের সাথে তাল মিলিয়ে। ইঞ্জিনিয়ারিং প্রস্তুতি
              এবার বাড়ির কাছে।
            </p>
          </div>

          {/* Links run left to right in a row per group, never stacked. */}
          <FooterRow title="দ্রুত লিংক">
            <FooterLink href="/dashboard" icon={Home} label="ড্যাশবোর্ড" />
            <FooterLink href="/calendar" icon={Calendar} label="ভর্তি ক্যালেন্ডার" />
            <FooterLink href="/qb" icon={TaskSquare} label="প্রশ্নব্যাংক" />
            <FooterLink href="/wrong-answers" icon={Danger} label="ভুল ব্যাংক" />
          </FooterRow>

          <FooterRow title="রিসোর্স">
            <FooterLink href="/free-exam" icon={BookOpen} label="ফ্রি এক্সাম" />
            <FooterLink href="/pdf" icon={FileDown} label="সাজেশন পিডিএফ" />
            <FooterLink href="/poll" icon={Chart} label="লাইভ পোল" />
            <FooterLink href="/routine" icon={CalendarTick} label="কোর্স রুটিন" />
          </FooterRow>

          <FooterRow title="যোগাযোগ">
            <FooterLink
              href="https://t.me/shu_yaib"
              icon={Send}
              label="টেলিগ্রাম"
            />
            <FooterLink href="https://facebook.com" icon={User} label="ফেসবুক" />
          </FooterRow>
        </div>

        <div className="mt-12 flex flex-col items-center gap-2 border-t border-white/10 pt-6 text-center text-xs text-white/50 sm:flex-row sm:justify-between sm:text-left">
          <span>© ২০২৬ Engr. Platform · সর্বস্বত্ব সংরক্ষিত</span>
          <span>ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার প্রস্তুতি প্ল্যাটফর্ম</span>
        </div>
      </div>
    </footer>
  );
}

/** A group label on the left, its links flowing left to right beside it. */
function FooterRow({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-baseline sm:gap-6">
      <h4 className="shrink-0 text-xs font-black uppercase tracking-widest text-white/80 sm:w-28">
        {title}
      </h4>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">{children}</ul>
    </div>
  );
}

/** One footer row — an external link opens in a new tab, an internal one does not. */
function FooterLink({
  href,
  icon: Icon,
  label,
}: {
  readonly href: string;
  readonly icon: ComponentType<{ readonly className?: string }>;
  readonly label: string;
}) {
  const row =
    "group flex items-center gap-2.5 text-xs font-semibold text-white/60 transition-colors hover:text-white";
  const inner = (
    <>
      <Icon
        data-icon="inline-start"
        className="size-3.5 text-red-400 transition-colors group-hover:text-red-300"
      />
      <span>{label}</span>
    </>
  );

  return href.startsWith("http") ? (
    <li>
      <a href={href} target="_blank" rel="noopener noreferrer" className={row}>
        {inner}
      </a>
    </li>
  ) : (
    <li>
      <Link href={href} className={row}>
        {inner}
      </Link>
    </li>
  );
}

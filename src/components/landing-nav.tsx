"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Calendar, Chart, FileDown, Send, User } from "@/components/icons";
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
              render={<Link href="/dashboard" className="flex items-center gap-2" />}
              className="rounded-full px-6 py-2.5 font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-102 text-sm cursor-pointer"
            >
              <User data-icon="inline-start" className="size-4" />
              <span>ড্যাশবোর্ড</span>
            </Button>
          ) : (
            <Button
              render={<Link href="/login" className="flex items-center gap-2" />}
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
      className="bg-card text-foreground pt-12 pb-8 border-t border-border mt-16 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 bg-foreground/10 p-1 rounded-xl flex items-center justify-center">
                <Image
                  alt="Logo"
                  className="size-full object-contain"
                  src="https://raw.githubusercontent.com/shuyaib105/square/refs/heads/main/1536-removebg-preview.png"
                  width={36}
                  height={36}
                  unoptimized
                />
              </div>
              <span className="text-lg font-black tracking-tight text-foreground">
                Engr. Platform
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-loose italic border-l-2 border-primary/40 pl-3">
              &quot;শুধু পড়াশোনা নয়, তৈরি করো নিজেকে যুগের সাথে তাল মিলিয়ে। ইঞ্জিনিয়ারিং
              প্রস্তুতি এবার বাড়ির কাছে।&quot;
            </p>
          </div>

          {/* Useful resources */}
          <div>
            <h4 className="text-xs font-black mb-4 text-foreground uppercase tracking-widest">
              সহায়ক রিসোর্স
            </h4>
            <ul className="space-y-3 text-muted-foreground text-xs font-semibold">
              <li>
                <Link
                  href="/free-exam"
                  className="hover:text-foreground flex items-center gap-2.5 transition-colors"
                >
                  <BookOpen
                    data-icon="inline-start"
                    className="size-3.5 text-violet-500"
                  />
                  <span>সবার জন্য উন্মুক্ত ফ্রি এক্সাম</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/pdf"
                  className="hover:text-foreground flex items-center gap-2.5 transition-colors"
                >
                  <FileDown
                    data-icon="inline-start"
                    className="size-3.5 text-rose-500"
                  />
                  <span>সাজেশন পিডিএফ পোর্টাল</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/poll"
                  className="hover:text-foreground flex items-center gap-2.5 transition-colors"
                >
                  <Chart
                    data-icon="inline-start"
                    className="size-3.5 text-blue-500"
                  />
                  <span>লাইভ পোল ও এমসিকিউ কুইজ</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-xs font-black mb-4 text-foreground uppercase tracking-widest">
              যোগাযোগ ও সোশ্যাল মিডিয়া
            </h4>
            <ul className="space-y-3 text-muted-foreground text-xs font-semibold">
              <li>
                <a
                  href="https://t.me/shu_yaib"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground flex items-center gap-2.5 transition-colors group"
                >
                  <Send
                    data-icon="inline-start"
                    className="size-3.5 text-sky-500"
                  />
                  <span>টেলিগ্রাম গ্রুপে যুক্ত হোন</span>
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground flex items-center gap-2.5 transition-colors group"
                >
                  <User
                    data-icon="inline-start"
                    className="size-3.5 text-blue-600"
                  />
                  <span>ফেসবুক সাপোর্ট কমিউনিটি</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-muted-foreground text-xs">
          © 2026 Engr. Platform. All rights reserved. Developed with absolute
          craft &amp; precision.
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft2,
  HambergerMenu,
  User as UserIcon,
} from "@/components/icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth-client";
import type { ShellProps } from "@/types";
import { Sidebar } from "./navigation";

export default function Shell({ children, dict, lang }: ShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const initial = user?.name?.charAt(0).toUpperCase() || "U";

  const isLoginPage = pathname.startsWith("/login");
  const isQbChapterQuestionsPage = pathname.startsWith("/qb/");
  const isPollTakingPage =
    pathname.startsWith("/poll/take") || pathname.startsWith("/poll/solve");
  const isExamTakePage =
    pathname.startsWith("/exams/") && pathname.endsWith("/take");

  /* The exam runner takes the whole screen — no chrome to get in the way. */
  const shouldHideTopNav = isExamTakePage;
  const canOpenSidebar =
    !isLoginPage && !isQbChapterQuestionsPage && !isPollTakingPage;

  return (
    <div className="flex h-[100dvh] w-full bg-muted text-foreground font-sans overflow-hidden relative">
      {/* Mobile Top Navbar */}
      {!shouldHideTopNav && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex w-full border-b border-border bg-background/80 backdrop-blur-xl px-3 sm:px-4 py-2.5 shadow-xs">
          <div className="w-full flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-[10px]">
              {canOpenSidebar ? (
                <button
                  type="button"
                  aria-label="খুলুন"
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1 -ml-1 rounded-lg hover:bg-muted active:scale-95 transition-all text-foreground"
                >
                  <HambergerMenu className="size-6" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Go Back"
                  onClick={() => router.back()}
                  className="p-1 rounded-lg hover:bg-muted active:scale-95 transition-all text-foreground"
                >
                  <ArrowLeft2 className="size-6 text-foreground" />
                </button>
              )}
              <Link
                href={`/`}
                className="flex flex-row items-center"
                onClick={() => setIsSidebarOpen(false)}
              >
                <h3 className="text-[18px] font-[800] text-foreground whitespace-nowrap mt-[1px]">
                  স্কয়ার
                </h3>
              </Link>
            </div>

            <div className="flex flex-row items-center gap-[12px]">
              <Link
                href={user ? "/profile" : "/login"}
                className="relative size-8 rounded-full overflow-hidden border border-border shadow-xs hover:opacity-85 transition-opacity"
                onClick={() => setIsSidebarOpen(false)}
              >
                <Avatar className="size-8">
                  {user?.image ? (
                    <AvatarImage
                      src={user.image}
                      alt={user.name || "Profile"}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                    {user ? (
                      initial
                    ) : (
                      <UserIcon className="size-4 text-muted-foreground" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay (Mobile) */}
      {!shouldHideTopNav && (
        <button
          type="button"
          aria-label="Close sidebar"
          className={`fixed inset-0 bg-overlay z-30 transition-opacity duration-300 lg:hidden cursor-default border-none outline-none ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      {!shouldHideTopNav && (
        <div
          className={`fixed lg:static top-[8px] bottom-[8px] left-[8px] right-[52%] lg:inset-auto z-40 lg:z-10 bg-muted lg:bg-transparent rounded-[24px] lg:rounded-none border-[0.5px] border-border lg:border-none p-[16px] lg:p-0 transition-transform duration-500 ease-[cubic-bezier(0.075,0.82,0.165,1)] lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-[110%]"}`}
        >
          <Sidebar
            onClose={() => setIsSidebarOpen(false)}
            dict={dict}
            lang={lang}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 bg-background relative overflow-hidden rounded-[0px] lg:rounded-[24px] border-0 lg:border-[0.5px] lg:border-border ${shouldHideTopNav ? "m-0" : "mt-0 lg:my-[20px] lg:mr-[20px] pt-[50px] lg:pt-0"}`}
      >
        <div
          className={`w-full h-full overflow-y-auto ${shouldHideTopNav ? "" : "p-2.5 sm:p-6 md:p-8 lg:p-10"}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

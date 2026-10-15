"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SquareLogo } from "@/components/icons";
import { LanguageToggler } from "@/components/language-toggler";
import { Button } from "@/components/ui/button";
import { useLogout, useUser } from "@/hooks/use-auth";
import { getNavGroups, sidebarAnnouncement } from "@/lib/navigation";
import { notifyNotReady } from "@/lib/not-ready";
import { cn } from "@/lib/utils";
import type { NavTone, SidebarProps } from "@/types";

/**
 * Each area keeps one colour so a student recognises where they are from the
 * icon alone — the same trick the reference academy dashboard uses.
 */
const TONES: Record<NavTone, string> = {
  navy: "bg-indigo-100 text-indigo-700",
  green: "bg-emerald-100 text-emerald-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
  blue: "bg-sky-100 text-sky-700",
  pink: "bg-pink-100 text-pink-700",
  yellow: "bg-amber-100 text-amber-700",
};

export function Sidebar({ onClose, dict, lang }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: user } = useUser();
  const logoutMutation = useLogout();

  const d = dict.sidebar;
  const isAdmin = pathname.startsWith("/admin");
  const groups = getNavGroups(isAdmin);

  return (
    <aside
      className={`w-full h-full lg:h-[calc(100vh-40px)] lg:m-[20px] shrink-0 z-10 flex flex-col pt-0 lg:pt-[16px] justify-between overflow-x-hidden overflow-y-auto no-scrollbar transition-all duration-[300ms] ease-[cubic-bezier(0.83,0,0.17,1)] ${isCollapsed ? "lg:w-[40px]" : "lg:w-[200px]"}`}
    >
      <div className="flex flex-col gap-[24px]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-[48px] lg:gap-0">
          <div className="flex items-center justify-between w-full">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex items-center px-[8px] py-[4px] rounded-[8px] hover:bg-accent transition-colors overflow-hidden shrink-0"
            >
              <span className="shrink-0 mr-[10px] flex size-8 items-center justify-center rounded-lg bg-white shadow-xs">
                <SquareLogo className="size-full object-contain p-[5%]" />
              </span>
              <span
                className={`flex flex-col leading-none whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? "opacity-0" : "opacity-100"}`}
              >
                <span className="font-[800] text-[16px]">স্কয়ার</span>
                <span className="mt-[3px] text-[9px] font-bold tracking-wide text-muted-foreground uppercase">
                  Engr. Platform
                </span>
              </span>
            </Link>

            {/* Closes the drawer on phones; the shell keeps it open on desktop. */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex lg:hidden w-fit p-[4px] rounded-[8px] hover:bg-accent transition-colors h-auto"
            >
              <svg
                className="size-7"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Close Sidebar</title>
                <rect
                  x="4"
                  y="5"
                  width="16"
                  height="14"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth="1.29"
                />
                <path
                  d="M15 19L15 5"
                  stroke="currentColor"
                  strokeWidth="1.29"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-start px-[8px] py-[4px] rounded-[8px] hover:bg-accent transition-colors text-muted-foreground overflow-hidden -mt-[8px] h-auto w-full shrink-0"
        >
          <Image
            src="/icons/chevrons-left.svg"
            alt="arrows"
            width={24}
            height={24}
            className={`shrink-0 mr-[12px] transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          />
          <span
            className={`text-[14px] whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? "opacity-0" : "opacity-100"}`}
          >
            {d.collapse}
          </span>
        </Button>

        {/* Every destination is listed at once — no "show more" toggle. */}
        <nav className="flex flex-col gap-[14px] lg:-mt-[16px]">
          {groups.map((group, groupIndex) => (
            <div
              key={group.label ?? `group-${groupIndex}`}
              className="flex flex-col gap-[4px]"
            >
              {group.label && (
                <p
                  className={cn(
                    "px-[8px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-opacity duration-200",
                    isCollapsed && "lg:opacity-0 lg:h-0 lg:overflow-hidden",
                  )}
                >
                  {group.label}
                </p>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                /* `pathname` never carries a query string, so an item like
                   `/exams?tab=live` needs the bare path to highlight right. */
                const href = item.matchPath ?? item.path;
                const isActive = item.exact
                  ? pathname === href
                  : pathname.startsWith(href);
                const tone = item.tone ?? "navy";

                const inner = (
                  <>
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-[8px]",
                        TONES[tone],
                      )}
                    >
                      <Icon size={16} />
                    </span>
                    <span
                      className={cn(
                        "truncate text-[14px] transition-opacity duration-200",
                        isActive
                          ? "font-bold text-foreground"
                          : "text-foreground",
                        item.disabled && "opacity-50",
                        isCollapsed && "opacity-0",
                      )}
                    >
                      {item.name}
                    </span>
                    {item.count && (
                      <div
                        className={cn(
                          "absolute right-[8px] bg-success-badge rounded-[8px] px-[8px] py-[2px] flex items-center transition-opacity duration-200",
                          isCollapsed
                            ? "opacity-0 pointer-events-none"
                            : "opacity-100",
                        )}
                      >
                        <span className="text-success-badge-foreground text-[12px] font-[600]">
                          {item.count}
                        </span>
                      </div>
                    )}
                  </>
                );

                const rowClass = cn(
                  "relative flex w-full items-center gap-[10px] px-[6px] py-[6px] rounded-[10px] transition-colors overflow-hidden shrink-0 text-left",
                  isActive ? "bg-accent" : "hover:bg-accent",
                  item.disabled &&
                    "cursor-not-allowed opacity-60 hover:bg-transparent",
                );

                /* A half-built screen is a button that says so, not a link
                   that would open an empty page. */
                if (item.disabled) {
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={notifyNotReady}
                      className={rowClass}
                      title={item.name}
                    >
                      {inner}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={onClose}
                    className={rowClass}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <Link
          href={sidebarAnnouncement.href}
          onClick={onClose}
          className={cn(
            "hidden lg:flex flex-col gap-[8px] rounded-[16px] overflow-hidden shrink-0 transition-all duration-300",
            "bg-gradient-to-br from-indigo-600 via-indigo-600 to-fuchsia-600 p-[10px] pb-[12px]",
            isCollapsed
              ? "max-h-0 opacity-0 p-0 mb-0 pointer-events-none"
              : "max-h-[280px] opacity-100 mb-[4px]",
          )}
        >
          <Image
            src={sidebarAnnouncement.imageSrc || "/images/image.png"}
            alt={sidebarAnnouncement.imageAlt || "Announcement"}
            width={732}
            height={420}
            className="w-full aspect-[732/420] object-cover rounded-[12px]"
            priority
          />
          <div className="flex flex-col gap-[2px] px-[4px]">
            <h4 className="text-[14px] text-white font-semibold">
              {sidebarAnnouncement.title}
            </h4>
            <h6 className="text-[10px] text-white/75 leading-normal">
              {sidebarAnnouncement.subtitle}
            </h6>
          </div>
        </Link>
      </div>

      <div className="flex flex-col gap-[12px] mt-[24px] lg:mt-[32px] px-[8px] items-center lg:items-stretch border-t border-border/50 pt-[16px]">
        <div
          className={`flex transition-all duration-300 ${
            isCollapsed
              ? "flex-col items-center gap-[16px] px-0"
              : "flex-row items-center gap-[12px] px-[8px]"
          }`}
        >
          <LanguageToggler lang={lang} className="text-[14px]" />
        </div>

        <a
          href={user ? "#" : "mailto:contact@square.com"}
          onClick={
            user
              ? (e) => {
                  e.preventDefault();
                  logoutMutation.mutate();
                }
              : undefined
          }
          title={user ? "ক্লিক করে লগআউট করুন" : undefined}
          className="py-[4px] rounded-[8px] hover:bg-accent transition-colors overflow-hidden whitespace-nowrap"
        >
          <span
            className={`text-[14px] text-foreground transition-opacity duration-200 ${isCollapsed ? "opacity-0" : "opacity-100"}`}
          >
            {user?.email ?? "contact@square.com"}
          </span>
        </a>
      </div>
    </aside>
  );
}

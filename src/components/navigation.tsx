"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight2,
  Category,
  HambergerMenu,
  SquareLogo,
} from "@/components/icons";
import { LanguageToggler } from "@/components/language-toggler";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useLogout, useUser } from "@/hooks/use-auth";
import { getNavItems, sidebarAnnouncement } from "@/lib/navigation";
import type { Dictionary, SidebarProps } from "@/types";

export function Sidebar({ onClose, dict, lang }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: user } = useUser();
  const logoutMutation = useLogout();

  const d = dict.sidebar;
  const isAdmin = pathname.startsWith("/admin");
  const navItems = getNavItems(dict, isAdmin);

  return (
    <aside
      className={`w-full h-full lg:h-[calc(100vh-40px)] lg:m-[20px] shrink-0 z-10 flex flex-col pt-0 lg:pt-[16px] justify-between overflow-x-hidden overflow-y-auto no-scrollbar transition-all duration-[300ms] ease-[cubic-bezier(0.83,0,0.17,1)] ${isCollapsed ? "lg:w-[40px]" : "lg:w-[192px]"}`}
    >
      <div className="flex flex-col gap-[24px]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-[48px] lg:gap-0">
          <div className="flex items-center justify-between w-full">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex items-center px-[8px] py-[4px] rounded-[8px] hover:bg-accent transition-colors overflow-hidden shrink-0"
            >
              <SquareLogo className="shrink-0 mr-[12px] size-6" />
              <h3
                className={`font-[800] text-[18px] lg:text-[16px] whitespace-nowrap mt-[3px] transition-opacity duration-200 ${isCollapsed ? "opacity-0" : "opacity-100"}`}
              >
                স্কয়ার
              </h3>
            </Link>

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

        <nav className="flex flex-col gap-[4px] lg:-mt-[16px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.path
              : pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={onClose}
                className={`relative flex items-center px-[8px] py-[4px] rounded-[8px] transition-colors overflow-hidden shrink-0 ${
                  isActive ? "bg-accent" : "hover:bg-accent"
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <div className="flex items-center gap-[8px]">
                  <Icon size={24} className="shrink-0" />
                  <span
                    className={`text-[14px] text-foreground whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? "opacity-0" : "opacity-100"}`}
                  >
                    {item.name}
                  </span>
                </div>
                {item.count && (
                  <div
                    className={`absolute right-[8px] bg-success-badge rounded-[8px] px-[8px] py-[2px] flex items-center transition-opacity duration-200 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                  >
                    <span className="text-success-badge-foreground text-[12px] font-[600]">
                      {item.count}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          href={sidebarAnnouncement.href}
          onClick={onClose}
          className={`hidden lg:flex flex-col gap-[8px] bg-background border-[0.5px] border-border rounded-[16px] hover:bg-muted transition-all duration-300 overflow-hidden shrink-0 ${
            isCollapsed
              ? "max-h-0 opacity-0 p-0 border-0 mb-0 pointer-events-none"
              : "max-h-[280px] opacity-100 p-[8px] pb-[12px] mb-[4px]"
          }`}
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
            <h4 className="text-[14px] text-foreground font-semibold">
              {sidebarAnnouncement.title}
            </h4>
            <h6 className="text-[10px] text-muted-foreground leading-normal">
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

interface MobileBottomNavProps {
  readonly dict: Dictionary;
}

export function MobileBottomNav({ dict }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isAdmin = pathname.startsWith("/admin");
  const allNavItems = getNavItems(dict, isAdmin);

  const primaryNavItems = allNavItems.slice(0, 4);
  const moreNavItems = allNavItems.slice(4);

  const isMoreActive = moreNavItems.some((item) =>
    item.exact ? pathname === item.path : pathname.startsWith(item.path),
  );

  return (
    <div className="lg:hidden fixed bottom-[12px] left-[12px] right-[12px] sm:left-[16px] sm:right-[16px] z-30 flex justify-center pointer-events-none">
      <div className="flex items-center justify-between bg-background/90 backdrop-blur-xl border border-border/80 rounded-[24px] p-[5px] shadow-xl pointer-events-auto w-full max-w-[430px]">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.path
            : pathname.startsWith(item.path);

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-1 flex-col items-center justify-center py-[7px] px-[2px] rounded-[18px] transition-all duration-200 ${
                isActive
                  ? "bg-foreground text-background shadow-xs font-bold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon size={22} className="mb-[3px]" />
              <span className="text-[11px] tracking-tight whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* 5th Tab: Udvash-style Three-Line Menu Trigger */}
        {moreNavItems.length > 0 && (
          <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <DrawerTrigger
              render={
                <button
                  type="button"
                  className={`flex flex-1 flex-col items-center justify-center py-[7px] px-[2px] rounded-[18px] transition-all duration-200 outline-none cursor-pointer ${
                    isMoreActive || isMoreOpen
                      ? "bg-foreground text-background shadow-xs font-bold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                />
              }
            >
              <HambergerMenu size={22} className="mb-[3px]" />
              <span className="text-[11px] tracking-tight whitespace-nowrap">
                মেনু
              </span>
            </DrawerTrigger>

            <DrawerContent className="px-4 sm:px-6 pb-8 pt-3 bg-card border-t border-border rounded-t-[28px] max-w-lg mx-auto">
              <DrawerHeader className="px-1 pt-1 pb-3 text-left">
                <DrawerTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <HambergerMenu className="size-5 text-primary" />
                  মেনু ও অন্যান্য ফিচার
                </DrawerTitle>
              </DrawerHeader>

              {/* Separated, distinct full-width items */}
              <div className="flex flex-col gap-2 pt-1">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? pathname === item.path
                    : pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isActive
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                          : "bg-muted/30 border-border/70 text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-primary border border-border/50 shadow-2xs"
                          }`}
                        >
                          <Icon size={22} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{item.name}</span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            {item.name === "পিডিএফ" ||
                            item.name === "পিডিএফ সাজেশন"
                              ? "লেকচার নোটস ও সাজেশন শিট"
                              : item.name === "পোল"
                                ? "কুইক পোলিং ও এমসিকিউ কুইজ"
                                : item.name === "হিরো স্লাইডার"
                                  ? "হোমপেজ ব্যানার ম্যানেজমেন্ট"
                                  : "সরাসরি ব্রাউজ করুন"}
                          </span>
                        </div>
                      </div>

                      <ArrowRight2 className="size-4 text-muted-foreground shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  );
}

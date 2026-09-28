"use client";

import { ReactNode } from "react";
import { Search } from "@/components/icons";

export interface CustomTabItem {
  id: string;
  label: string;
  count?: number;
}

export interface CustomTabBarProps {
  tabs: CustomTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  rightAction?: ReactNode;
  toBanglaDigits?: (val: string | number) => string;
}

export function CustomTabBar({
  tabs,
  activeTab,
  onTabChange,
  searchPlaceholder = "খুঁজুন...",
  searchQuery,
  onSearchChange,
  rightAction,
  toBanglaDigits = (v) => String(v),
}: CustomTabBarProps) {
  return (
    <div className="sticky -top-2.5 sm:-top-6 md:-top-8 lg:-top-10 z-30 -mx-2.5 sm:-mx-6 md:-mx-8 lg:-mx-10 px-3 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-3.5 bg-background/95 backdrop-blur-xl border-b border-border/60 shadow-2xs transition-all">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center w-full">
        {/* Rounded Pill Buttons */}
        <div className="gap-2 flex flex-wrap items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-2xs ${
                  isActive
                    ? "bg-primary text-primary-foreground border border-primary ring-2 ring-primary/20"
                    : "bg-muted/80 hover:bg-muted text-foreground/80 hover:text-foreground border border-border/70 hover:border-border"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-full leading-none transition-colors ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-background/80 text-muted-foreground border border-border/50"
                    }`}
                  >
                    {toBanglaDigits(tab.count)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Optional Action */}
        <div className="flex items-center gap-2 max-md:mt-1">
          {onSearchChange !== undefined && (
            <div className="relative text-muted-foreground w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Search className="size-4" />
              </div>
              <input
                id="search-input"
                name="search"
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full sm:w-64 md:w-72 pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/70 shadow-2xs"
              />
            </div>
          )}
          {rightAction}
        </div>
      </div>
    </div>
  );
}

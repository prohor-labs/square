"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import { Add, Calendar, Camera, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type {
  CalendarCategoryContent,
  CalendarTableGroup,
  CalendarTableSection,
} from "@/lib/actions/settings";
import {
  getCalendarCategoryContent,
  updateCalendarCategoryContent,
} from "@/lib/actions/settings";
import {
  CALENDAR_CATEGORY_META,
  CALENDAR_CATEGORY_ORDER,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { CalendarCategory } from "@/types";

const MAX_COLUMNS = 8;
const MAX_SECTIONS = 12;
const MAX_GROUPS = 12;
const MAX_ROWS = 60;

function newSection(): CalendarTableSection {
  return {
    title: "",
    columns: ["ইউনিট", "পরীক্ষার তারিখ"],
    // A named group — an empty label renders a blank heading bar on /calendar.
    groups: [{ label: "নতুন বিশ্ববিদ্যালয়", rows: [] }],
    footer: "",
  };
}

function newRow(columnCount: number): string[] {
  return Array.from({ length: columnCount }, () => "");
}

export function AdminCalendarContentEditor() {
  const { data, isLoading } = useQuery({
    queryKey: ["calendar-category-content"],
    queryFn: () => getCalendarCategoryContent(),
  });

  // Stays null until the first edit, so a refetch always shows fresh data.
  const [draft, setDraft] = useState<CalendarCategoryContent[] | null>(null);
  const items = draft ?? data ?? [];
  const [activeCategory, setActiveCategory] =
    useState<CalendarCategory>("medical");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const activeIndex = items.findIndex(
    (item) => item.category === activeCategory,
  );
  const active = items[activeIndex];

  const patchActive = (changes: Partial<CalendarCategoryContent>) => {
    setDraft(
      items.map((item, index) =>
        index === activeIndex ? { ...item, ...changes } : item,
      ),
    );
  };

  /** Applies a change to one section of the active category. */
  const patchSection = (
    sectionIndex: number,
    updater: (section: CalendarTableSection) => CalendarTableSection,
  ) => {
    if (!active) return;
    patchActive({
      sections: active.sections.map((section, i) =>
        i === sectionIndex ? updater(section) : section,
      ),
    });
  };

  const handleAddSection = () => {
    if (!active) return;
    if (active.sections.length >= MAX_SECTIONS) return;
    patchActive({ sections: [...active.sections, newSection()] });
  };

  const handleRemoveSection = (sectionIndex: number) => {
    if (!active) return;
    patchActive({
      sections: active.sections.filter((_, i) => i !== sectionIndex),
    });
  };

  const handleAddColumn = (sectionIndex: number) => {
    patchSection(sectionIndex, (section) => {
      if (section.columns.length >= MAX_COLUMNS) return section;
      return {
        ...section,
        columns: [...section.columns, "নতুন কলাম"],
        groups: section.groups.map((group) => ({
          ...group,
          rows: group.rows.map((row) => [...row, ""]),
        })),
      };
    });
  };

  const handleRemoveColumn = (sectionIndex: number, columnIndex: number) => {
    patchSection(sectionIndex, (section) => {
      if (section.columns.length <= 1) return section;
      return {
        ...section,
        columns: section.columns.filter((_, i) => i !== columnIndex),
        groups: section.groups.map((group) => ({
          ...group,
          rows: group.rows.map((row) =>
            row.filter((_, i) => i !== columnIndex),
          ),
        })),
      };
    });
  };

  const handleAddGroup = (sectionIndex: number) => {
    patchSection(sectionIndex, (section) => {
      if (section.groups.length >= MAX_GROUPS) return section;
      const nextIndex = section.groups.length + 1;
      return {
        ...section,
        groups: [
          ...section.groups,
          {
            label: `নতুন বিশ্ববিদ্যালয় ${nextIndex}`,
            rows: [],
          } satisfies CalendarTableGroup,
        ],
      };
    });
  };

  const handleRemoveGroup = (sectionIndex: number, groupIndex: number) => {
    patchSection(sectionIndex, (section) => ({
      ...section,
      groups: section.groups.filter((_, i) => i !== groupIndex),
    }));
  };

  const handlePatchGroup = (
    sectionIndex: number,
    groupIndex: number,
    changes: Partial<CalendarTableGroup>,
  ) => {
    patchSection(sectionIndex, (section) => ({
      ...section,
      groups: section.groups.map((group, i) =>
        i === groupIndex ? { ...group, ...changes } : group,
      ),
    }));
  };

  const handleAddRow = (sectionIndex: number, groupIndex: number) => {
    patchSection(sectionIndex, (section) => ({
      ...section,
      groups: section.groups.map((group, i) =>
        i === groupIndex && group.rows.length < MAX_ROWS
          ? { ...group, rows: [...group.rows, newRow(section.columns.length)] }
          : group,
      ),
    }));
  };

  const handleRemoveRow = (
    sectionIndex: number,
    groupIndex: number,
    rowIndex: number,
  ) => {
    patchSection(sectionIndex, (section) => ({
      ...section,
      groups: section.groups.map((group, i) =>
        i === groupIndex
          ? { ...group, rows: group.rows.filter((_, j) => j !== rowIndex) }
          : group,
      ),
    }));
  };

  const handleCellChange = (
    sectionIndex: number,
    groupIndex: number,
    rowIndex: number,
    columnIndex: number,
    value: string,
  ) => {
    patchSection(sectionIndex, (section) => ({
      ...section,
      groups: section.groups.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              rows: group.rows.map((row, j) =>
                j === rowIndex
                  ? row.map((cell, k) => (k === columnIndex ? value : cell))
                  : row,
              ),
            }
          : group,
      ),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    const res = await updateCalendarCategoryContent(items);
    setIsSaving(false);

    setMessage(
      res.success
        ? { type: "success", text: "থাম্বনেল ও তথ্য সারণি সংরক্ষণ হয়েছে!" }
        : {
            type: "error",
            text: res.error || "সংরক্ষণ করতে সমস্যা হয়েছে",
          },
    );
  };

  return (
    <Card className="rounded-2xl border border-border/70 shadow-xs overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 sm:p-5 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Camera className="size-5 text-primary" />
            <h2 className="font-bold text-base sm:text-lg">
              থাম্বনেল ও তথ্য সারণি
            </h2>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="rounded-xl h-10 font-bold px-6 shadow-sm"
          >
            {isSaving ? (
              <>
                <Spinner className="size-4 mr-2" /> সংরক্ষণ হচ্ছে...
              </>
            ) : (
              "সংরক্ষণ করুন"
            )}
          </Button>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-5">
          {/* Category switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CALENDAR_CATEGORY_ORDER.map((key) => {
              const meta = CALENDAR_CATEGORY_META[key];
              const Icon = meta.icon;
              const isActive = key === activeCategory;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all",
                    isActive
                      ? "bg-primary/10 border-primary"
                      : "bg-background border-border hover:bg-muted/50",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive && "text-primary",
                    )}
                  />
                  <span className="text-xs font-bold truncate">
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>

          {message && (
            <div
              className={cn(
                "p-3 rounded-xl text-xs font-semibold border",
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 border-destructive/20 text-destructive",
              )}
            >
              {message.text}
            </div>
          )}

          {isLoading || !active ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              <span>লোড হচ্ছে...</span>
            </div>
          ) : (
            <>
              {/* Thumbnail */}
              <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                <div className="space-y-1.5">
                  <Label>প্রিভিউ</Label>
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted border border-border/60">
                    {active.thumbnail ? (
                      <Image
                        src={active.thumbnail}
                        alt={active.thumbnailAlt || "থাম্বনেল প্রিভিউ"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1">
                        <Calendar className="size-6" />
                        <span className="text-[10px]">ছবি নেই</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`thumb-${active.category}`}>
                      থাম্বনেল ছবির URL
                    </Label>
                    <Input
                      id={`thumb-${active.category}`}
                      value={active.thumbnail}
                      onChange={(e) =>
                        patchActive({ thumbnail: e.target.value })
                      }
                      placeholder="https://example.com/medical.jpg"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      ক্যালেন্ডারে ক্যাটাগরি বাটনে ক্লিক করলে এই ছবিটি দেখাবে।
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`alt-${active.category}`}>
                      ছবির বর্ণনা (Alt)
                    </Label>
                    <Input
                      id={`alt-${active.category}`}
                      value={active.thumbnailAlt}
                      onChange={(e) =>
                        patchActive({ thumbnailAlt: e.target.value })
                      }
                      placeholder="যেমন: মেডিকেল ভর্তি পরীক্ষা"
                    />
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>তথ্য সারণি ({active.sections.length}টি সেকশন)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSection}
                    disabled={active.sections.length >= MAX_SECTIONS}
                    className="h-8 gap-1.5 rounded-lg text-xs"
                  >
                    <Add className="size-3.5" /> সেকশন
                  </Button>
                </div>

                {active.sections.length === 0 ? (
                  <p className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl">
                    এখনো কোনো সেকশন যোগ করা হয়নি। &quot;সেকশন&quot; বাটনে ক্লিক করে
                    নতুন সারণি তৈরি করুন।
                  </p>
                ) : (
                  active.sections.map((section, sectionIndex) => (
                    <SectionEditor
                      // biome-ignore lint/suspicious/noArrayIndexKey: sections have no id, order is admin-defined
                      key={sectionIndex}
                      sectionIndex={sectionIndex}
                      section={section}
                      onRemove={() => handleRemoveSection(sectionIndex)}
                      onAddColumn={() => handleAddColumn(sectionIndex)}
                      onRemoveColumn={(columnIndex) =>
                        handleRemoveColumn(sectionIndex, columnIndex)
                      }
                      onPatch={(changes) =>
                        patchSection(sectionIndex, (current) => ({
                          ...current,
                          ...changes,
                        }))
                      }
                      onAddGroup={() => handleAddGroup(sectionIndex)}
                      onRemoveGroup={(groupIndex) =>
                        handleRemoveGroup(sectionIndex, groupIndex)
                      }
                      onPatchGroup={(groupIndex, changes) =>
                        handlePatchGroup(sectionIndex, groupIndex, changes)
                      }
                      onAddRow={(groupIndex) =>
                        handleAddRow(sectionIndex, groupIndex)
                      }
                      onRemoveRow={(groupIndex, rowIndex) =>
                        handleRemoveRow(sectionIndex, groupIndex, rowIndex)
                      }
                      onCellChange={(
                        groupIndex,
                        rowIndex,
                        columnIndex,
                        value,
                      ) =>
                        handleCellChange(
                          sectionIndex,
                          groupIndex,
                          rowIndex,
                          columnIndex,
                          value,
                        )
                      }
                    />
                  ))
                )}

                <p className="text-[11px] text-muted-foreground">
                  গ্রুপের নাম খালি রাখলে সেই সারিগুলো গ্রুপ হেডিং ছাড়া সরাসরি দেখাবে। সর্বোচ্চ{" "}
                  {MAX_COLUMNS} কলাম, {MAX_SECTIONS} সেকশন, {MAX_GROUPS} গ্রুপ ও{" "}
                  {MAX_ROWS} সারি।
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SectionEditorProps {
  readonly sectionIndex: number;
  readonly section: CalendarTableSection;
  readonly onRemove: () => void;
  readonly onAddColumn: () => void;
  readonly onRemoveColumn: (columnIndex: number) => void;
  readonly onPatch: (changes: Partial<CalendarTableSection>) => void;
  readonly onAddGroup: () => void;
  readonly onRemoveGroup: (groupIndex: number) => void;
  readonly onPatchGroup: (
    groupIndex: number,
    changes: Partial<CalendarTableGroup>,
  ) => void;
  readonly onAddRow: (groupIndex: number) => void;
  readonly onRemoveRow: (groupIndex: number, rowIndex: number) => void;
  readonly onCellChange: (
    groupIndex: number,
    rowIndex: number,
    columnIndex: number,
    value: string,
  ) => void;
}

function SectionEditor({
  sectionIndex,
  section,
  onRemove,
  onAddColumn,
  onRemoveColumn,
  onPatch,
  onAddGroup,
  onRemoveGroup,
  onPatchGroup,
  onAddRow,
  onRemoveRow,
  onCellChange,
}: SectionEditorProps) {
  const label = `সেকশন ${sectionIndex + 1}`;

  return (
    <div className="border rounded-xl overflow-hidden bg-muted/10">
      {/* Section header */}
      <div className="p-3 bg-muted/30 border-b flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex-1 space-y-1.5">
          <Input
            value={section.title}
            onChange={(e) => onPatch({ title: e.target.value })}
            placeholder="সেকশন শিরোনাম (ঐচ্ছিক) — খালি রাখলে শুধু একটা রেখা দেখাবে"
            className="h-9 rounded-lg text-sm font-bold bg-background"
            aria-label={`সেকশন ${sectionIndex + 1} শিরোনাম`}
          />
          <Input
            value={section.footer}
            onChange={(e) => onPatch({ footer: e.target.value })}
            placeholder="ফুটার নোট (শুধু ক্যাটাগরির শেষ টেবিলে দেখাবে)"
            className="h-8 rounded-lg text-xs bg-background"
            aria-label={`সেকশন ${sectionIndex + 1} ফুটার`}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="size-8 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label={`${label} মুছুন`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Columns */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              কলাম ({section.columns.length})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onAddColumn}
              disabled={section.columns.length >= MAX_COLUMNS}
              className="h-7 gap-1 rounded-md text-[11px]"
            >
              <Add className="size-3" /> কলাম
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {section.columns.map((column, columnIndex) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: columns are edited in place, never reordered
              <div key={columnIndex} className="flex items-center gap-1">
                <Input
                  value={column}
                  onChange={(e) => {
                    const columns = [...section.columns];
                    columns[columnIndex] = e.target.value;
                    onPatch({ columns });
                  }}
                  placeholder={`কলাম ${columnIndex + 1}`}
                  className="h-8 w-40 rounded-md text-xs font-bold bg-background"
                  aria-label={`কলাম ${columnIndex + 1} এর নাম`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveColumn(columnIndex)}
                  disabled={section.columns.length <= 1}
                  className="size-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label={`কলাম ${columnIndex + 1} মুছুন`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Groups */}
        {section.groups.length === 0 ? (
          <p className="p-4 text-center text-[11px] text-muted-foreground border border-dashed border-border/70 rounded-lg">
            কোনো গ্রুপ নেই। নিচের &quot;গ্রুপ&quot; বাটনে ক্লিক করুন।
          </p>
        ) : (
          section.groups.map((group, groupIndex) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: groups have no id, order is admin-defined
              key={groupIndex}
              className="border rounded-lg bg-background overflow-hidden"
            >
              <div className="flex items-center gap-2 p-2 bg-muted/40 border-b">
                <Input
                  value={group.label}
                  onChange={(e) =>
                    onPatchGroup(groupIndex, { label: e.target.value })
                  }
                  placeholder="গ্রুপের নাম (খালি রাখলে হেডিং দেখাবে না), যেমন: ঢাকা বিশ্ববিদ্যালয়"
                  className="h-8 flex-1 rounded-md text-xs font-bold"
                  aria-label={`গ্রুপ ${groupIndex + 1} এর নাম`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveGroup(groupIndex)}
                  className="size-8 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label={`গ্রুপ ${groupIndex + 1} মুছুন`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              {group.rows.length === 0 ? (
                <p className="p-4 text-center text-[11px] text-muted-foreground">
                  কোনো সারি নেই। নিচের &quot;সারি&quot; বাটনে ক্লিক করুন।
                </p>
              ) : (
                <div className="flex flex-col gap-2 p-2">
                  {group.rows.map((row, rowIndex) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: rows are edited in place, never reordered
                    <div key={rowIndex} className="flex items-center gap-1">
                      {section.columns.map((_, columnIndex) => (
                        <Input
                          // biome-ignore lint/suspicious/noArrayIndexKey: positional cell, matches its column
                          key={columnIndex}
                          value={row[columnIndex] ?? ""}
                          onChange={(e) =>
                            onCellChange(
                              groupIndex,
                              rowIndex,
                              columnIndex,
                              e.target.value,
                            )
                          }
                          className="h-8 rounded-md text-xs"
                          placeholder={`সারি ${rowIndex + 1}, কলাম ${columnIndex + 1}`}
                          aria-label={`গ্রুপ ${groupIndex + 1}, সারি ${rowIndex + 1}, কলাম ${columnIndex + 1}`}
                        />
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveRow(groupIndex, rowIndex)}
                        className="size-8 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label={`সারি ${rowIndex + 1} মুছুন`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddRow(groupIndex)}
                  disabled={group.rows.length >= MAX_ROWS}
                  className="h-7 gap-1 rounded-md text-[11px]"
                >
                  <Add className="size-3" /> সারি
                </Button>
              </div>
            </div>
          ))
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddGroup}
          disabled={section.groups.length >= MAX_GROUPS}
          className="h-8 gap-1.5 self-start rounded-lg text-xs"
        >
          <Add className="size-3.5" /> গ্রুপ
        </Button>
      </div>
    </div>
  );
}

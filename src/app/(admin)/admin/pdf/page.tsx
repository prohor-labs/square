"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  BookOpen,
  DocumentDownload,
  Export,
  Flash,
  Trash2,
} from "@/components/icons";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  type CreatePdfPayload,
  createPdfSuggestion,
  deletePdfSuggestion,
  getPdfSuggestions,
} from "@/lib/actions/pdf";
import { formatGoogleDriveUrl } from "@/lib/drive";
import type { PdfSuggestion } from "@/types";

export default function AdminPdfPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("physics");
  const [paper, setPaper] = useState("1st");
  const [chapter, setChapter] = useState("");
  const [hscBatch, setHscBatch] = useState("HSC 2026");
  const [driveUrl, setDriveUrl] = useState("");
  const [isFeatured, _setIsFeatured] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: pdfList = [], isLoading } = useQuery<PdfSuggestion[]>({
    queryKey: ["admin-pdf-suggestions"],
    queryFn: () => getPdfSuggestions(),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreatePdfPayload) => {
      const res = await createPdfSuggestion(payload);
      if (!res.success) throw new Error(res.message || "Failed to create PDF");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pdf-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["pdf-suggestions"] });
      setIsOpen(false);
      setTitle("");
      setChapter("");
      setDriveUrl("");
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : "একটি ত্রুটি ঘটেছে");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deletePdfSuggestion(id);
      if (!res.success) throw new Error(res.message || "Failed to delete PDF");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pdf-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["pdf-suggestions"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("পিডিএফ এর শিরোনাম প্রদান করুন");
      return;
    }
    if (!driveUrl.trim()) {
      setFormError("গুগল ড্রাইভ লিংক প্রদান করুন");
      return;
    }

    createMutation.mutate({
      title,
      subject,
      paper,
      chapter: chapter.trim() || undefined,
      hscBatch,
      fileUrl: driveUrl.trim(),
      isFeatured,
    });
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <ResponsiveDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          trigger={
            <Button className="rounded-full shadow-xs gap-1.5 h-10 px-5 font-semibold">
              <Flash className="size-4" /> নতুন পিডিএফ যোগ করুন
            </Button>
          }
          title="নতুন সাজেশন পিডিএফ যোগ করুন"
          description="গুগল ড্রাইভের শেয়ারেবল লিংক দিয়ে সহজে যুক্ত করুন।"
          className="sm:max-w-[540px]"
        >
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 py-2">
              {formError && (
                <div className="p-3 text-xs font-semibold rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="pdf-title">পিডিএফ শিরোনাম *</Label>
                <Input
                  id="pdf-title"
                  placeholder="যেমন: পদার্থবিজ্ঞান ১ম পত্র - ভেক্টর স্পেশাল নোট"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>বিষয় *</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="বিষয় সিলেক্ট করুন" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectGroup>
                        <SelectItem value="physics">পদার্থবিজ্ঞান</SelectItem>
                        <SelectItem value="chemistry">রসায়ন</SelectItem>
                        <SelectItem value="higher-math">উচ্চতর গণিত</SelectItem>
                        <SelectItem value="biology">জীববিজ্ঞান</SelectItem>
                        <SelectItem value="ict">আইসিটি (ICT)</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>পত্র *</Label>
                  <Select value={paper} onValueChange={setPaper}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="পত্র" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectGroup>
                        <SelectItem value="1st">১ম পত্র</SelectItem>
                        <SelectItem value="2nd">২য় পত্র</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pdf-chapter">অধ্যায় (ঐচ্ছিক)</Label>
                  <Input
                    id="pdf-chapter"
                    placeholder="যেমন: ভেক্টর"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pdf-batch">টার্গেট ব্যাচ</Label>
                  <Input
                    id="pdf-batch"
                    placeholder="HSC 2026"
                    value={hscBatch}
                    onChange={(e) => setHscBatch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pdf-url">গুগল ড্রাইভ লিংক *</Label>
                <Input
                  id="pdf-url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  ড্রাইভ ফাইলের পারমিশন "Anyone with the link can view" নিশ্চিত করুন।
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={createMutation.isPending}
              >
                বাতিল
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Spinner className="mr-2" /> সেভ হচ্ছে...
                  </>
                ) : (
                  "পিডিএফ যুক্ত করুন"
                )}
              </Button>
            </div>
          </form>
        </ResponsiveDialog>
      </div>

      {/* PDF Table/Cards */}
      <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b bg-muted/20 flex items-center justify-between">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
            <DocumentDownload className="size-5 text-primary" />
            সংরক্ষিত সাজেশনসমূহ ({pdfList.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Spinner className="size-8 text-primary mb-3" />
            <p className="text-sm text-muted-foreground">
              পিডিএফ তালিকা লোড হচ্ছে...
            </p>
          </div>
        ) : pdfList.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <BookOpen className="size-12 text-muted-foreground/40 mb-3" />
            <h4 className="font-bold text-base text-foreground">
              এখনও কোনো পিডিএফ যোগ করা হয়নি
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              উপরের "নতুন পিডিএফ যোগ করুন" বাটনে ক্লিক করে গুগল ড্রাইভ লিংক সহ পিডিএফ
              যুক্ত করুন।
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pdfList.map((item) => {
              const previewUrl = formatGoogleDriveUrl(item.fileUrl);

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-base text-foreground">
                        {item.title}
                      </h4>
                      <span className="text-xs font-bold text-primary">
                        • {item.subject} ({item.paper})
                      </span>
                      {item.chapter && (
                        <span className="text-xs text-muted-foreground font-medium">
                          • {item.chapter}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-md">
                      {item.fileUrl}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs rounded-lg"
                      render={
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      <Export className="size-3.5" /> প্রিভিউ
                    </Button>

                    <DeleteConfirmDialog
                      title="পিডিএফ ডিলিট নিশ্চিতকরণ"
                      description={`আপনি কি নিশ্চিত এই পিডিএফটি ("${item.title}") ডিলিট করতে চান?`}
                      onConfirm={async () => {
                        await deleteMutation.mutateAsync(item.id);
                      }}
                      trigger={
                        <Button
                          variant="ghost"
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

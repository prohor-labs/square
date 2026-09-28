"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft2,
  BookOpen,
  CalendarTick,
  Clock,
  DocumentDownload,
  Download,
  Eye,
  FileDown,
  Information,
  Search,
  Send,
  TaskSquare,
  TickCircle,
} from "@/components/icons";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatGoogleDriveDownloadUrl,
  formatGoogleDriveUrl,
} from "@/lib/drive";
import { formatBanglaDateTime } from "@/lib/date";
import { PdfEmbedViewer } from "@/components/pdf/pdf-embed-viewer";
import type { CourseClass, CoursePdf } from "@/types";

export function getYouTubeEmbedUrl(url: string): string {
  if (!url) return "";
  try {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
      : url;
  } catch {
    return url;
  }
}

interface CourseClassroomViewProps {
  readonly batch: any;
  readonly classes: CourseClass[];
  readonly pdfs: CoursePdf[];
  readonly exams: any[];
}

export function CourseClassroomView({
  batch,
  classes = [],
  pdfs = [],
  exams = [],
}: CourseClassroomViewProps) {
  const details = batch?.details;
  const modules = Array.isArray(batch?.modules)
    ? batch.modules
    : Array.isArray(batch?.curriculum)
      ? batch.curriculum
      : [];
  const instructors = Array.isArray(batch?.instructors)
    ? batch.instructors
    : [];
  const faqs = Array.isArray(batch?.faqs) ? batch.faqs : [];

  // Active Video in Classroom
  const [selectedClass, setSelectedClass] = useState<CourseClass | null>(
    classes.length > 0 ? classes[0] : null,
  );
  const [classSearch, setClassSearch] = useState("");
  const [pdfSearch, setPdfSearch] = useState("");

  // PDF Preview Modal
  const [previewPdf, setPreviewPdf] = useState<CoursePdf | null>(null);

  const filteredClasses = classes.filter(
    (c) =>
      c.title.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.subject.toLowerCase().includes(classSearch.toLowerCase()) ||
      (c.chapter &&
        c.chapter.toLowerCase().includes(classSearch.toLowerCase())),
  );

  const filteredPdfs = pdfs.filter(
    (p) =>
      p.title.toLowerCase().includes(pdfSearch.toLowerCase()) ||
      p.subject.toLowerCase().includes(pdfSearch.toLowerCase()) ||
      (p.chapter && p.chapter.toLowerCase().includes(pdfSearch.toLowerCase())),
  );

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-16 sm:pb-24 pt-1 sm:pt-4 gap-5 sm:gap-8 px-2 sm:px-6">
      {/* ─── Top Header Section ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b pb-4 sm:pb-5">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/my-courses"
              className="inline-flex items-center justify-center size-8 rounded-xl border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-1 shrink-0"
              title="আমার কোর্সসমূহে ফিরুন"
            >
              <ArrowLeft2 className="size-4" />
            </Link>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
              {batch.name}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                {batch.hscBatch}
              </span>
              {batch.badge && (
                <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold bg-muted text-foreground border border-border/60 shrink-0">
                  {batch.badge}
                </span>
              )}
            </div>
          </div>
          {batch.subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-9 sm:pl-0">
              {batch.subtitle}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          {details?.telegramGroupUrl && (
            <a
              href={details.telegramGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial"
            >
              <Button
                size="sm"
                className="w-full sm:w-auto rounded-xl h-9 px-3.5 text-xs font-semibold gap-1.5 bg-[#229ED9] hover:bg-[#1E8BC0] text-white shadow-xs cursor-pointer"
              >
                <Send className="size-3.5" />
                টেলিগ্রাম গ্রুপ
              </Button>
            </a>
          )}

          {details?.routinePdfUrl && (
            <a
              href={details.routinePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto rounded-xl h-9 px-3.5 text-xs font-semibold gap-1.5 border-border/70 shadow-xs cursor-pointer"
              >
                <FileDown className="size-3.5 text-primary" />
                রুটিন (PDF)
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* ─── Classroom Content Tabs ─── */}
      <Tabs defaultValue="exams" className="w-full space-y-6">
        <div className="w-full border-b pb-2 overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
          <TabsList className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 bg-transparent p-0 h-auto min-w-max">
            {/* Tab 1: Exams */}
            <TabsTrigger
              value="exams"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <CalendarTick className="size-4 shrink-0 text-primary" />
              <span>চলমান পরীক্ষা সমূহ</span>
              {exams.length > 0 && (
                <span className="bg-primary/10 text-primary font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-[6px]">
                  {exams.length}
                </span>
              )}
            </TabsTrigger>

            {/* Tab 2: Classes */}
            <TabsTrigger
              value="classes"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <BookOpen className="size-4 shrink-0 text-primary" />
              <span>ক্লাস ও লেকচার</span>
              {classes.length > 0 && (
                <span className="bg-primary/10 text-primary font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-[6px]">
                  {classes.length}
                </span>
              )}
            </TabsTrigger>

            {/* Tab 3: PDFs */}
            <TabsTrigger
              value="pdfs"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <DocumentDownload className="size-4 shrink-0 text-primary" />
              <span>পিডিএফ রিসোর্স ও শিট</span>
              {pdfs.length > 0 && (
                <span className="bg-primary/10 text-primary font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-[6px]">
                  {pdfs.length}
                </span>
              )}
            </TabsTrigger>

            {/* Tab 4: Overview */}
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <Information className="size-4 shrink-0 text-primary" />
              <span>কোর্স সিলেবাস ও তথ্য</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ═══════════════ TAB 1: ONGOING / SCHEDULED EXAMS ═══════════════ */}
        <TabsContent
          value="exams"
          className="space-y-5 focus-visible:outline-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b gap-2">
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
                <CalendarTick className="size-5 text-primary shrink-0" />
                কোর্সের চলমান ও অনলাইন পরীক্ষাসমূহ
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                নির্ধারিত সময়ে পরীক্ষায় অংশ নিয়ে নিজের প্রস্তুতি ও পজিশন যাচাই করুন।
              </p>
            </div>
          </div>

          {exams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.map((be: any) => {
                const exam = be.exam;
                if (!exam) return null;

                const examTypeLabel =
                  exam.type === "chapter_test"
                    ? "অধ্যায়ভিত্তিক পরীক্ষা"
                    : exam.type === "model_test"
                      ? "মডেল টেস্ট"
                      : exam.type === "weekly"
                        ? "উইকলি এক্সাম"
                        : "অনলাইন টেস্ট";

                return (
                  <div
                    key={be.id}
                    className="border border-border/70 rounded-2xl p-4 sm:p-5 bg-card flex flex-col justify-between gap-4 hover:border-primary/50 shadow-2xs transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-primary/10 text-primary border border-primary/20">
                          {examTypeLabel}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {be.startsAt && be.endsAt
                            ? `${formatBanglaDateTime(be.startsAt)} — ${formatBanglaDateTime(be.endsAt)}`
                            : be.startsAt
                              ? `শুরু: ${formatBanglaDateTime(be.startsAt)}`
                              : be.endsAt
                                ? `শেষ: ${formatBanglaDateTime(be.endsAt)}`
                                : "যেকোনো সময়"}
                        </span>
                      </div>

                      <h3 className="font-bold text-base sm:text-lg leading-snug">
                        {exam.title}
                      </h3>

                      {exam.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {exam.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                        <span className="inline-flex items-center gap-1.5 font-medium bg-muted/50 px-2.5 py-1 rounded-lg border border-border/40 text-xs">
                          <TaskSquare className="size-3.5 text-primary shrink-0" />
                          মোট নম্বর: {exam.totalMarks}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-medium bg-muted/50 px-2.5 py-1 rounded-lg border border-border/40 text-xs">
                          <Clock className="size-3.5 text-primary shrink-0" />
                          সময়: {exam.durationMinutes} মিনিট
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/40 flex items-center justify-end">
                      <Link href={`/exams/${exam.slug}`}>
                        <Button
                          size="sm"
                          className="rounded-xl px-4 text-xs font-bold h-9 shadow-xs cursor-pointer"
                        >
                          পরীক্ষা দিন &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center border border-dashed rounded-2xl bg-muted/10 space-y-2">
              <CalendarTick className="size-10 text-muted-foreground/40 mx-auto" />
              <h3 className="font-bold text-base text-foreground">
                বর্তমানে কোনো পরীক্ষা নির্ধারিত নেই
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                নতুন পরীক্ষা যুক্ত হলে সাথে সাথে এখানে দেখতে পাবেন।
              </p>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════ TAB 2: CLASSES & EMBEDDED YOUTUBE PLAYER ═══════════════ */}
        <TabsContent
          value="classes"
          className="space-y-6 focus-visible:outline-none"
        >
          {classes.length === 0 ? (
            <div className="p-12 text-center border border-dashed rounded-2xl bg-muted/10 space-y-2">
              <BookOpen className="size-10 text-muted-foreground/40 mx-auto" />
              <h3 className="font-bold text-base text-foreground">
                এই কোর্সে এখনও কোনো ভিডিও ক্লাস যোগ করা হয়নি
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                লেকচার ক্লাস আপলোড হওয়া মাত্রই এই সেকশনে পাওয়া যাবে।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left/Main Column: Embedded Video Player & Details */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                {selectedClass ? (
                  <div className="bg-card border border-border/70 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xs space-y-4">
                    {/* Embedded YouTube Player */}
                    <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black shadow-md border">
                      <iframe
                        src={getYouTubeEmbedUrl(selectedClass.youtubeUrl)}
                        title={selectedClass.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>

                    {/* Active Class Info */}
                    <div className="space-y-2 px-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                          {selectedClass.subject}
                        </span>
                        {selectedClass.chapter && (
                          <span className="text-xs text-muted-foreground font-medium">
                            • {selectedClass.chapter}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1 font-medium">
                          <Clock className="size-3.5 text-primary" />
                          {selectedClass.durationMinutes} মিনিট
                        </span>
                      </div>

                      <h2 className="text-base sm:text-xl font-bold leading-snug">
                        {selectedClass.title}
                      </h2>

                      {selectedClass.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                          {selectedClass.description}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Right Column: Class Playlist / List */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-3">
                <div className="bg-card border border-border/70 rounded-2xl sm:rounded-3xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                      <BookOpen className="size-4 text-primary" />
                      ক্লাস সূচী ({classes.length})
                    </h3>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="ক্লাস বা বিষয় খুঁজুন..."
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-xl bg-background"
                    />
                  </div>

                  {/* Playlist Items */}
                  <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
                    {filteredClasses.map((cls, idx) => {
                      const isSelected = selectedClass?.id === cls.id;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setSelectedClass(cls)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border-primary text-primary shadow-xs"
                              : "bg-muted/30 border-border/60 hover:bg-muted/60 text-foreground"
                          }`}
                        >
                          <span
                            className={`size-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground border"
                            }`}
                          >
                            {idx + 1}
                          </span>

                          <div className="space-y-1 min-w-0 flex-1">
                            <h4 className="font-bold text-xs sm:text-sm line-clamp-2 leading-tight">
                              {cls.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="truncate">{cls.subject}</span>
                              <span>• {cls.durationMinutes} মি.</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════ TAB 3: PDF RESOURCES & EMBEDDED VIEWER ═══════════════ */}
        <TabsContent
          value="pdfs"
          className="space-y-5 focus-visible:outline-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b gap-3">
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
                <DocumentDownload className="size-5 text-primary shrink-0" />
                কোর্সের পিডিএফ রিসোর্স ও লেকচার শিট
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                অধ্যায়ভিত্তিক হ্যান্ডনোট, ফর্মুলা শিট ও সাজেশন সরাসরি পড়ুন অথবা ডাউনলোড করুন।
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="পিডিএফ শিট খুঁজুন..."
                value={pdfSearch}
                onChange={(e) => setPdfSearch(e.target.value)}
                className="pl-8 h-9 text-xs rounded-xl bg-card"
              />
            </div>
          </div>

          {filteredPdfs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xs hover:border-primary/40 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        {pdf.subject}
                      </span>
                      {pdf.fileSize && (
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {pdf.fileSize}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20 shrink-0">
                        <FileDown className="size-5" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-2">
                          {pdf.title}
                        </h3>
                        {pdf.chapter && (
                          <p className="text-xs text-muted-foreground truncate inline-flex items-center gap-1.5">
                            <BookOpen className="size-3.5 shrink-0" />
                            <span>{pdf.chapter}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {pdf.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">
                        {pdf.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewPdf(pdf)}
                      className="h-8 text-xs rounded-xl gap-1.5 cursor-pointer font-bold flex-1"
                    >
                      <Eye className="size-3.5 text-primary" /> সরাসরি পড়ুন
                    </Button>

                    <a
                      href={pdf.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs rounded-xl gap-1.5 cursor-pointer font-bold"
                      >
                        <Download className="size-3.5" /> ডাউনলোড
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed rounded-2xl bg-muted/10 space-y-2">
              <DocumentDownload className="size-10 text-muted-foreground/40 mx-auto" />
              <h3 className="font-bold text-base text-foreground">
                কোনো পিডিএফ শিট পাওয়া যায়নি
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                পিডিএফ হ্যান্ডনোট বা শিট যুক্ত হওয়া মাত্র এখানে পাওয়া যাবে।
              </p>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════ TAB 4: SYLLABUS & DETAILS ═══════════════ */}
        <TabsContent
          value="overview"
          className="space-y-8 focus-visible:outline-none"
        >
          {/* Syllabus & Modules */}
          {modules.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base sm:text-xl font-bold flex items-center gap-2 pb-1 border-b">
                <BookOpen className="size-5 text-primary" />
                কোর্স সিলেবাস ও মডিউল
              </h2>
              <div className="space-y-3">
                {modules.map((m: any, index: number) => (
                  <div
                    key={m.id || index}
                    className="border border-border/70 rounded-2xl p-4 sm:p-5 bg-card space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="size-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base truncate">
                          {m.title}
                        </h3>
                      </div>
                      <span className="text-[11px] sm:text-xs text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-md border border-border/40 w-fit shrink-0">
                        {m.totalClasses} টি ক্লাস
                      </span>
                    </div>

                    {m.chapters && m.chapters.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-border/40">
                        {m.chapters.map((chapter: string) => (
                          <div
                            key={chapter}
                            className="text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border/30 flex items-center gap-2"
                          >
                            <span className="size-1.5 rounded-full bg-primary shrink-0" />
                            <span className="font-medium text-foreground/90 truncate">
                              {chapter}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {batch.features && batch.features.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold pb-1 border-b flex items-center gap-2">
                <TickCircle className="size-5 text-emerald-500" />
                কোর্সের অন্তর্ভুক্ত সুবিধাসমূহ
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {batch.features.map((feat: string) => (
                  <div
                    key={feat}
                    className="flex items-start gap-2.5 p-3.5 rounded-xl bg-card border border-border/60 text-xs sm:text-sm font-medium"
                  >
                    <TickCircle className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {faqs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold pb-1 border-b flex items-center gap-2">
                <Information className="size-5 text-primary" />
                সাধারণ জিজ্ঞাসাসমূহ (FAQ)
              </h2>
              <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border/60">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq: any, idx: number) => (
                    <AccordionItem
                      key={faq.question}
                      value={`faq-${idx}`}
                      className="border-border/50 py-0.5"
                    >
                      <AccordionTrigger className="text-left font-bold text-foreground text-xs sm:text-sm hover:no-underline py-3 cursor-pointer">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed pt-1 pb-3">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── PDF Modal Viewer ─── */}
      {previewPdf && (
        <ResponsiveDialog
          open={Boolean(previewPdf)}
          onOpenChange={(open) => !open && setPreviewPdf(null)}
          title={previewPdf.title}
          description={`${previewPdf.subject} ${previewPdf.chapter ? `• ${previewPdf.chapter}` : ""}`}
          className="sm:max-w-[850px]"
        >
          <div className="space-y-3 py-2">
            <div className="relative w-full h-[65vh] rounded-2xl overflow-hidden bg-muted/20 border border-border">
              <PdfEmbedViewer
                url={previewPdf.pdfUrl}
                title={previewPdf.title}
                className="w-full h-full"
              />
            </div>
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-xs text-muted-foreground">
                {previewPdf.description || "পিডিএফ ফাইল ভিউয়ার"}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={formatGoogleDriveDownloadUrl(previewPdf.pdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl h-8 text-xs gap-1.5 font-bold"
                  >
                    <Download className="size-3.5" /> ডাউনলোড
                  </Button>
                </a>
                <a
                  href={previewPdf.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    className="rounded-xl h-8 text-xs gap-1.5 font-bold"
                  >
                    <Eye className="size-3.5" /> ড্রাইভে খুলুন
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </ResponsiveDialog>
      )}
    </div>
  );
}

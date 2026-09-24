"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Add,
  ArrowLeft2,
  Category,
  Copy,
  Danger,
  DocumentDownload,
  FileText,
  Flash,
  Information,
  Lightbulb,
  SecurityCard,
  TaskSquare,
  TickCircle,
} from "@/components/icons";
import { parseQuestionsCsv } from "@/lib/csv-parser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewChapterForm } from "@/components/admin/forms/new-chapter-form";
import { NewQuestionBankForm } from "@/components/admin/forms/new-qb-form";
import { NewSubjectForm } from "@/components/admin/forms/new-subject-form";
import { NewTopicForm } from "@/components/admin/forms/new-topic-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { importQuestionsAction } from "@/lib/actions/question";
import {
  getContainerYearsAction,
  getFullQbHierarchy,
  importYearBasedQuestionsAction,
  type HierarchyContainer,
} from "@/lib/actions/universal-qb";

interface UniversalQuestionCreatorProps {
  readonly hierarchy: HierarchyContainer[];
  readonly initialRecentQuestions?: any[];
}

export function UniversalQuestionCreator({
  hierarchy = [],
  initialRecentQuestions = [],
}: UniversalQuestionCreatorProps) {
  const queryClient = useQueryClient();

  // Mode: "year" (Varsity/Board question paper) vs "chapter" (HSC subject & chapter)
  const [uploadMode, setUploadMode] = useState<"year" | "chapter">("year");

  // Dynamic Hierarchy State
  const [qbList, setQbList] = useState<HierarchyContainer[]>(hierarchy);

  // Dialog states for creating new hierarchy items directly
  const [showNewQbDialog, setShowNewQbDialog] = useState(false);
  const [showNewSubjectDialog, setShowNewSubjectDialog] = useState(false);
  const [showNewChapterDialog, setShowNewChapterDialog] = useState(false);
  const [showNewTopicDialog, setShowNewTopicDialog] = useState(false);

  // Hierarchy Selection States
  const [selectedContainerId, setSelectedContainerId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  // Year-based upload specific state
  const [yearInput, setYearInput] = useState<string>("2023-24");
  const [containerYears, setContainerYears] = useState<any[]>([]);
  const [isPendingUpload, setIsPendingUpload] = useState(false);
  const [uploadedResult, setUploadedResult] = useState<any>(null);

  // Question Meta Form States
  const [type, setType] = useState<"mcq" | "cq">("mcq");
  const [standard, setStandard] = useState("Varsity");
  const [source, setSource] = useState("ঢাকা বিশ্ববিদ্যালয় ২০২৩-২৪");
  const [isFree, setIsFree] = useState(false);

  // UI States
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Bulk Import State
  const [bulkJson, setBulkJson] = useState("");
  const [bulkImportStatus, setBulkImportStatus] = useState<string | null>(null);

  // Auto-select first container & subject & chapter if available
  useEffect(() => {
    if (qbList.length > 0 && !selectedContainerId) {
      const firstCont = qbList[0];
      setSelectedContainerId(firstCont.id);

      if (firstCont.subjects?.length > 0) {
        const firstSubj = firstCont.subjects[0];
        setSelectedSubjectId(firstSubj.id);

        if (firstSubj.chapters?.length > 0) {
          setSelectedChapterId(firstSubj.chapters[0].id);
        }
      }
    }
  }, [qbList, selectedContainerId]);

  // Load container years only when selected container changes
  useEffect(() => {
    if (selectedContainerId) {
      getContainerYearsAction(selectedContainerId).then(setContainerYears);
      const cont = qbList.find((c) => c.id === selectedContainerId);
      if (cont) {
        if (cont.title.includes("বুয়েট") || cont.title.includes("ইঞ্জিনিয়ারিং")) {
          setStandard("Engineering");
        } else if (cont.title.includes("মেডিকেল")) {
          setStandard("Medical");
        } else if (
          cont.title.includes("ভার্সিটি") ||
          cont.title.includes("বিশ্ববিদ্যালয়") ||
          cont.title.includes("ভর্তি") ||
          cont.title.includes("গুচ্ছ")
        ) {
          setStandard("Varsity");
        } else {
          setStandard("HSC");
        }
        setSource(`${cont.title} ${yearInput}`);
      }
    }
  }, [selectedContainerId]);

  const refreshHierarchy = async () => {
    const fresh = await getFullQbHierarchy();
    setQbList(fresh);
    if (selectedContainerId) {
      getContainerYearsAction(selectedContainerId).then(setContainerYears);
    }
    queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
  };

  // Filtered dropdown lists
  const currentContainer = qbList.find((c) => c.id === selectedContainerId);
  const availableSubjects = currentContainer?.subjects || [];
  const currentSubject = availableSubjects.find((s) => s.id === selectedSubjectId);
  const availableChapters = currentSubject?.chapters || [];
  const currentChapter = availableChapters.find((ch) => ch.id === selectedChapterId);
  const availableTopics = currentChapter?.topics || [];

  const handleContainerChange = (cid: string) => {
    setSelectedContainerId(cid);
    const cont = qbList.find((c) => c.id === cid);
    if (cont?.subjects?.length) {
      const firstSubj = cont.subjects[0];
      setSelectedSubjectId(firstSubj.id);
      if (firstSubj.chapters?.length) {
        setSelectedChapterId(firstSubj.chapters[0].id);
      } else {
        setSelectedChapterId("");
      }
    } else {
      setSelectedSubjectId("");
      setSelectedChapterId("");
    }
    setSelectedTopicId("");
  };

  const handleSubjectChange = (sid: string) => {
    setSelectedSubjectId(sid);
    const subj = availableSubjects.find((s) => s.id === sid);
    if (subj?.chapters?.length) {
      setSelectedChapterId(subj.chapters[0].id);
    } else {
      setSelectedChapterId("");
    }
    setSelectedTopicId("");
  };

  // Clean MCQ JSON (Without meta fields)
  const cleanSampleMcqJson = `[
  {
    "questionText": "নিচের কোনটি ভেক্টর রাশি?",
    "mcqOptions": [
      { "optionText": "বেগ", "isCorrect": true },
      { "optionText": "দ্রুতি", "isCorrect": false },
      { "optionText": "কাজ", "isCorrect": false },
      { "optionText": "ক্ষমতা", "isCorrect": false }
    ],
    "explanation": "বেগ একটি ভেক্টর রাশি কারণ এর নির্দিষ্ট মান ও দিক উভয়ই বিদ্যমান।"
  },
  {
    "questionText": "$$\\\\vec{A} = 2\\\\hat{i} + 3\\\\hat{j}$$ এবং $$\\\\vec{B} = 4\\\\hat{i} - \\\\hat{j}$$ হলে ভেক্টরদ্বয়ের ডট গুণন কত?",
    "mcqOptions": [
      { "optionText": "5", "isCorrect": true },
      { "optionText": "8", "isCorrect": false },
      { "optionText": "11", "isCorrect": false },
      { "optionText": "14", "isCorrect": false }
    ],
    "explanation": "$$\\\\vec{A} \\\\cdot \\\\vec{B} = (2 \\\\times 4) + (3 \\\\times -1) = 8 - 3 = 5$$"
  }
]`;

  // Clean CQ JSON (Without meta fields)
  const cleanSampleCqJson = `[
  {
    "questionText": "একটি গাড়ি স্থির অবস্থান থেকে $2\\\\text{ ms}^{-2}$ সুষম ত্বরণে চলা শুরু করল এবং $10\\\\text{ s}$ পর সমবেগে চলল।",
    "cqParts": [
      {
        "partKey": "a",
        "marks": 1,
        "questionText": "ত্বরণ কাকে বলে?",
        "answerText": "সময়ের সাথে বস্তুর অসম বেগের পরিবর্তনের হারকে ত্বরণ বলে।"
      },
      {
        "partKey": "b",
        "marks": 2,
        "questionText": "সুষম ত্বরণে চলমান বস্তুর বেগ নিয়মিত বৃদ্ধি পায় কেন? ব্যাখ্যা করো।",
        "answerText": "ত্বরণ হলো বেগের পরিবর্তনের হার, তাই সুষম ত্বরণে বেগ নির্দিষ্ট হারে বাড়তে থাকে।"
      },
      {
        "partKey": "c",
        "marks": 3,
        "questionText": "প্রথম $10\\\\text{ s}$-এ গাড়িটি কত দূরত্ব অতিক্রম করবে?",
        "answerText": "$$s = ut + \\\\frac{1}{2}at^2 = 0 + \\\\frac{1}{2}(2)(10)^2 = 100\\\\text{ m}$$"
      },
      {
        "partKey": "d",
        "marks": 4,
        "questionText": "উদ্দীপকের তথ্যানুযায়ী বেগ-সময় লেখচিত্র অঙ্কন করে গতি বিশ্লেষণ করো।",
        "answerText": "প্রথম ১০ সেকেন্ড বেগ বৃদ্ধি পেয়ে ২০ মি/সে হবে, পরবর্তীতে সমবেগে চলবে।"
      }
    ],
    "explanation": "গতিবিদ্যার সৃজনশীল সমাধান।"
  }
]`;

  // Clean CSV Sample
  const cleanSampleCsv = `questions,option1,option2,option3,option4,answer,explanation
"নিচের কোনটি ভেক্টর রাশি?","বেগ","দ্রুতি","কাজ","ক্ষমতা",1,"বেগ একটি ভেক্টর রাশি কারণ এর নির্দিষ্ট মান ও দিক উভয়ই বিদ্যমান।"
"$$\\vec{A} = 2\\hat{i} + 3\\hat{j}$$ এবং $$\\vec{B} = 4\\hat{i} - \\hat{j}$$ হলে ভেক্টরদ্বয়ের ডট গুণন কত?","5","8","11","14",1,"$$\\vec{A} \\cdot \\vec{B} = (2 \\times 4) + (3 \\times -1) = 8 - 3 = 5$$"`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(label);
    setTimeout(() => setCopiedStatus(null), 2500);
  };

  const copyAiPrompt = () => {
    const promptText = `তুমি একজন অভিজ্ঞ শিক্ষক ও প্রশ্নপ্রণেতা।
দয়া করে নিচের বিষয়ের উপর ১০টি ${type === "mcq" ? "MCQ (বহুনির্বাচনী ৪টি অপশন সহ)" : "CQ (সৃজনশীল ৪টি অংশ ক,খ,গ,ঘ সহ)"} প্রশ্ন তৈরি করে দাও।

বিষয়: ${currentSubject?.name || "পদার্থবিজ্ঞান"}
অধ্যায়: ${currentChapter?.name || "অধ্যায়"}

নির্দেশনা:
১. ম্যাথমেটিক্যাল বা সাইন্টিফিক সূত্রের জন্য অবশ্যই LaTeX ($...$ বা $$...$$) ব্যবহার করবে।
২. আউটপুট হিসেবে কোনো অতিরিক্ত কথা, ব্যাখ্যা বা মেটাডেটা ছাড়া শুধুমাত্র নিচের JSON ফরম্যাটে একটি ভ্যালিড JSON অ্যারে আউটপুট দেবে:

${type === "mcq" ? cleanSampleMcqJson : cleanSampleCqJson}`;

    copyToClipboard(promptText, "ai-prompt");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (file.name.endsWith(".csv") || content.includes(",") && !content.trim().startsWith("[")) {
        try {
          const parsedCsv = parseQuestionsCsv(content);
          if (parsedCsv.length > 0) {
            setBulkJson(JSON.stringify(parsedCsv, null, 2));
            setBulkImportStatus(`CSV ফাইল থেকে ${parsedCsv.length}টি প্রশ্ন লোড করা হয়েছে।`);
          } else {
            setBulkJson(content);
          }
        } catch {
          setBulkJson(content);
        }
      } else {
        setBulkJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleBulkImport = async () => {
    if (uploadMode === "year") {
      await handleYearBulkImport();
      return;
    }

    if (!selectedChapterId) {
      setBulkImportStatus("অনুগ্রহ করে আগে অধ্যায় নির্বাচন করুন।");
      return;
    }
    const trimmed = bulkJson.trim();
    if (!trimmed) {
      setBulkImportStatus("প্রশ্ন বা ফাইল প্রদান করুন।");
      return;
    }

    try {
      setIsPendingUpload(true);
      setBulkImportStatus(null);
      let parsed: any[] = [];
      if (trimmed.startsWith("[")) {
        parsed = JSON.parse(trimmed);
      } else {
        parsed = parseQuestionsCsv(trimmed);
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        setBulkImportStatus("সঠিক JSON বা CSV ফরম্যাটে প্রশ্ন দিন।");
        setIsPendingUpload(false);
        return;
      }

      const res = await importQuestionsAction(
        selectedChapterId,
        parsed,
        {
          type,
          standard,
          source,
          isFree,
          topicId: selectedTopicId || undefined,
        },
      );
      setIsPendingUpload(false);
      if (res.error) throw new Error(res.error);

      setBulkImportStatus(`সফলভাবে ${parsed.length} টি প্রশ্ন ইমপোর্ট হয়েছে।`);
      setBulkJson("");
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    } catch (e: unknown) {
      setIsPendingUpload(false);
      setBulkImportStatus(e instanceof Error ? e.message : "ভুল JSON বা CSV ফরম্যাট");
    }
  };

  const handleYearBulkImport = async () => {
    if (!selectedContainerId) {
      setBulkImportStatus("অনুগ্রহ করে আগে প্রশ্নব্যাংক নির্বাচন করুন।");
      return;
    }
    if (!yearInput.trim()) {
      setBulkImportStatus("অনুগ্রহ করে সাল বা সেশন (যেমন: 2023-24) লিখুন।");
      return;
    }
    const trimmed = bulkJson.trim();
    if (!trimmed) {
      setBulkImportStatus("প্রশ্ন বা ফাইল প্রদান করুন।");
      return;
    }

    try {
      setIsPendingUpload(true);
      setBulkImportStatus(null);
      let parsed: any[] = [];
      if (trimmed.startsWith("[")) {
        parsed = JSON.parse(trimmed);
      } else {
        parsed = parseQuestionsCsv(trimmed);
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        setBulkImportStatus("সঠিক JSON বা CSV ফরম্যাটে প্রশ্ন দিন।");
        setIsPendingUpload(false);
        return;
      }

      const res = await importYearBasedQuestionsAction({
        containerId: selectedContainerId,
        yearName: yearInput.trim(),
        questionsList: parsed,
        standard: standard as any,
        type,
        isFree,
        source: source.trim() || `${currentContainer?.title} ${yearInput.trim()}`,
      });

      setIsPendingUpload(false);

      if (!res.success || res.error) {
        throw new Error(res.error || "আপলোড করতে সমস্যা হয়েছে");
      }

      setUploadedResult(res);
      setBulkImportStatus(
        `সফলভাবে ${res.count} টি প্রশ্ন [${res.containerTitle} - ${res.yearName}] সেশনে আপলোড সম্পন্ন হয়েছে!`,
      );
      setBulkJson("");
      await refreshHierarchy();
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    } catch (e: unknown) {
      setIsPendingUpload(false);
      setBulkImportStatus(
        e instanceof Error ? e.message : "ভুল JSON বা CSV ফরম্যাট",
      );
    }
  };

  const commonYearSuggestions = [
    "2023-24",
    "2022-23",
    "2021-22",
    "2020-21",
    "2019-20",
    "2018-19",
    "2017-18",
    "2016-17",
    "2015-16",
  ];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-24 sm:pb-16 pt-1 sm:pt-2 md:py-8 gap-5 sm:gap-8 px-2.5 sm:px-4 md:px-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-border">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="size-8 sm:size-9 rounded-xl shrink-0"
              title="প্রশ্নব্যাংক তালিকায় ফিরুন"
            >
              <Link href="/admin/qb">
                <ArrowLeft2 className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                <TaskSquare className="size-5 sm:size-6 text-primary shrink-0" />
                <span>প্রশ্ন আপলোড ও বিল্ডার</span>
              </h1>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground pl-10 sm:pl-12">
            সালভিত্তিক ভর্তি ও বোর্ড পরীক্ষা অথবা বিষয়ভিত্তিক অধ্যায় অনুযায়ী প্রশ্ন আপলোড করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto pl-10 sm:pl-0">
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5 h-8 sm:h-9">
            <Link href="/admin/qb">
              <span>প্রশ্নব্যাংক তালিকা</span>
              <ArrowLeft2 className="size-3.5 rotate-180" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-muted/60 border border-border/80 rounded-2xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => {
            setUploadMode("year");
            setBulkImportStatus(null);
          }}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            uploadMode === "year"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span>🎓 সালভিত্তিক আপলোড (ভর্তি ও বোর্ড)</span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
            চর্চা স্টাইল
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setUploadMode("chapter");
            setBulkImportStatus(null);
          }}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            uploadMode === "chapter"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span>📚 অধ্যায়ভিত্তিক আপলোড (বিষয় ও অধ্যায়)</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-xs">
          <TickCircle className="size-4 sm:size-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {formError && (
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-bold flex items-center gap-2.5">
          <Danger className="size-4 sm:size-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Success banner with direct view link after Year upload */}
      {uploadedResult && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-700 dark:text-emerald-400">
          <div className="flex items-center gap-3">
            <TickCircle className="size-6 shrink-0 text-emerald-500" />
            <div>
              <p className="font-extrabold text-sm sm:text-base">
                {uploadedResult.count} টি প্রশ্ন সফলভাবে &quot;{uploadedResult.containerTitle} ({uploadedResult.yearName})&quot; এ আপলোড হয়েছে!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                শিক্ষার্থীরা এখন সরাসরি এই প্রশ্নব্যাংকে ক্লিক করে সালভিত্তিক প্রশ্ন অনুশীলন করতে পারবে।
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shrink-0"
          >
            <Link
              href={`/qb/${uploadedResult.containerSlug}/${uploadedResult.itemSlug}/${uploadedResult.yearSlug}`}
              target="_blank"
            >
              <span>প্রশ্নসমূহ দেখুন</span>
              <ArrowLeft2 className="size-3.5 rotate-180" />
            </Link>
          </Button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Location & JSON Input Form */}
        <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
          {/* STEP 1: CASCADING LOCATION SELECTOR */}
          {uploadMode === "year" ? (
            /* YEAR-BASED SELECTOR */
            <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Category className="size-4 text-primary shrink-0" />
                <h3 className="font-extrabold text-xs sm:text-sm md:text-base">
                  ১. প্রশ্নব্যাংক ও সাল নির্বাচন
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Container / QB Select */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">
                      প্রশ্নব্যাংক নির্বাচন করুন *
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewQbDialog(true)}
                      className="h-6 px-1.5 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-md gap-1"
                    >
                      <Add className="size-3" /> নতুন প্রশ্নব্যাংক
                    </Button>
                  </div>
                  <NativeSelect
                    value={selectedContainerId}
                    onChange={(e) => handleContainerChange(e.target.value)}
                    className="w-full rounded-xl text-xs font-bold min-h-[42px]"
                  >
                    {qbList.map((c) => (
                      <NativeSelectOption key={c.id} value={c.id}>
                        {c.title} {c.isPublic ? "(উন্মুক্ত)" : ""}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>

                {/* Year / Session Input */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    সাল / সেশন লিখুন বা নির্বাচন করুন *
                  </Label>
                  <Input
                    required
                    placeholder="যেমন: 2023-24 বা ২০২৩-২৪"
                    value={yearInput}
                    onChange={(e) => {
                      setYearInput(e.target.value);
                      if (currentContainer) {
                        setSource(`${currentContainer.title} ${e.target.value}`);
                      }
                    }}
                    className="rounded-xl text-xs font-bold min-h-[42px]"
                  />
                </div>
              </div>

              {/* Quick Year Selection Badges */}
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground">
                  দ্রুত সাল সিলেক্ট করুন:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Container's existing years if any */}
                  {containerYears.map((yr) => (
                    <button
                      key={yr.id}
                      type="button"
                      onClick={() => {
                        setYearInput(yr.name);
                        if (currentContainer) {
                          setSource(`${currentContainer.title} ${yr.name}`);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                        yearInput === yr.name
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border/80 hover:bg-muted text-foreground"
                      }`}
                    >
                      {yr.name} ({yr.questionCount} টি)
                    </button>
                  ))}

                  {/* Standard year suggestions */}
                  {commonYearSuggestions.map((yr) => {
                    if (containerYears.some((cy) => cy.name === yr)) return null;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setYearInput(yr);
                          if (currentContainer) {
                            setSource(`${currentContainer.title} ${yr}`);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                          yearInput === yr
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "bg-muted/40 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* CHAPTER-BASED SELECTOR */
            <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Category className="size-4 text-primary shrink-0" />
                <h3 className="font-extrabold text-xs sm:text-sm md:text-base">
                  ১. লোকেশন নির্বাচন (প্রশ্নব্যাংক, বিষয় ও অধ্যায়)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Container / QB Select */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">
                      প্রশ্নব্যাংক ক্যাটাগরি *
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewQbDialog(true)}
                      className="h-6 px-1.5 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-md gap-1"
                    >
                      <Add className="size-3" /> নতুন ক্যাটাগরি
                    </Button>
                  </div>
                  <NativeSelect
                    value={selectedContainerId}
                    onChange={(e) => handleContainerChange(e.target.value)}
                    className="w-full rounded-xl text-xs font-bold min-h-[42px]"
                  >
                    {qbList.map((c) => (
                      <NativeSelectOption key={c.id} value={c.id}>
                        {c.title} {c.isPublic ? "(উন্মুক্ত)" : ""}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>

                {/* Subject Select */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">
                      বিষয় (Subject) *
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!selectedContainerId}
                      onClick={() => setShowNewSubjectDialog(true)}
                      className="h-6 px-1.5 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-md gap-1 disabled:opacity-50"
                    >
                      <Add className="size-3" /> নতুন বিষয়
                    </Button>
                  </div>
                  <NativeSelect
                    value={selectedSubjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full rounded-xl text-xs font-bold min-h-[42px]"
                  >
                    {availableSubjects.map((s) => (
                      <NativeSelectOption key={s.id} value={s.id}>
                        {s.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>

                {/* Chapter Select */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">
                      অধ্যায় (Chapter) *
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!selectedSubjectId}
                      onClick={() => setShowNewChapterDialog(true)}
                      className="h-6 px-1.5 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-md gap-1 disabled:opacity-50"
                    >
                      <Add className="size-3" /> নতুন অধ্যায়
                    </Button>
                  </div>
                  <NativeSelect
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="w-full rounded-xl text-xs font-bold min-h-[42px]"
                  >
                    {availableChapters.map((ch) => (
                      <NativeSelectOption key={ch.id} value={ch.id}>
                        {ch.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>

                {/* Topic Select (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">
                      টপিক (ঐচ্ছিক)
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!selectedChapterId}
                      onClick={() => setShowNewTopicDialog(true)}
                      className="h-6 px-1.5 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-md gap-1 disabled:opacity-50"
                    >
                      <Add className="size-3" /> নতুন টপিক
                    </Button>
                  </div>
                  <NativeSelect
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full rounded-xl text-xs min-h-[42px]"
                  >
                    <NativeSelectOption value="">সাধারণ (কোনো নির্দিষ্ট টপিক ছাড়া)</NativeSelectOption>
                    {availableTopics.map((tp) => (
                      <NativeSelectOption key={tp.id} value={tp.id}>
                        {tp.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: QUESTION META & STANDARD */}
          <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <SecurityCard className="size-4 text-primary shrink-0" />
              <h3 className="font-extrabold text-xs sm:text-sm md:text-base">
                ২. প্রশ্নের ধরন ও উৎস সেটিংস
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Type */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold">টাইপ *</Label>
                <NativeSelect
                  value={type}
                  onChange={(e) => setType(e.target.value as "mcq" | "cq")}
                  className="w-full rounded-xl text-xs font-bold min-h-[42px]"
                >
                  <NativeSelectOption value="mcq">MCQ (বহুনির্বাচনী)</NativeSelectOption>
                  <NativeSelectOption value="cq">CQ (সৃজনশীল)</NativeSelectOption>
                </NativeSelect>
              </div>

              {/* Standard */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold">মান / স্তর (Standard) *</Label>
                <NativeSelect
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                  className="w-full rounded-xl text-xs font-bold min-h-[42px]"
                >
                  <NativeSelectOption value="Varsity">Varsity (ভার্সিটি)</NativeSelectOption>
                  <NativeSelectOption value="Engineering">Engineering (ইঞ্জিনিয়ারিং)</NativeSelectOption>
                  <NativeSelectOption value="Medical">Medical (মেডিকেল)</NativeSelectOption>
                  <NativeSelectOption value="HSC">HSC (বোর্ড)</NativeSelectOption>
                </NativeSelect>
              </div>

              {/* Source */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold">উৎস (Source)</Label>
                <Input
                  placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয় ২০২৩-২৪..."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  list="unified-source-suggestions"
                  className="rounded-xl text-xs min-h-[42px]"
                />
                <datalist id="unified-source-suggestions">
                  <option value="ঢাকা বিশ্ববিদ্যালয় ২০২৩-২৪" />
                  <option value="ঢাকা বিশ্ববিদ্যালয় ২০২২-২৩" />
                  <option value="বুয়েট ২০২৩-২৪" />
                  <option value="বুয়েট ২০২২-২৩" />
                  <option value="মেডিকেল ২০২৩-২৪" />
                  <option value="মেডিকেল ২০২২-২৩" />
                  <option value="ঢাকা বোর্ড ২০২৩" />
                  <option value="কুমিল্লা বোর্ড ২০২৩" />
                  <option value="চট্টগ্রাম বোর্ড ২০২৩" />
                  <option value="রাজশাহী বোর্ড ২০২৩" />
                  <option value="Custom" />
                </datalist>
              </div>
            </div>

            {/* Free Question Checkbox */}
            <div className="flex items-center gap-2.5 p-3 sm:p-3.5 bg-muted/40 rounded-2xl border border-border/70">
              <input
                type="checkbox"
                id="universal-is-free"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="size-4.5 rounded accent-primary cursor-pointer shrink-0"
              />
              <div className="flex flex-col">
                <label
                  htmlFor="universal-is-free"
                  className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <span>সকলের জন্য উন্মুক্ত (বিনামূল্যে উন্মুক্ত প্রশ্ন)</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  চেক করা থাকলে যেকোনো শিক্ষার্থী এটি সমাধান করতে পারবে।
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3: JSON / CSV UPLOAD PANEL */}
          <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs flex flex-col gap-4 sm:gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                  <DocumentDownload className="size-4 text-primary" />
                  <span>৩. CSV / JSON প্রশ্ন আপলোড</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  নিচের টেক্সটবক্সে প্রশ্ন ও অপশনের CSV অথবা JSON পেস্ট করুন।
                </p>
              </div>

              {/* Template & Copy Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(cleanSampleCsv, "mcq-csv")}
                  className="text-[11px] h-8 rounded-xl font-bold gap-1"
                >
                  <Copy className="size-3" />
                  <span>{copiedStatus === "mcq-csv" ? "কপি হয়েছে!" : "CSV ফরম্যাট"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(cleanSampleMcqJson, "mcq-json")}
                  className="text-[11px] h-8 rounded-xl font-bold gap-1"
                >
                  <Copy className="size-3" />
                  <span>{copiedStatus === "mcq-json" ? "কপি হয়েছে!" : "MCQ JSON"}</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={copyAiPrompt}
                  className="text-[11px] h-8 rounded-xl font-bold gap-1 text-primary bg-primary/10 hover:bg-primary/20"
                >
                  <Flash className="size-3" />
                  <span>{copiedStatus === "ai-prompt" ? "প্রম্পট কপি হয়েছে!" : "AI প্রম্পট কপি"}</span>
                </Button>
              </div>
            </div>

            {/* JSON / CSV Input Area */}
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-bold">JSON বা CSV ডেটা পেস্ট করুন</Label>
                  <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-lg transition-colors">
                    <FileText className="size-3" />
                    <span>ফাইল আপলোড (.csv, .json)</span>
                    <input
                      type="file"
                      accept=".json,.csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setType("mcq");
                      setBulkJson(cleanSampleCsv);
                    }}
                    className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                  >
                    CSV নমুনা
                  </button>
                  <span className="text-muted-foreground text-[11px]">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setType("mcq");
                      setBulkJson(cleanSampleMcqJson);
                    }}
                    className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                  >
                    MCQ JSON
                  </button>
                  <span className="text-muted-foreground text-[11px]">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setType("cq");
                      setBulkJson(cleanSampleCqJson);
                    }}
                    className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                  >
                    CQ JSON
                  </button>
                </div>
              </div>
              <Textarea
                placeholder={type === "mcq" ? cleanSampleCsv : cleanSampleCqJson}
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                rows={12}
                className="font-mono text-xs rounded-2xl bg-background leading-relaxed"
              />
            </div>

            {bulkImportStatus && (
              <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${bulkImportStatus.includes("সফলভাবে") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
                {bulkImportStatus.includes("সফলভাবে") ? <TickCircle className="size-4 shrink-0" /> : <Danger className="size-4 shrink-0" />}
                <span>{bulkImportStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBulkJson("")}
                className="rounded-xl font-bold text-xs h-10 px-4"
              >
                ক্লিয়ার
              </Button>
              <Button
                type="button"
                onClick={handleBulkImport}
                disabled={
                  isPendingUpload ||
                  !bulkJson.trim() ||
                  (uploadMode === "year" ? !yearInput.trim() : !selectedChapterId)
                }
                className="rounded-xl font-bold text-xs h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer gap-2"
              >
                <DocumentDownload className="size-4" />
                <span>
                  {isPendingUpload
                    ? "আপলোড হচ্ছে..."
                    : uploadMode === "year"
                      ? `${yearInput || "সাল"} এর প্রশ্ন আপলোড করুন`
                      : "প্রশ্ন আপলোড ও সেভ করুন"}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Location & Settings Summary Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5 lg:sticky lg:top-20">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
              <Information className="size-4 text-primary shrink-0" />
              <span>লোকেশন ও কনফিগারেশন সারসংক্ষেপ</span>
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
              {type}
            </span>
          </div>

          {/* Location Summary Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/70 text-xs flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between font-bold pb-2 border-b border-border/40">
              <span className="text-muted-foreground">মোড:</span>
              <span className="text-primary font-black">
                {uploadMode === "year" ? "সালভিত্তিক আপলোড" : "অধ্যায়ভিত্তিক আপলোড"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">প্রশ্নব্যাংক:</span>
              <span className="font-extrabold text-foreground">{currentContainer?.title || "নির্বাচন করুন"}</span>
            </div>
            {uploadMode === "year" ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">সাল / সেশন:</span>
                <span className="font-black text-primary text-sm">{yearInput || "—"}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">বিষয়:</span>
                  <span className="font-bold text-foreground">{currentSubject?.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">অধ্যায়:</span>
                  <span className="font-bold text-foreground">{currentChapter?.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">টপিক:</span>
                  <span className="font-medium text-foreground">
                    {availableTopics.find((t) => t.id === selectedTopicId)?.name || "সাধারণ (নির্দিষ্ট টপিক ছাড়া)"}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">মান / স্ট্যান্ডার্ড:</span>
              <span className="font-bold text-foreground">{standard}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">উৎস:</span>
              <span className="font-bold text-foreground">{source}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">অ্যাক্সেস:</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${isFree ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                {isFree ? "উন্মুক্ত ও ফ্রি" : "ব্যাচ এক্সক্লুসিভ"}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs flex flex-col gap-2">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <Lightbulb className="size-4 text-amber-500 shrink-0" />
              <span>সালভিত্তিক আপলোড টিপস:</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              ঢাকা বিশ্ববিদ্যালয়, বুয়েট, মেডিকেল বা বোর্ড পরীক্ষার প্রশ্ন আপলোড করতে কেবল <strong>প্রশ্নব্যাংক</strong> ও <strong>সাল</strong> নির্বাচন করে পুরো প্রশ্নপত্রের CSV বা JSON দিয়ে দিলেই চলবে। কোনো জটিল বিষয় বা অধ্যায় আলাদা তৈরি করার প্রয়োজন নেই।
            </p>
          </div>
        </div>
      </div>

      {/* Dialog: Create New QB */}
      <Dialog open={showNewQbDialog} onOpenChange={setShowNewQbDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>নতুন প্রশ্নব্যাংক ক্যাটাগরি তৈরি করুন</DialogTitle>
          </DialogHeader>
          <NewQuestionBankForm
            onSuccess={async () => {
              setShowNewQbDialog(false);
              await refreshHierarchy();
            }}
            onCancel={() => setShowNewQbDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Create New Subject */}
      <Dialog open={showNewSubjectDialog} onOpenChange={setShowNewSubjectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>নতুন বিষয় যোগ করুন ({currentContainer?.title})</DialogTitle>
          </DialogHeader>
          {currentContainer && (
            <NewSubjectForm
              qbId={currentContainer.id}
              qbSlug={currentContainer.slug}
              onSuccess={async () => {
                setShowNewSubjectDialog(false);
                await refreshHierarchy();
              }}
              onCancel={() => setShowNewSubjectDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Create New Chapter */}
      <Dialog open={showNewChapterDialog} onOpenChange={setShowNewChapterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>নতুন অধ্যায় যোগ করুন ({currentSubject?.name})</DialogTitle>
          </DialogHeader>
          {currentContainer && currentSubject && (
            <NewChapterForm
              qbSlug={currentContainer.slug}
              subjectId={currentSubject.id}
              subjectSlug={currentSubject.slug}
              onSuccess={async () => {
                setShowNewChapterDialog(false);
                await refreshHierarchy();
              }}
              onCancel={() => setShowNewChapterDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Create New Topic */}
      <Dialog open={showNewTopicDialog} onOpenChange={setShowNewTopicDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>নতুন টপিক যোগ করুন ({currentChapter?.name})</DialogTitle>
          </DialogHeader>
          {currentContainer && currentSubject && currentChapter && (
            <NewTopicForm
              qbSlug={currentContainer.slug}
              subjectSlug={currentSubject.slug}
              chapterId={currentChapter.id}
              chapterSlug={currentChapter.slug}
              onSuccess={async () => {
                setShowNewTopicDialog(false);
                await refreshHierarchy();
              }}
              onCancel={() => setShowNewTopicDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

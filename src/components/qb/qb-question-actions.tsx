"use client";

import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useId,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { Edit, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteQbQuestionAction,
  getQbMetaOptionsAction,
  type QbMetaOptions,
  type QbUploadedQuestion,
  updateQbQuestionAction,
} from "@/lib/actions/qb-uploads";

const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;
const PART_LABELS = ["a", "b", "c", "d"] as const;
const MAX_OPTIONS = OPTION_LABELS.length;
const MAX_PARTS = PART_LABELS.length;

/** Choice that reveals a text field for a brand-new subject / chapter / topic. */
const NEW_FOLDER = "__new__";
/** Topic is optional; this choice clears it. */
const NO_TOPIC = "__none__";

const STANDARD_OPTIONS = [
  { value: "HSC", label: "HSC" },
  { value: "Varsity", label: "ভার্সিটি" },
  { value: "Engineering", label: "ইঞ্জিনিয়ারিং" },
  { value: "Medical", label: "মেডিকেল" },
] as const;

interface OptionDraft {
  id: string;
  optionText: string;
  image: string;
  isCorrect: boolean;
}

interface PartDraft {
  id: string;
  questionText: string;
  answerText: string;
  marks: string;
}

function emptyOption(): OptionDraft {
  return {
    id: crypto.randomUUID(),
    optionText: "",
    image: "",
    isCorrect: false,
  };
}

function emptyPart(): PartDraft {
  return {
    id: crypto.randomUUID(),
    questionText: "",
    answerText: "",
    marks: "1",
  };
}

/** Edit and delete buttons shown on one uploaded question. */
export function QbQuestionActions({
  question,
}: {
  readonly question: QbUploadedQuestion;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="ml-1 flex items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground hover:text-foreground"
        aria-label="প্রশ্ন সম্পাদনা করুন"
        title="সম্পাদনা"
        onClick={() => setEditing(true)}
      >
        <Edit />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground hover:text-destructive"
        aria-label="প্রশ্ন মুছে ফেলুন"
        title="মুছুন"
        onClick={() => setDeleting(true)}
      >
        <Trash2 />
      </Button>

      {editing ? (
        <QbQuestionEditDialog
          question={question}
          onClose={() => setEditing(false)}
        />
      ) : null}

      {deleting ? (
        <QbQuestionDeleteDialog
          question={question}
          onClose={() => setDeleting(false)}
        />
      ) : null}
    </div>
  );
}

function QbQuestionEditDialog({
  question,
  onClose,
}: {
  readonly question: QbUploadedQuestion;
  readonly onClose: () => void;
}) {
  const router = useRouter();
  const uid = useId();
  const [isSaving, startSaving] = useTransition();
  const [meta, setMeta] = useState<QbMetaOptions | null>(null);

  const [questionText, setQuestionText] = useState(question.questionText);
  const [questionImage, setQuestionImage] = useState(
    question.questionImage ?? "",
  );
  const [explanation, setExplanation] = useState(question.explanation ?? "");
  const [explanationImage, setExplanationImage] = useState(
    question.explanationImage ?? "",
  );
  const [source, setSource] = useState(question.source);
  const [standard, setStandard] = useState<string>(question.standard);
  const [subjectChoice, setSubjectChoice] = useState(question.subjectId);
  const [chapterChoice, setChapterChoice] = useState(question.chapterId);
  const [topicChoice, setTopicChoice] = useState<string>(
    question.topicId ?? NO_TOPIC,
  );
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newChapterName, setNewChapterName] = useState("");
  const [newTopicName, setNewTopicName] = useState("");

  const [options, setOptions] = useState<OptionDraft[]>(() => {
    const existing = question.mcqOptions.map((option) => ({
      id: crypto.randomUUID(),
      optionText: option.optionText,
      image: option.image ?? "",
      isCorrect: option.isCorrect,
    }));
    return existing.length >= 2
      ? existing
      : [
          ...existing,
          ...Array.from({ length: 2 - existing.length }, emptyOption),
        ];
  });

  const [parts, setParts] = useState<PartDraft[]>(() => {
    const existing = question.cqParts.map((part) => ({
      id: crypto.randomUUID(),
      questionText: part.questionText,
      answerText: part.answerText ?? "",
      marks: String(part.marks),
    }));
    return existing.length > 0 ? existing : [emptyPart()];
  });

  useEffect(() => {
    let cancelled = false;
    getQbMetaOptionsAction()
      .then((options) => {
        if (!cancelled) setMeta(options);
      })
      .catch(() => {
        // Suggestions are optional; the fields still accept any name.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateOption(index: number, patch: Partial<OptionDraft>): void {
    setOptions((current) =>
      current.map((option, position) =>
        position === index ? { ...option, ...patch } : option,
      ),
    );
  }

  function updatePart(index: number, patch: Partial<PartDraft>): void {
    setParts((current) =>
      current.map((part, position) =>
        position === index ? { ...part, ...patch } : part,
      ),
    );
  }

  const fallbackSubjects = [
    {
      id: question.subjectId,
      name: question.subjectName,
      chapters: [
        {
          id: question.chapterId,
          name: question.chapterName,
          topics:
            question.topicId && question.topicName
              ? [{ id: question.topicId, name: question.topicName }]
              : [],
        },
      ],
    },
  ];

  const subjectTree = meta?.subjects ?? fallbackSubjects;
  const selectedSubject =
    subjectTree.find((item) => item.id === subjectChoice) ?? null;
  const chapterOptions = selectedSubject?.chapters ?? [];
  const selectedChapter =
    chapterOptions.find((item) => item.id === chapterChoice) ?? null;
  const topicOptions = selectedChapter?.topics ?? [];
  const selectedTopic =
    topicOptions.find((item) => item.id === topicChoice) ?? null;
  const hasSubject = Boolean(selectedSubject) || subjectChoice === NEW_FOLDER;
  const hasChapter = Boolean(selectedChapter) || chapterChoice === NEW_FOLDER;

  function handleSubjectChange(value: string): void {
    if (value === subjectChoice) return;
    setSubjectChoice(value);
    setChapterChoice(value === NEW_FOLDER ? NEW_FOLDER : "");
    setTopicChoice(NO_TOPIC);
    setNewChapterName("");
    setNewTopicName("");
  }

  function handleChapterChange(value: string): void {
    if (value === chapterChoice) return;
    setChapterChoice(value);
    setTopicChoice(NO_TOPIC);
    setNewTopicName("");
    if (value !== NEW_FOLDER) setNewChapterName("");
  }

  function handleTopicChange(value: string): void {
    if (value === topicChoice) return;
    setTopicChoice(value);
    if (value !== NEW_FOLDER) setNewTopicName("");
  }

  function resolveFolderNames(): {
    readonly subjectName: string;
    readonly chapterName: string;
    readonly topicName: string;
  } {
    const subjectName =
      subjectChoice === NEW_FOLDER
        ? newSubjectName.trim()
        : (selectedSubject?.name ?? question.subjectName);

    const chapterName =
      chapterChoice === NEW_FOLDER
        ? newChapterName.trim()
        : (selectedChapter?.name ??
          (chapterChoice === question.chapterId ? question.chapterName : ""));

    const topicName =
      topicChoice === NO_TOPIC
        ? ""
        : topicChoice === NEW_FOLDER
          ? newTopicName.trim()
          : (selectedTopic?.name ??
            (topicChoice === question.topicId
              ? (question.topicName ?? "")
              : ""));

    return { subjectName, chapterName, topicName };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const { subjectName, chapterName, topicName } = resolveFolderNames();

    if (!subjectName) {
      toast.error("বিষয় বাছুন বা নতুন বিষয়ের নাম লিখুন।");
      return;
    }
    if (!chapterName) {
      toast.error("অধ্যায় বাছুন বা নতুন অধ্যায়ের নাম লিখুন।");
      return;
    }

    startSaving(async () => {
      try {
        const result = await updateQbQuestionAction({
          id: question.id,
          questionText,
          questionImage: questionImage || null,
          explanation: explanation || null,
          explanationImage: explanationImage || null,
          source,
          standard,
          subjectName,
          chapterName,
          topicName: topicName || null,
          options:
            question.type === "mcq"
              ? options.map((option) => ({
                  optionText: option.optionText,
                  image: option.image || null,
                  isCorrect: option.isCorrect,
                }))
              : undefined,
          parts:
            question.type === "cq"
              ? parts.map((part) => ({
                  questionText: part.questionText,
                  answerText: part.answerText || null,
                  marks: Number(part.marks) || 1,
                }))
              : undefined,
        });

        if (!result.ok) {
          toast.error(result.error ?? "সংরক্ষণ করা যায়নি।");
          return;
        }

        toast.success("প্রশ্ন আপডেট হয়েছে।");
        onClose();
        router.refresh();
      } catch {
        toast.error("সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।");
      }
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose();
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>প্রশ্ন সম্পাদনা করুন</DialogTitle>
          <DialogDescription>
            {question.type === "mcq" ? "MCQ" : "CQ"} · {question.subjectName} ›{" "}
            {question.chapterName}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <section className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-question`}>প্রশ্ন</Label>
              <Textarea
                id={`${uid}-question`}
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-question-image`}>প্রশ্নের ছবির URL</Label>
              <Input
                id={`${uid}-question-image`}
                value={questionImage}
                onChange={(event) => setQuestionImage(event.target.value)}
                placeholder="https://… (ঐচ্ছিক)"
              />
            </div>
          </section>

          {question.type === "mcq" ? (
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>অপশন</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={options.length >= MAX_OPTIONS}
                  onClick={() =>
                    setOptions((current) =>
                      current.length >= MAX_OPTIONS
                        ? current
                        : [...current, emptyOption()],
                    )
                  }
                >
                  + অপশন
                </Button>
              </div>

              <div className="space-y-2">
                {options.map((option, index) => {
                  const optionId = `${uid}-option-${index}`;
                  const correctId = `${uid}-correct-${index}`;
                  const label = OPTION_LABELS[index] ?? String(index + 1);

                  return (
                    <div
                      key={option.id}
                      className="space-y-2 rounded-lg border p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-bold">
                          {label}
                        </span>
                        <Input
                          id={optionId}
                          value={option.optionText}
                          onChange={(event) =>
                            updateOption(index, {
                              optionText: event.target.value,
                            })
                          }
                          placeholder={`অপশন ${label}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`অপশন ${label} মুছুন`}
                          title="অপশন মুছুন"
                          disabled={options.length <= 2}
                          onClick={() =>
                            setOptions((current) =>
                              current.filter(
                                (_item, position) => position !== index,
                              ),
                            )
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 pl-8">
                        <Input
                          value={option.image}
                          onChange={(event) =>
                            updateOption(index, { image: event.target.value })
                          }
                          placeholder="ছবির URL (ঐচ্ছিক)"
                          className="h-8 text-xs"
                        />
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Checkbox
                            id={correctId}
                            checked={option.isCorrect}
                            onCheckedChange={(checked) =>
                              updateOption(index, {
                                isCorrect: checked === true,
                              })
                            }
                          />
                          <Label
                            htmlFor={correctId}
                            className="cursor-pointer text-xs whitespace-nowrap"
                          >
                            সঠিক
                          </Label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>অংশ</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={parts.length >= MAX_PARTS}
                  onClick={() =>
                    setParts((current) =>
                      current.length >= MAX_PARTS
                        ? current
                        : [...current, emptyPart()],
                    )
                  }
                >
                  + অংশ
                </Button>
              </div>

              <div className="space-y-2">
                {parts.map((part, index) => {
                  const label = PART_LABELS[index] ?? String(index + 1);
                  return (
                    <div
                      key={part.id}
                      className="space-y-2 rounded-lg border p-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">({label})</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`অংশ ${label} মুছুন`}
                          title="অংশ মুছুন"
                          disabled={parts.length <= 1}
                          onClick={() =>
                            setParts((current) =>
                              current.filter(
                                (_item, position) => position !== index,
                              ),
                            )
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>

                      <Textarea
                        value={part.questionText}
                        onChange={(event) =>
                          updatePart(index, {
                            questionText: event.target.value,
                          })
                        }
                        rows={2}
                        placeholder="অংশের প্রশ্ন"
                      />
                      <Textarea
                        value={part.answerText}
                        onChange={(event) =>
                          updatePart(index, { answerText: event.target.value })
                        }
                        rows={2}
                        placeholder="উত্তর (ঐচ্ছিক)"
                      />

                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`${uid}-marks-${index}`}
                          className="text-xs"
                        >
                          নম্বর
                        </Label>
                        <Input
                          id={`${uid}-marks-${index}`}
                          type="number"
                          min={1}
                          max={100}
                          value={part.marks}
                          onChange={(event) =>
                            updatePart(index, { marks: event.target.value })
                          }
                          className="h-8 w-20"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-explanation`}>ব্যাখ্যা</Label>
              <Textarea
                id={`${uid}-explanation`}
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                rows={3}
                placeholder="ঐচ্ছিক"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-explanation-image`}>ব্যাখ্যার ছবির URL</Label>
              <Input
                id={`${uid}-explanation-image`}
                value={explanationImage}
                onChange={(event) => setExplanationImage(event.target.value)}
                placeholder="https://… (ঐচ্ছিক)"
              />
            </div>
          </section>

          <section className="space-y-3 rounded-xl border bg-muted/20 p-3">
            <p className="text-[11px] font-bold text-muted-foreground">
              শ্রেণিবিন্যাস
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-subject`}>বিষয়</Label>
                <Select
                  value={subjectChoice}
                  onValueChange={(value) => handleSubjectChange(String(value))}
                >
                  <SelectTrigger
                    id={`${uid}-subject`}
                    aria-label="বিষয়"
                    className="h-9 w-full bg-background"
                  >
                    <SelectValue placeholder="বিষয় বাছুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectTree.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                    {subjectChoice !== NEW_FOLDER &&
                    !subjectTree.some(
                      (subject) => subject.id === subjectChoice,
                    ) ? (
                      <SelectItem value={question.subjectId}>
                        {question.subjectName}
                      </SelectItem>
                    ) : null}
                    <SelectItem value={NEW_FOLDER}>＋ নতুন বিষয়…</SelectItem>
                  </SelectContent>
                </Select>
                {subjectChoice === NEW_FOLDER ? (
                  <Input
                    value={newSubjectName}
                    onChange={(event) => setNewSubjectName(event.target.value)}
                    placeholder="নতুন বিষয়ের নাম"
                  />
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-chapter`}>অধ্যায়</Label>
                <Select
                  value={chapterChoice || null}
                  disabled={!hasSubject}
                  onValueChange={(value) => handleChapterChange(String(value))}
                >
                  <SelectTrigger
                    id={`${uid}-chapter`}
                    aria-label="অধ্যায়"
                    className="h-9 w-full bg-background"
                  >
                    <SelectValue
                      placeholder={hasSubject ? "অধ্যায় বাছুন" : "আগে বিষয় বাছুন"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {chapterOptions.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        {chapter.name}
                      </SelectItem>
                    ))}
                    {chapterChoice &&
                    chapterChoice !== NEW_FOLDER &&
                    !chapterOptions.some(
                      (chapter) => chapter.id === chapterChoice,
                    ) &&
                    chapterChoice === question.chapterId ? (
                      <SelectItem value={question.chapterId}>
                        {question.chapterName}
                      </SelectItem>
                    ) : null}
                    <SelectItem value={NEW_FOLDER}>＋ নতুন অধ্যায়…</SelectItem>
                  </SelectContent>
                </Select>
                {chapterChoice === NEW_FOLDER ? (
                  <Input
                    value={newChapterName}
                    onChange={(event) => setNewChapterName(event.target.value)}
                    placeholder="নতুন অধ্যায়ের নাম"
                  />
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-topic`}>টপিক</Label>
                <Select
                  value={topicChoice}
                  disabled={!hasChapter}
                  onValueChange={(value) => handleTopicChange(String(value))}
                >
                  <SelectTrigger
                    id={`${uid}-topic`}
                    aria-label="টপিক"
                    className="h-9 w-full bg-background"
                  >
                    <SelectValue placeholder="টপিক (ঐচ্ছিক)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TOPIC}>কোনো টপিক নেই</SelectItem>
                    {topicOptions.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                    {topicChoice !== NO_TOPIC &&
                    topicChoice !== NEW_FOLDER &&
                    !topicOptions.some((topic) => topic.id === topicChoice) &&
                    topicChoice === question.topicId ? (
                      <SelectItem value={topicChoice}>
                        {question.topicName ?? ""}
                      </SelectItem>
                    ) : null}
                    <SelectItem value={NEW_FOLDER}>＋ নতুন টপিক…</SelectItem>
                  </SelectContent>
                </Select>
                {topicChoice === NEW_FOLDER ? (
                  <Input
                    value={newTopicName}
                    onChange={(event) => setNewTopicName(event.target.value)}
                    placeholder="নতুন টপিকের নাম"
                  />
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-source`}>উৎস</Label>
                <Input
                  id={`${uid}-source`}
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  placeholder="যেমন: ঢাকা বোর্ড ২০২৪"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-standard`}>মান</Label>
                <Select value={standard} onValueChange={setStandard}>
                  <SelectTrigger
                    id={`${uid}-standard`}
                    aria-label="মান"
                    className="h-9 w-full bg-background"
                  >
                    <SelectValue placeholder="মান বাছুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              বাতিল
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Spinner className="size-4" /> : null}
              সংরক্ষণ করুন
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QbQuestionDeleteDialog({
  question,
  onClose,
}: {
  readonly question: QbUploadedQuestion;
  readonly onClose: () => void;
}) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();

  function handleDelete(): void {
    startDeleting(async () => {
      try {
        const result = await deleteQbQuestionAction(question.id);
        if (!result.ok) {
          toast.error(result.error ?? "প্রশ্নটি মোছা যায়নি।");
          return;
        }

        toast.success("প্রশ্নটি মুছে ফেলা হয়েছে।");
        onClose();
        router.refresh();
      } catch {
        toast.error("প্রশ্নটি মোছা যায়নি। আবার চেষ্টা করুন।");
      }
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>প্রশ্নটি মুছে ফেলবেন?</DialogTitle>
          <DialogDescription>
            প্রশ্নটি, এর অপশন এবং উত্তর স্থায়ীভাবে মুছে যাবে। এটি ফেরানো যাবে না।
          </DialogDescription>
        </DialogHeader>

        <p className="line-clamp-3 rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
          {question.questionText}
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            বাতিল
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Spinner className="size-4" /> : null}
            মুছে ফেলুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

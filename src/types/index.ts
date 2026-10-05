import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from "react";
import type { dictionary } from "@/lib/dictionary";

export type Dictionary = typeof dictionary;

export interface PageProps {
  readonly params: Promise<{ readonly lang: string }>;
}

export interface LayoutProps extends PageProps {
  readonly children: ReactNode;
}

export interface ShellProps {
  readonly children: ReactNode;
  readonly dict: Dictionary;
  readonly lang: string;
}

export interface SidebarProps {
  readonly onClose?: () => void;
  readonly dict: Dictionary;
  readonly lang: string;
}

export interface SubmitFormProps {
  readonly d: Dictionary["submit"];
}

export interface ThemeProviderProps {
  readonly children: ReactNode;
}

export type TransitionVariant =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "rectangle"
  | "star";

export interface ThemeTogglerProps extends ComponentPropsWithoutRef<"button"> {
  readonly duration?: number;
  readonly variant?: TransitionVariant;
  /** When true, the transition expands from the viewport center instead of the button center. */
  readonly fromCenter?: boolean;
  /**
   * Controlled theme value. When provided, the parent owns persistence
   * (e.g. `next-themes`) and this component will not write to localStorage.
   */
  readonly theme?: "light" | "dark";
  /** Called on toggle. Pair with `theme` for controlled usage. */
  readonly onThemeChange?: (theme: "light" | "dark") => void;
}

export interface LoginFormProps {
  readonly dict: Dictionary;
}

export interface AppBadgeChipProps {
  readonly iconSrc: string;
  readonly iconAlt: string;
  readonly text: string;
  readonly className?: string;
}

export interface DownloadMacButtonProps {
  readonly text: string;
  readonly className?: string;
}

export interface Resource {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly thumbnail: string;
  readonly images: readonly string[];
}

export interface ResourceRowCardProps {
  readonly resource: Resource;
  readonly previewText: string;
  readonly downloadText: string;
}

export interface NavItem {
  readonly name: string;
  readonly path: string;
  readonly exact: boolean;
  readonly icon: ComponentType<{
    readonly size?: number;
    readonly color?: string;
    readonly className?: string;
  }>;
  readonly count?: number;
}

export interface Exam {
  readonly id: string;
  readonly subject: string;
  readonly date: string;
  readonly dateObj?: Date;
  readonly countdown?: string;
  readonly title?: string;
  readonly syllabus?: string | null;
  readonly examDate?: Date | null;
  readonly durationMinutes?: number;
  readonly totalMarks?: number;
  readonly batchId?: string;
}

export interface ExamRoutine {
  readonly id: string;
  readonly batchId: string;
  readonly title: string;
  readonly subject: string;
  readonly syllabus?: string | null;
  readonly examDate: Date;
  readonly durationMinutes: number;
  readonly totalMarks: number;
  readonly createdAt?: Date;
}

export interface CalendarSettings {
  readonly title: string;
  readonly subtitle: string;
}

export interface Batch {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string | null;
  readonly courseId?: string | null;
  readonly isActive?: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface CourseClass {
  readonly id: string;
  readonly batchId: string;
  readonly title: string;
  readonly subject: string;
  readonly chapter?: string | null;
  readonly youtubeUrl: string;
  readonly description?: string | null;
  readonly durationMinutes?: number | null;
  readonly orderIndex: number;
  readonly isLive: boolean;
  readonly isPublished: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface CoursePdf {
  readonly id: string;
  readonly batchId: string;
  readonly title: string;
  readonly subject: string;
  readonly chapter?: string | null;
  readonly pdfUrl: string;
  readonly description?: string | null;
  readonly fileSize?: string | null;
  readonly orderIndex: number;
  readonly isPublished: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface SidebarAnnouncement {
  readonly imageSrc: string;
  readonly imageAlt: string;
  readonly title: string;
  readonly subtitle: string;
  readonly href: string;
}

export interface Container {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description?: string | null;
  readonly isPublic?: boolean;
  readonly items?: { readonly count: number }[];
  readonly createdAt?: Date;
}

export interface Item {
  readonly id: string;
  readonly container_id?: string;
  readonly containerId?: string;
  readonly name: string;
  readonly code?: string | null;
  readonly slug: string;
  readonly subitems?: { readonly count: number }[];
  readonly questions?: { readonly count: number }[];
}

export interface Subitem {
  readonly id: string;
  readonly item_id?: string;
  readonly itemId?: string;
  readonly paper?: string | null;
  readonly name: string;
  readonly slug: string;
  readonly order_no?: number;
  readonly orderNo?: number;
  readonly topics?: { readonly count: number }[];
  readonly questions?: { readonly count: number }[];
}

export interface Topic {
  readonly id: string;
  readonly subitem_id?: string;
  readonly subitemId?: string;
  readonly name: string;
  readonly slug: string;
  readonly questions?: { readonly count: number }[];
}

export interface MCQQuestion {
  readonly question: string;
  readonly options: readonly string[];
  readonly correctIdx: number;
  readonly explanation?: string;
}

export interface MCQOption {
  readonly id: string;
  readonly question_id?: string;
  readonly questionId?: string;
  readonly option_text?: string;
  readonly optionText?: string;
  readonly is_correct?: boolean;
  readonly isCorrect?: boolean;
  readonly order_no?: number;
  readonly orderNo?: number;
}

export interface CQPart {
  readonly id: string;
  readonly question_id?: string;
  readonly questionId?: string;
  readonly part_key?: string;
  readonly partKey?: "a" | "b" | "c" | "d";
  readonly question_text?: string;
  readonly questionText?: string;
  readonly answer_text?: string | null;
  readonly answerText?: string | null;
  readonly marks: number;
  readonly order_no?: number;
  readonly orderNo?: number;
}

export interface Question {
  readonly id: string;
  readonly type: "mcq" | "cq";
  readonly source: string;
  readonly standard: string;
  readonly question_text?: string;
  readonly questionText?: string;
  readonly explanation?: string | null;
  readonly topic_id?: string | null;
  readonly topicId?: string | null;
  readonly subitemId?: string;
  readonly subitem_id?: string;
  readonly isFree?: boolean;
  readonly is_free?: boolean;
  readonly mcq_options?: readonly MCQOption[];
  readonly mcqOptions?: readonly MCQOption[];
  readonly cq_parts?: readonly CQPart[];
  readonly cqParts?: readonly CQPart[];
}

export type QuestionSource = "board" | "varsity" | "engineering" | "custom";

export const QUESTION_STANDARDS = [
  "HSC",
  "Varsity",
  "Engineering",
  "Medical",
] as const;

export type QuestionStandard = (typeof QUESTION_STANDARDS)[number];

export interface CreateQuestionPayload {
  readonly subjectId: string;
  readonly chapterId: string;
  readonly topicId?: string | null;
  readonly type: "mcq" | "cq";
  readonly source?: QuestionSource | string;
  readonly standard?: QuestionStandard | string;
  readonly questionText: string;
  readonly explanation?: string;
  readonly isFree?: boolean;
  readonly mcqOptions?: readonly { optionText: string; isCorrect: boolean }[];
  readonly cqParts?: readonly {
    partKey: string;
    questionText: string;
    answerText?: string;
    marks: number;
  }[];
}

export interface ImportQuestionItem {
  readonly type?: "mcq" | "cq";
  readonly source?: string;
  readonly standard?: QuestionStandard | string;
  readonly isFree?: boolean;
  readonly is_free?: boolean;
  readonly topicId?: string;
  readonly questionText: string;
  readonly explanation?: string;
  readonly mcqOptions?: readonly {
    readonly optionText: string;
    readonly isCorrect: boolean;
  }[];
  readonly cqParts?: readonly {
    readonly partKey: "a" | "b" | "c" | "d" | string;
    readonly questionText: string;
    readonly answerText?: string;
    readonly marks: number;
  }[];
}

export interface PdfSuggestion {
  readonly id: string;
  readonly title: string;
  readonly subject: string;
  readonly paper: string;
  readonly chapter?: string | null;
  readonly hscBatch?: string | null;
  readonly fileUrl: string;
  readonly thumbnailUrl?: string | null;
  readonly downloadCount?: number;
  readonly isFeatured?: boolean;
  readonly createdAt?: Date;
}

// Admission tracks shown on /calendar. Single source of truth for the order
// and the union type used by the admin editor, seed script and public page.
export const CALENDAR_CATEGORIES = [
  "medical",
  "varsity",
  "engineering",
  "guchcho",
] as const;

export type CalendarCategory = (typeof CALENDAR_CATEGORIES)[number];

export interface ExamDetail {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string | null;
  readonly type:
    | "practice"
    | "chapter_test"
    | "weekly"
    | "model_test"
    | "live_contest";
  readonly standard?: QuestionStandard | string;
  readonly durationMinutes: number;
  readonly totalMarks: number;
  readonly negativeMarking: string;
  readonly isPublished: boolean;
  readonly showResultImmediately: boolean;
  readonly createdBy?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly examQuestions?: readonly ExamQuestion[];
}

export interface ExamQuestion {
  readonly id: string;
  readonly examId: string;
  readonly questionId: string;
  readonly orderNo: number;
  readonly marks: number;
  readonly section?: string | null;
  readonly question?: Question;
}

export interface ExamSubmission {
  readonly id: string;
  readonly examId: string;
  readonly batchExamId?: string | null;
  readonly userId: string;
  readonly score: string;
  readonly totalMarks: number;
  readonly attemptNumber: number;
  readonly timeTakenSeconds: number;
  readonly status: "in_progress" | "submitted" | "evaluated" | string;
  /** True when the attempt began inside the scheduled window (merit list). */
  readonly isLiveAttempt: boolean;
  readonly startedAt: Date;
  readonly submittedAt?: Date | null;
}

export interface ExamResponse {
  readonly id: string;
  readonly submissionId: string;
  readonly examQuestionId: string;
  readonly selectedOptionId?: string | null;
  readonly cqAnswerText?: string | null;
  readonly isCorrect: boolean;
  readonly marksObtained: string;
}

export interface LeaderboardEntry {
  readonly rank: number;
  readonly userId: string;
  readonly userName: string;
  readonly userImage?: string | null;
  readonly userEmail?: string | null;
  readonly college?: string | null;
  readonly hscBatch?: string | null;
  readonly score: string;
  readonly totalMarks: number;
  readonly timeTakenSeconds: number;
  readonly submittedAt: Date | null;
}

export interface BatchMember {
  readonly id: string;
  readonly batchId: string;
  readonly userId: string;
  readonly name?: string;
  readonly email?: string;
  readonly role: string;
  readonly status: string;
  readonly joinedAt: Date;
  readonly enrollmentRequest?: any;
}

export interface BatchExamDetail {
  readonly id: string;
  readonly batchId: string;
  readonly examId: string;
  readonly exam?: {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
    readonly type: string;
    readonly durationMinutes: number;
    readonly totalMarks: number;
  } | null;
  readonly startsAt?: string | null;
  readonly endsAt?: string | null;
  readonly isRequired: boolean;
  readonly maxAttempts?: number | null;
  readonly batch?: {
    readonly id: string;
    readonly name: string;
    readonly hscBatch?: string | null;
  } | null;
}

export interface BatchDetail extends Batch {
  readonly members?: readonly BatchMember[];
  readonly batchExams?: readonly BatchExamDetail[];
}

import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  role: text("role").default("student"),
  hscBatch: text("hsc_batch"),
  school: text("school"),
  college: text("college"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  issuer: text("issuer"),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const profiles = user;

// ─── Question Bank ────────────────────────────────────────────────────────────

export const containers = pgTable("containers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const items = pgTable("items", {
  id: text("id").primaryKey(),
  containerId: text("container_id")
    .notNull()
    .references(() => containers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code"),
  slug: text("slug").notNull().unique(),
});

export const subitems = pgTable("subitems", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  paper: text("paper"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  orderNo: integer("order_no").default(0).notNull(),
});

export const topics = pgTable("topics", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  subitemId: text("subitem_id")
    .notNull()
    .references(() => subitems.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
});

export const questions = pgTable("questions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  subitemId: text("subitem_id")
    .notNull()
    .references(() => subitems.id, { onDelete: "cascade" }),
  topicId: text("topic_id").references(() => topics.id, {
    onDelete: "set null",
  }),
  type: text("type", { enum: ["mcq", "cq"] }).notNull(),
  source: text("source").notNull(),
  standard: text("standard", {
    enum: ["HSC", "Varsity", "Engineering", "Medical"],
  })
    .default("HSC")
    .notNull(),
  questionText: text("question_text").notNull(),
  /** Image shown under the stem — a URL, not a file. Text still holds the rest. */
  questionImage: text("question_image"),
  explanation: text("explanation"),
  /** Image shown under the explanation. */
  explanationImage: text("explanation_image"),
  isFree: boolean("is_free").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mcqOptions = pgTable("mcq_options", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  /** Image for this option — a URL, not a file. */
  image: text("image"),
  isCorrect: boolean("is_correct").default(false).notNull(),
  orderNo: integer("order_no").default(0).notNull(),
});

export const cqParts = pgTable("cq_parts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  partKey: text("part_key", { enum: ["a", "b", "c", "d"] }).notNull(),
  questionText: text("question_text").notNull(),
  answerText: text("answer_text"),
  marks: integer("marks").notNull(),
  orderNo: integer("order_no").notNull(),
});

// ─── Question metadata ───────────────────────────────────────────────────────
// The container → item → subitem tree above is the original bank layout and
// stays untouched. These tables add the dimensions that tree cannot express,
// so one uploaded question can be listed by exam *and* by subject / chapter
// without ever being copied.

/** Who runs the exam — decides which bank a question is listed under. */
export const QB_EXAM_TYPES = [
  "board",
  "university",
  "engineering",
  "medical",
  "other",
] as const;
export type QbExamType = (typeof QB_EXAM_TYPES)[number];

/** A board, a university or an engineering institute. */
export const qbInstitutes = pgTable(
  "qb_institutes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: text("type", { enum: QB_EXAM_TYPES }).notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    orderNo: integer("order_no").default(0).notNull(),
  },
  (table) => [uniqueIndex("qb_institute_slug_unique_idx").on(table.slug)],
);

/** A subject with its paper, e.g. পদার্থবিজ্ঞান · ১ম পত্র. */
export const qbSubjects = pgTable(
  "qb_subjects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    /** "1st Paper" / "2nd Paper" — blank when the subject has no paper split. */
    paper: text("paper").default("").notNull(),
    slug: text("slug").notNull(),
    orderNo: integer("order_no").default(0).notNull(),
  },
  (table) => [uniqueIndex("qb_subject_slug_unique_idx").on(table.slug)],
);

/** A chapter inside a subject — নিউটনের গতিসূত্র. */
export const qbChapters = pgTable(
  "qb_chapters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    subjectId: text("subject_id")
      .notNull()
      .references(() => qbSubjects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    orderNo: integer("order_no").default(0).notNull(),
  },
  (table) => [
    // Per subject, not global: two subjects may each have a chapter called
    // "সমীকরণ", and the slug then stays readable in the URL.
    uniqueIndex("qb_chapter_slug_unique_idx").on(table.subjectId, table.slug),
    index("qb_chapter_subject_idx").on(table.subjectId),
  ],
);

/**
 * One exam occurrence — a question as it appeared in one particular paper.
 *
 * A question gets one row per exam it sat in, so the same Physics question found
 * in a board paper and a medical paper is stored once and listed under both.
 * `questionId` is therefore an ordinary indexed column, not a primary key.
 */
export const qbQuestionMeta = pgTable(
  "qb_question_meta",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    examType: text("exam_type", { enum: QB_EXAM_TYPES }),
    instituteId: text("institute_id").references(() => qbInstitutes.id, {
      onDelete: "set null",
    }),
    /** Science / Humanities / Commerce. */
    groupName: text("group_name").default("").notNull(),
    /** "A Unit" / "A Group". */
    unitName: text("unit_name").default("").notNull(),
    /** "2025" or "2024-25". */
    year: text("year").default("").notNull(),
    subjectId: text("subject_id").references(() => qbSubjects.id, {
      onDelete: "set null",
    }),
    chapterId: text("chapter_id").references(() => qbChapters.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("qb_meta_question_idx").on(table.questionId),
    index("qb_meta_exam_type_idx").on(table.examType),
    index("qb_meta_institute_idx").on(table.instituteId),
    index("qb_meta_subject_idx").on(table.subjectId),
    index("qb_meta_chapter_idx").on(table.chapterId),
    index("qb_meta_year_idx").on(table.year),
  ],
);

/** A named topic inside a chapter — বৈদ্যুতিক বিভব. */
export const qbTopics = pgTable(
  "qb_topics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    chapterId: text("chapter_id")
      .notNull()
      .references(() => qbChapters.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (table) => [
    uniqueIndex("qb_topics_slug_unique_idx").on(table.chapterId, table.slug),
    index("qb_topics_chapter_idx").on(table.chapterId),
  ],
);

/**
 * A question may belong to more than one topic.
 *
 * A chemical-equilibrium question can be filed under both "ভারসাম্য" and
 * "Le Chatelier" without being written twice, and a topic page can then find it
 * through either name.
 */
export const qbQuestionTopics = pgTable(
  "qb_question_topics",
  {
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => qbTopics.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.questionId, table.topicId] })],
);

export const tags = pgTable("tags", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
});

export const questionTags = pgTable("question_tags", {
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  tagId: text("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

// ─── Courses ──────────────────────────────────────────────────────────────────
// Declared before batches because batches.courseId references courses.id.

export const batchEnrollmentRequests = pgTable("batch_enrollment_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  batchId: text("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  transactionId: text("transaction_id").notNull(),
  senderNumber: text("sender_number").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .default("pending")
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by").references(() => user.id, {
    onDelete: "set null",
  }),
  rejectionReason: text("rejection_reason"),
});
export const batchEnrollments = pgTable("batch_enrollments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  batchId: text("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  requestId: text("request_id").references(() => batchEnrollmentRequests.id, {
    onDelete: "set null",
  }),
  amountPaid: integer("amount_paid").notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  status: text("status", { enum: ["active", "expired", "revoked"] })
    .default("active")
    .notNull(),
  accessGrantedBy: text("access_granted_by").references(() => user.id, {
    onDelete: "set null",
  }),
}); // ─── Batches ──────────────────────────────────────────────────────────────────
// A batch is a cohort of students, optionally tied to a course.
// hscYear is omitted — batches.hscBatch is the canonical course category
// ("Academic" | "Admission"); duplicating it here risks contradictory data.

export const batches = pgTable("batches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subtitle: text("subtitle"),
  description: text("description").notNull(),
  hscBatch: text("hsc_batch").notNull(), // "Academic" | "Admission"
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  image: text("image").notNull(),
  badge: text("badge"),
  isPublished: boolean("is_published").default(true),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const batchDetails = pgTable("batch_details", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  batchId: text("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  features: json("features").notNull(),
  curriculum: json("curriculum").notNull(),
  mentorIds: json("mentor_ids").notNull(),
  faqs: json("faqs").notNull(),
  demoVideoUrl: text("demo_video_url"),
  routineUrl: text("routine_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Membership is separate from exam assignment — enables:
// user → batch_members → batch → batch_exams → exam (authorization chain)
export const batchMembers = pgTable(
  "batch_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    batchId: text("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["student", "moderator", "instructor"] })
      .default("student")
      .notNull(),
    status: text("status", { enum: ["active", "suspended", "completed"] })
      .default("active")
      .notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("batch_member_unique_idx").on(table.batchId, table.userId),
  ],
);

// ─── Exams ────────────────────────────────────────────────────────────────────
// Exams are reusable independent objects. Scheduling/access policy lives in
// batch_exams, not here.

export const exams = pgTable("exams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  type: text("type", {
    enum: ["practice", "chapter_test", "weekly", "model_test", "live_contest"],
  })
    .default("practice")
    .notNull(),
  standard: text("standard", {
    enum: ["HSC", "Varsity", "Engineering", "Medical"],
  })
    .default("HSC")
    .notNull(),
  durationMinutes: integer("duration_minutes").default(30).notNull(),
  totalMarks: integer("total_marks").default(25).notNull(),
  // Stored as string for exact precision; parse with parseFloat()
  negativeMarking: text("negative_marking").default("0.25").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  showResultImmediately: boolean("show_result_immediately")
    .default(true)
    .notNull(),
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Scheduling + per-batch access policy for an exam.
// maxAttempts: NULL = unlimited, 1 = one attempt, 3 = three attempts, etc.
export const batchExams = pgTable(
  "batch_exams",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    batchId: text("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    examId: text("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    startsAt: text("starts_at"),
    endsAt: text("ends_at"),
    isRequired: boolean("is_required").default(true).notNull(),
    maxAttempts: integer("max_attempts"), // NULL = unlimited
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("batch_exam_unique_idx").on(table.batchId, table.examId),
  ],
);

// Which past exams a batch keeps on its আর্কাইভ পরীক্ষা list. Per batch, so
// one exam can be archived for a course without touching the others.
export const batchArchivedExams = pgTable(
  "batch_archived_exams",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    batchId: text("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    examId: text("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("batch_archived_exam_unique_idx").on(
      table.batchId,
      table.examId,
    ),
  ],
);

// Each row is one question slot inside a specific exam.
// negativeMarks is absent — the exam's negativeMarking applies globally.
export const examQuestions = pgTable(
  "exam_questions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    examId: text("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    orderNo: integer("order_no").notNull(),
    marks: integer("marks").default(1).notNull(), // may differ per exam
    section: text("section"), // optional grouping: "Physics", "Section A", etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // No two questions can occupy the same position in the same exam
    uniqueIndex("exam_question_order_unique_idx").on(
      table.examId,
      table.orderNo,
    ),
    // A question can only appear once in a given exam
    uniqueIndex("exam_question_unique_idx").on(table.examId, table.questionId),
  ],
);

// ─── Exam Routines ────────────────────────────────────────────────────────────
// Calendar/routine entries for a batch (separate from the live exam system).

export const examRoutines = pgTable("exam_routines", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  batchId: text("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  syllabus: text("syllabus"),
  examDate: timestamp("exam_date").notNull(),
  durationMinutes: integer("duration_minutes").default(30).notNull(),
  totalMarks: integer("total_marks").default(25).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Submissions & Responses ──────────────────────────────────────────────────

// One row per student attempt at an exam.
// examId is kept alongside batchExamId for fast filtering; app must keep them in sync.
// submittedAt is nullable: NULL while status = "in_progress".
export const examSubmissions = pgTable("exam_submissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  examId: text("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  batchExamId: text("batch_exam_id").references(() => batchExams.id, {
    onDelete: "set null",
  }),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  score: text("score").default("0").notNull(),
  totalMarks: integer("total_marks").notNull(),
  attemptNumber: integer("attempt_number").default(1).notNull(),
  timeTakenSeconds: integer("time_taken_seconds").default(0).notNull(),
  status: text("status", { enum: ["in_progress", "submitted", "evaluated"] })
    .default("submitted")
    .notNull(),
  // Snapshot of the batch_exams window at the moment the attempt began.
  // NULL window => the admin scheduled no time, so it counts as live.
  // Attempts started outside the window are practice attempts and are kept
  // out of the merit list.
  isLiveAttempt: boolean("is_live_attempt").default(false).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"), // NULL while in_progress
});

// One row per question answer per submission.
// questionId is NOT stored here — derive via examQuestion → question.
export const examResponses = pgTable("exam_responses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => examSubmissions.id, { onDelete: "cascade" }),
  examQuestionId: text("exam_question_id")
    .notNull()
    .references(() => examQuestions.id, { onDelete: "cascade" }),
  selectedOptionId: text("selected_option_id").references(() => mcqOptions.id, {
    onDelete: "set null",
  }),
  cqAnswerText: text("cq_answer_text"),
  isCorrect: boolean("is_correct").default(false).notNull(),
  marksObtained: text("marks_obtained").default("0").notNull(),
});

// ─── Other Tables ─────────────────────────────────────────────────────────────

export const pdfSuggestions = pgTable("pdf_suggestions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  paper: text("paper").default("1st").notNull(),
  chapter: text("chapter"),
  hscBatch: text("hsc_batch"),
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  downloadCount: integer("download_count").default(0).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const polls = pgTable("polls", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  questionText: text("question_text").notNull(),
  subject: text("subject"),
  chapter: text("chapter"),
  explanation: text("explanation"),
  expiresAt: text("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pollOptions = pgTable("poll_options", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pollId: text("poll_id")
    .notNull()
    .references(() => polls.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(),
  votesCount: integer("votes_count").default(0).notNull(),
  orderNo: integer("order_no").default(0).notNull(),
});

export const pollVotes = pgTable("poll_votes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pollId: text("poll_id")
    .notNull()
    .references(() => polls.id, { onDelete: "cascade" }),
  pollOptionId: text("poll_option_id")
    .notNull()
    .references(() => pollOptions.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: json("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseClasses = pgTable("course_classes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  batchId: text("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  chapter: text("chapter"),
  youtubeUrl: text("youtube_url").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").default(60),
  orderIndex: integer("order_index").default(0).notNull(),
  isLive: boolean("is_live").default(false).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const coursePdfs = pgTable("course_pdfs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  batchId: text("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  chapter: text("chapter"),
  pdfUrl: text("pdf_url").notNull(),
  description: text("description"),
  fileSize: text("file_size"),
  orderIndex: integer("order_index").default(0).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * The weekly routine as pictures — one row per page.
 *
 * A course can span several weeks or several groups, so a single PDF link was
 * never enough. The admin adds as many images as the course has pages, and the
 * student either swipes through them or takes them away as one PDF.
 */
export const batchRoutineImages = pgTable(
  "batch_routine_images",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    batchId: text("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    /** Optional caption, e.g. "সপ্তাহ ১" or "সেকেন্ড গ্রুপ". */
    title: text("title"),
    imageUrl: text("image_url").notNull(),
    /** Page order in the gallery and in the generated PDF. */
    orderIndex: integer("order_index").default(0).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("batch_routine_images_batch_idx").on(table.batchId)],
);

export const batchQbAccess = pgTable(
  "batch_qb_access",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    batchId: text("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    containerId: text("container_id")
      .notNull()
      .references(() => containers.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("batch_qb_unique_idx").on(table.batchId, table.containerId),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const containersRelations = relations(containers, ({ many }) => ({
  items: many(items),
  batchAccess: many(batchQbAccess),
}));

export const batchQbAccessRelations = relations(batchQbAccess, ({ one }) => ({
  batch: one(batches, {
    fields: [batchQbAccess.batchId],
    references: [batches.id],
  }),
  container: one(containers, {
    fields: [batchQbAccess.containerId],
    references: [containers.id],
  }),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  container: one(containers, {
    fields: [items.containerId],
    references: [containers.id],
  }),
  subitems: many(subitems),
}));

export const subitemsRelations = relations(subitems, ({ one, many }) => ({
  item: one(items, {
    fields: [subitems.itemId],
    references: [items.id],
  }),
  topics: many(topics),
  questions: many(questions),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subitem: one(subitems, {
    fields: [topics.subitemId],
    references: [subitems.id],
  }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  subitem: one(subitems, {
    fields: [questions.subitemId],
    references: [subitems.id],
  }),
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id],
  }),
  mcqOptions: many(mcqOptions),
  cqParts: many(cqParts),
  examQuestions: many(examQuestions),
}));

export const mcqOptionsRelations = relations(mcqOptions, ({ one }) => ({
  question: one(questions, {
    fields: [mcqOptions.questionId],
    references: [questions.id],
  }),
}));

export const cqPartsRelations = relations(cqParts, ({ one }) => ({
  question: one(questions, {
    fields: [cqParts.questionId],
    references: [questions.id],
  }),
}));

export const pollsRelations = relations(polls, ({ many }) => ({
  options: many(pollOptions),
  votes: many(pollVotes),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
  votes: many(pollVotes),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  details: one(batchDetails, {
    fields: [batches.id],
    references: [batchDetails.batchId],
  }),
  members: many(batchMembers),
  routines: many(examRoutines),
  batchExams: many(batchExams),
  enrollments: many(batchEnrollments),
  enrollmentRequests: many(batchEnrollmentRequests),
  classes: many(courseClasses),
  pdfs: many(coursePdfs),
  qbAccess: many(batchQbAccess),
}));

export const courseClassesRelations = relations(courseClasses, ({ one }) => ({
  batch: one(batches, {
    fields: [courseClasses.batchId],
    references: [batches.id],
  }),
}));

export const coursePdfsRelations = relations(coursePdfs, ({ one }) => ({
  batch: one(batches, {
    fields: [coursePdfs.batchId],
    references: [batches.id],
  }),
}));

export const batchDetailsRelations = relations(batchDetails, ({ one }) => ({
  batch: one(batches, {
    fields: [batchDetails.batchId],
    references: [batches.id],
  }),
}));

export const batchEnrollmentsRelations = relations(
  batchEnrollments,
  ({ one }) => ({
    user: one(user, {
      fields: [batchEnrollments.userId],
      references: [user.id],
    }),
    batch: one(batches, {
      fields: [batchEnrollments.batchId],
      references: [batches.id],
    }),
    request: one(batchEnrollmentRequests, {
      fields: [batchEnrollments.requestId],
      references: [batchEnrollmentRequests.id],
    }),
  }),
);

export const batchEnrollmentRequestsRelations = relations(
  batchEnrollmentRequests,
  ({ one }) => ({
    user: one(user, {
      fields: [batchEnrollmentRequests.userId],
      references: [user.id],
    }),
    batch: one(batches, {
      fields: [batchEnrollmentRequests.batchId],
      references: [batches.id],
    }),
    reviewer: one(user, {
      fields: [batchEnrollmentRequests.reviewedBy],
      references: [user.id],
    }),
  }),
);

export const batchMembersRelations = relations(batchMembers, ({ one }) => ({
  batch: one(batches, {
    fields: [batchMembers.batchId],
    references: [batches.id],
  }),
  user: one(user, {
    fields: [batchMembers.userId],
    references: [user.id],
  }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  creator: one(user, {
    fields: [exams.createdBy],
    references: [user.id],
  }),
  examQuestions: many(examQuestions),
  batchExams: many(batchExams),
  submissions: many(examSubmissions),
}));

export const batchExamsRelations = relations(batchExams, ({ one, many }) => ({
  batch: one(batches, {
    fields: [batchExams.batchId],
    references: [batches.id],
  }),
  exam: one(exams, {
    fields: [batchExams.examId],
    references: [exams.id],
  }),
  submissions: many(examSubmissions),
}));

export const examQuestionsRelations = relations(
  examQuestions,
  ({ one, many }) => ({
    exam: one(exams, {
      fields: [examQuestions.examId],
      references: [exams.id],
    }),
    question: one(questions, {
      fields: [examQuestions.questionId],
      references: [questions.id],
    }),
    responses: many(examResponses),
  }),
);

export const examSubmissionsRelations = relations(
  examSubmissions,
  ({ one, many }) => ({
    exam: one(exams, {
      fields: [examSubmissions.examId],
      references: [exams.id],
    }),
    batchExam: one(batchExams, {
      fields: [examSubmissions.batchExamId],
      references: [batchExams.id],
    }),
    user: one(user, {
      fields: [examSubmissions.userId],
      references: [user.id],
    }),
    responses: many(examResponses),
  }),
);

export const examResponsesRelations = relations(examResponses, ({ one }) => ({
  submission: one(examSubmissions, {
    fields: [examResponses.submissionId],
    references: [examSubmissions.id],
  }),
  examQuestion: one(examQuestions, {
    fields: [examResponses.examQuestionId],
    references: [examQuestions.id],
  }),
  selectedOption: one(mcqOptions, {
    fields: [examResponses.selectedOptionId],
    references: [mcqOptions.id],
  }),
}));

/* ---------------------------------------------------------------------------
 * The new question bank — every table is prefixed `new_`.
 *
 * This is a clean, self-contained set for questions uploaded from /qb. It does
 * not touch `containers`/`questions`/`mcq_options`: those still belong to the
 * archived bank and the exams built from it. A question here always has a
 * chapter; subject and topic are reached through it.
 * ------------------------------------------------------------------------- */

/** পদার্থবিজ্ঞান / বাংলা / ইংরেজি … */
export const newSubjects = pgTable(
  "new_subjects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    orderNo: integer("order_no").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("new_subject_slug_unique_idx").on(table.slug)],
);

/** An অধ্যায় inside a subject. */
export const newChapters = pgTable(
  "new_chapters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    subjectId: text("subject_id")
      .notNull()
      .references(() => newSubjects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    orderNo: integer("order_no").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("new_chapter_subject_slug_unique_idx").on(
      table.subjectId,
      table.slug,
    ),
    index("new_chapter_subject_idx").on(table.subjectId),
  ],
);

/** An optional টপিক inside a chapter. */
export const newTopics = pgTable(
  "new_topics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    chapterId: text("chapter_id")
      .notNull()
      .references(() => newChapters.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    orderNo: integer("order_no").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("new_topic_chapter_slug_unique_idx").on(
      table.chapterId,
      table.slug,
    ),
    index("new_topic_chapter_idx").on(table.chapterId),
  ],
);

/** One question — MCQ or CQ. */
export const newQuestions = pgTable(
  "new_questions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    chapterId: text("chapter_id")
      .notNull()
      .references(() => newChapters.id, { onDelete: "cascade" }),
    topicId: text("topic_id").references(() => newTopics.id, {
      onDelete: "set null",
    }),
    type: text("type", { enum: ["mcq", "cq"] }).notNull(),
    source: text("source").default("").notNull(),
    standard: text("standard", {
      enum: ["HSC", "Varsity", "Engineering", "Medical"],
    })
      .default("HSC")
      .notNull(),
    questionText: text("question_text").notNull(),
    /** Image URL shown under the stem. */
    questionImage: text("question_image"),
    explanation: text("explanation"),
    explanationImage: text("explanation_image"),
    isFree: boolean("is_free").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("new_question_chapter_idx").on(table.chapterId),
    index("new_question_topic_idx").on(table.topicId),
    index("new_question_created_idx").on(table.createdAt),
  ],
);

/** The options of one MCQ question. */
export const newMcqOptions = pgTable(
  "new_mcq_options",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    questionId: text("question_id")
      .notNull()
      .references(() => newQuestions.id, { onDelete: "cascade" }),
    optionText: text("option_text").notNull(),
    /** Image URL for this option. */
    image: text("image"),
    isCorrect: boolean("is_correct").default(false).notNull(),
    orderNo: integer("order_no").default(0).notNull(),
  },
  (table) => [index("new_option_question_idx").on(table.questionId)],
);

/** (ক) / (খ) / (গ) / (ঘ) of a CQ question. */
export const newCqParts = pgTable(
  "new_cq_parts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    questionId: text("question_id")
      .notNull()
      .references(() => newQuestions.id, { onDelete: "cascade" }),
    partKey: text("part_key").notNull(),
    questionText: text("question_text").notNull(),
    answerText: text("answer_text"),
    marks: integer("marks").default(1).notNull(),
    orderNo: integer("order_no").default(0).notNull(),
  },
  (table) => [index("new_cq_part_question_idx").on(table.questionId)],
);

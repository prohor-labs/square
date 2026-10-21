"use server";

import { getTableColumns, sql as rawSql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  containers,
  cqParts,
  examQuestions,
  items,
  mcqOptions,
  newChapters,
  newCqParts,
  newMcqOptions,
  newQuestions,
  newSubjects,
  newTopics,
  qbChapters,
  qbInstitutes,
  qbQuestionMeta,
  qbQuestionTopics,
  qbSubjects,
  qbTopics,
  questions,
  questionTags,
  subitems,
  tags,
  topics,
} from "@/db/schema";
import {
  buildBackupZip,
  parseBackupZip,
  QB_BACKUP_TABLES,
  type QbBackupManifest,
} from "@/lib/qb-backup";

/** What the upload screen shows before anything is written. */
export interface BackupPreview {
  readonly manifest: QbBackupManifest;
  readonly counts: readonly {
    readonly table: string;
    readonly label: string;
    readonly inFile: number;
    readonly inDatabase: number;
  }[];
  readonly unknownTables: readonly string[];
  readonly totalInDatabase: number;
}

export interface RestoreResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly written?: Readonly<Record<string, number>>;
  readonly durationMs?: number;
}

const LABELS: Readonly<Record<string, string>> = {
  containers: "প্রশ্নব্যাংক",
  items: "ইউনিট",
  subitems: "অধ্যায় / সাল",
  topics: "টপিক",
  questions: "প্রশ্ন",
  mcq_options: "অপশন",
  cq_parts: "প্রশ্নের অংশ",
  tags: "ট্যাগ",
  question_tags: "প্রশ্ন-ট্যাগ",
  qb_institutes: "প্রতিষ্ঠান",
  qb_subjects: "বিষয়",
  qb_chapters: "বিষয়ের অধ্যায়",
  qb_question_meta: "প্রশ্নের তথ্য",
  qb_topics: "টপিক (বিষয়ভিত্তিক)",
  qb_question_topics: "প্রশ্ন-টপিক",
  exam_questions: "পরীক্ষার প্রশ্ন",
  new_subjects: "নতুন বিষয়",
  new_chapters: "নতুন অধ্যায়",
  new_topics: "নতুন টপিক",
  new_questions: "নতুন প্রশ্ন",
  new_mcq_options: "নতুন অপশন",
  new_cq_parts: "নতুন প্রশ্নের অংশ",
};

/**
 * Bumped per row set so no single statement approaches Postgres' 65,535
 * parameter ceiling — 54,000 option rows in one insert would.
 */
const CHUNK = 400;

const TABLE_MAP: Readonly<Record<string, PgTable>> = {
  containers,
  items,
  subitems,
  topics,
  questions,
  mcq_options: mcqOptions,
  cq_parts: cqParts,
  tags,
  question_tags: questionTags,
  qb_institutes: qbInstitutes,
  qb_subjects: qbSubjects,
  qb_chapters: qbChapters,
  qb_question_meta: qbQuestionMeta,
  qb_topics: qbTopics,
  qb_question_topics: qbQuestionTopics,
  exam_questions: examQuestions,
  new_subjects: newSubjects,
  new_chapters: newChapters,
  new_topics: newTopics,
  new_questions: newQuestions,
  new_mcq_options: newMcqOptions,
  new_cq_parts: newCqParts,
};

async function countRows(table: string): Promise<number> {
  const rows = (await db.execute(
    rawSql`SELECT count(*)::int AS count FROM ${rawSql.identifier(table)}`,
  )) as unknown as { count: number }[];
  return Number(rows[0]?.count ?? 0);
}

/**
 * The dump stores columns in snake_case; drizzle wants the model's camelCase
 * keys. The column objects carry both, so the mapping is read off the schema
 * rather than kept as a second hand-written list.
 */
function toModelRows(
  table: PgTable,
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  const columns = getTableColumns(table) as Record<string, PgColumn>;

  return rows.map((row) => {
    const entry: Record<string, unknown> = {};
    for (const [key, column] of Object.entries(columns)) {
      const source = (column as { name?: string }).name ?? key;
      if (source in row) entry[key] = row[source];
    }
    return entry;
  });
}

/**
 * Reads the uploaded zip and compares it with the database.
 *
 * Nothing is written here — the point is to let an admin see exactly what a
 * restore would replace before committing to it.
 */
export async function inspectBackupAction(
  base64: string,
): Promise<BackupPreview> {
  const { manifest, tables, unknownTables } = parseBackupZip(base64);

  const counts: {
    table: string;
    label: string;
    inFile: number;
    inDatabase: number;
  }[] = [];
  let totalInDatabase = 0;

  for (const table of QB_BACKUP_TABLES) {
    const inFile = tables[table]?.length ?? 0;
    const inDatabase = await countRows(table);
    totalInDatabase += inDatabase;
    counts.push({ table, label: LABELS[table] ?? table, inFile, inDatabase });
  }

  return { manifest, counts, unknownTables, totalInDatabase };
}

/**
 * Writes the backup back, in one transaction.
 *
 * The bank is cleared first, children before parents, so a rebuild that reused
 * a slug under a new id cannot block the insert and no foreign key is left
 * pointing at a row that is about to disappear. Rows then go in parents first.
 *
 * Because the tables are empty by the time they are filled, there is nothing to
 * conflict against — which is what makes uploading the same file twice safe.
 */
export async function restoreBackupAction(
  base64: string,
): Promise<RestoreResult> {
  const started = Date.now();
  const written: Record<string, number> = {};

  try {
    const { tables } = parseBackupZip(base64);

    for (const table of QB_BACKUP_TABLES) {
      written[table] = tables[table]?.length ?? 0;
    }

    await db.transaction(async (tx) => {
      for (const table of [...QB_BACKUP_TABLES].reverse()) {
        await tx.execute(rawSql`DELETE FROM ${rawSql.identifier(table)}`);
      }

      for (const table of QB_BACKUP_TABLES) {
        const rows = tables[table];
        const target = TABLE_MAP[table];
        if (!rows?.length || !target) continue;

        const payload = toModelRows(target, rows);
        for (let i = 0; i < payload.length; i += CHUNK) {
          // Table name is only known at runtime, so the builder cannot be typed
          // per-table here; `payload` is built from the schema's own columns.
          await (
            tx as unknown as {
              insert: (t: PgTable) => {
                values: (v: unknown[]) => Promise<unknown>;
              };
            }
          )
            .insert(target)
            .values(payload.slice(i, i + CHUNK));
        }
      }
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "রিস্টোর করা যায়নি, কিছু একটা সমস্যা হয়েছে।",
    };
  }

  return { ok: true, written, durationMs: Date.now() - started };
}

/**
 * The current bank as a zip, for keeping a copy before making changes.
 *
 * Base64 rather than a written file: the download happens in the browser, so
 * the server has no business writing to the project's disk.
 */
export async function exportBackupAction(): Promise<
  { ok: true; base64: string; fileName: string } | { ok: false; error: string }
> {
  try {
    const files: Record<string, Uint8Array> = {};
    const counts: Record<string, number> = {};
    let totalRows = 0;

    for (const table of QB_BACKUP_TABLES) {
      const result = (await db.execute(
        rawSql`SELECT * FROM ${rawSql.identifier(table)}`,
      )) as unknown as { rows?: Record<string, unknown>[] };
      const rows = result.rows ?? [];
      counts[table] = rows.length;
      totalRows += rows.length;
      files[`${table}.json`] = Buffer.from(JSON.stringify(rows));
    }

    const manifest = {
      format: "square-qb-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      totalRows,
      tables: [...QB_BACKUP_TABLES],
      counts,
    };
    files["manifest.json"] = Buffer.from(JSON.stringify(manifest, null, 2));

    const zip = buildBackupZip(files);
    const stamp = new Date().toISOString().slice(0, 10);
    return {
      ok: true,
      base64: Buffer.from(zip).toString("base64"),
      fileName: `question-bank-${stamp}.zip`,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "ব্যাকআপ নেওয়া যায়নি, কিছু একটা সমস্যা হয়েছে।",
    };
  }
}

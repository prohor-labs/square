import { unzipSync, zipSync } from "fflate";

/**
 * The backup format, shared by the exporter script and the admin restore.
 *
 * One JSON file per table, plus a manifest naming the format version and the
 * row counts. Every row keeps its primary key, which is what lets the same file
 * be uploaded twice without duplicating anything: the restore upserts on that
 * key rather than inserting blindly.
 */
export const QB_BACKUP_FORMAT = "square-qb-backup";
export const QB_BACKUP_VERSION = 1;

export interface QbBackupManifest {
  readonly format: string;
  readonly version: number;
  readonly exportedAt: string;
  readonly totalRows: number;
  readonly tables: readonly string[];
  readonly counts: Readonly<Record<string, number>>;
}

/** Table order is the insert order — parents before children. */
export const QB_BACKUP_TABLES = [
  "containers",
  "items",
  "subitems",
  "topics",
  "questions",
  "mcq_options",
  "cq_parts",
  "tags",
  "question_tags",
  "qb_institutes",
  "qb_subjects",
  "qb_chapters",
  "qb_question_meta",
  "exam_questions",
] as const;

export type QbBackupTable = (typeof QB_BACKUP_TABLES)[number];

/** The primary key each table upserts on. */
export const QB_BACKUP_KEYS: Readonly<Record<string, string>> = {
  containers: "id",
  items: "id",
  subitems: "id",
  topics: "id",
  questions: "id",
  mcq_options: "id",
  cq_parts: "id",
  tags: "id",
  question_tags: "question_id",
  qb_institutes: "id",
  qb_subjects: "id",
  qb_chapters: "id",
  qb_question_meta: "question_id",
  exam_questions: "id",
};

/**
 * Tables with a unique slug, where a row rebuilt from scratch after the bank was
 * wiped would carry the same slug under a new id and block the insert.
 */
export const QB_BACKUP_SLUGGED = new Set([
  "containers",
  "items",
  "subitems",
  "topics",
  "qb_subjects",
  "qb_chapters",
  "qb_institutes",
]);

export interface ParsedBackup {
  readonly manifest: QbBackupManifest;
  /** Table rows, keyed by table name. Only the tables listed above are read. */
  readonly tables: Readonly<Record<string, Record<string, unknown>[]>>;
  /** Tables the file claims but that this build no longer knows about. */
  readonly unknownTables: readonly string[];
}

export class BackupFormatError extends Error {}

/** Reads a base64 zip into its manifest and tables. */
export function parseBackupZip(base64: string): ParsedBackup {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(Uint8Array.from(Buffer.from(base64, "base64")));
  } catch {
    throw new BackupFormatError("ফাইলটি zip নয়, বা নষ্ট হয়েছে।");
  }

  const manifestRaw = files["manifest.json"];
  if (!manifestRaw) {
    throw new BackupFormatError(
      "manifest.json নেই — এটি প্রশ্নব্যাংকের ব্যাকআপ ফাইল নয়।",
    );
  }

  const manifest = JSON.parse(
    Buffer.from(manifestRaw).toString("utf8"),
  ) as QbBackupManifest;

  if (manifest.format !== QB_BACKUP_FORMAT) {
    throw new BackupFormatError(
      `অজানা ফরম্যাট "${manifest.format}" — এই সাইটের ব্যাকআপ ফাইল নয়।`,
    );
  }
  if (manifest.version > QB_BACKUP_VERSION) {
    throw new BackupFormatError(
      `ফাইলটি নতুন ভার্সনের (v${manifest.version}) — সাইট আপডেট করুন।`,
    );
  }

  const tables: Record<string, Record<string, unknown>[]> = {};
  const unknown: string[] = [];

  for (const name of manifest.tables) {
    if (!QB_BACKUP_TABLES.includes(name as QbBackupTable)) {
      unknown.push(name);
      continue;
    }
    const raw = files[`${name}.json`];
    if (!raw) continue;
    const rows = JSON.parse(Buffer.from(raw).toString("utf8"));
    tables[name] = Array.isArray(rows) ? rows : [];
  }

  return { manifest, tables, unknownTables: unknown };
}

/** Builds a zip from already-serialised table JSON. Used by the download. */
export function buildBackupZip(files: Record<string, Uint8Array>): Uint8Array {
  return zipSync(files, { level: 9 });
}

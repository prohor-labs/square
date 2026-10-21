-- The new question bank.
--
-- Everything is prefixed `new_` so it can live next to the archived bank
-- (`containers` → `items` → `subitems` → `questions`) without touching it.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS new_subjects (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  order_no integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS new_subject_slug_unique_idx
  ON new_subjects (slug);

CREATE TABLE IF NOT EXISTS new_chapters (
  id text PRIMARY KEY,
  subject_id text NOT NULL REFERENCES new_subjects (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  order_no integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS new_chapter_subject_slug_unique_idx
  ON new_chapters (subject_id, slug);

CREATE INDEX IF NOT EXISTS new_chapter_subject_idx
  ON new_chapters (subject_id);

CREATE TABLE IF NOT EXISTS new_topics (
  id text PRIMARY KEY,
  chapter_id text NOT NULL REFERENCES new_chapters (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  order_no integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS new_topic_chapter_slug_unique_idx
  ON new_topics (chapter_id, slug);

CREATE INDEX IF NOT EXISTS new_topic_chapter_idx
  ON new_topics (chapter_id);

CREATE TABLE IF NOT EXISTS new_questions (
  id text PRIMARY KEY,
  chapter_id text NOT NULL REFERENCES new_chapters (id) ON DELETE CASCADE,
  topic_id text REFERENCES new_topics (id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('mcq', 'cq')),
  source text NOT NULL DEFAULT '',
  standard text NOT NULL DEFAULT 'HSC'
    CHECK (standard IN ('HSC', 'Varsity', 'Engineering', 'Medical')),
  question_text text NOT NULL,
  question_image text,
  explanation text,
  explanation_image text,
  is_free boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS new_question_chapter_idx
  ON new_questions (chapter_id);

CREATE INDEX IF NOT EXISTS new_question_topic_idx
  ON new_questions (topic_id);

CREATE INDEX IF NOT EXISTS new_question_created_idx
  ON new_questions (created_at);

CREATE TABLE IF NOT EXISTS new_mcq_options (
  id text PRIMARY KEY,
  question_id text NOT NULL REFERENCES new_questions (id) ON DELETE CASCADE,
  option_text text NOT NULL,
  image text,
  is_correct boolean NOT NULL DEFAULT false,
  order_no integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS new_option_question_idx
  ON new_mcq_options (question_id);

CREATE TABLE IF NOT EXISTS new_cq_parts (
  id text PRIMARY KEY,
  question_id text NOT NULL REFERENCES new_questions (id) ON DELETE CASCADE,
  part_key text NOT NULL,
  question_text text NOT NULL,
  answer_text text,
  marks integer NOT NULL DEFAULT 1,
  order_no integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS new_cq_part_question_idx
  ON new_cq_parts (question_id);

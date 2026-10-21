-- Uploaded files (question sets) for the new question bank.
--
-- A question can appear in more than one file, so the file -> question link is
-- a join table instead of a column on new_questions. Safe to run more than once.

CREATE TABLE IF NOT EXISTS new_question_sets (
  id text PRIMARY KEY,
  file_name text NOT NULL,
  original_file_name text NOT NULL DEFAULT '',
  university text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE new_question_sets
  ADD COLUMN IF NOT EXISTS original_file_name text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS new_question_set_shelf_idx
  ON new_question_sets (university, year, unit);

CREATE TABLE IF NOT EXISTS new_question_set_items (
  set_id text NOT NULL REFERENCES new_question_sets (id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES new_questions (id) ON DELETE CASCADE,
  order_no integer NOT NULL DEFAULT 0,
  PRIMARY KEY (set_id, question_id)
);

CREATE INDEX IF NOT EXISTS new_question_set_item_question_idx
  ON new_question_set_items (question_id);

-- Questions uploaded before file shelves existed are filed under one general
-- set, so students still see them. Rename/edit it from the admin screen.
INSERT INTO new_question_sets (id, file_name, original_file_name)
SELECT 'legacy-general', 'সাধারণ প্রশ্ন', ''
WHERE EXISTS (SELECT 1 FROM new_questions)
ON CONFLICT (id) DO NOTHING;

INSERT INTO new_question_set_items (set_id, question_id, order_no)
SELECT
  'legacy-general',
  q.id,
  (row_number() OVER (ORDER BY q.created_at, q.id) - 1)::int
FROM new_questions q
WHERE NOT EXISTS (
  SELECT 1
  FROM new_question_set_items i
  WHERE i.question_id = q.id
)
ON CONFLICT DO NOTHING;

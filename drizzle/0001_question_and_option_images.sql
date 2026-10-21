-- Image columns for a question bank row.
--
-- A question, each option and the explanation can each carry one image. The
-- column holds a URL; the file itself lives wherever it was uploaded (Supabase
-- Storage, an external host, …). Nothing is embedded in the text columns.
--
-- Applied by hand: this project keeps its schema in step with `drizzle-kit
-- push`, and the checked-in 0000 migration predates the qb_* tables, so it is
-- not part of the journal. Running this twice is harmless.

ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "question_image" text;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "explanation_image" text;
ALTER TABLE "mcq_options" ADD COLUMN IF NOT EXISTS "image" text;

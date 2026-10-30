-- Paper split for the new question bank's subjects.
--
-- A CSV row may name a paper (`paper_name`, e.g. "১ম পত্র"). Until now the
-- importer folded it into the subject name only when the subject was missing,
-- so the paper level the student browser needs was lost. The column is
-- additive and defaults to '' — every existing subject keeps its identity and
-- slug. Safe to run more than once.

ALTER TABLE new_subjects
  ADD COLUMN IF NOT EXISTS paper text NOT NULL DEFAULT '';

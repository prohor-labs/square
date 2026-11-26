-- Private Telegram invites stay outside public batch/detail rows.
-- Safe to run more than once, matching the hand-applied migration convention.

CREATE TABLE IF NOT EXISTS "batch_telegram_invites" (
  "batch_id" text PRIMARY KEY NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "batch_telegram_invites_batch_id_batches_id_fk"
    FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE cascade
);

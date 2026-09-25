ALTER TABLE "user_sessions"
  ADD COLUMN "previous_refresh_token_hash" TEXT,
  ADD COLUMN "previous_refresh_token_expires_at" TIMESTAMP(3),
  ADD COLUMN "revoked_at" TIMESTAMP(3);

CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

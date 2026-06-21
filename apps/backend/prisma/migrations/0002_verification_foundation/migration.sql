CREATE TYPE "VerificationStatus" AS ENUM (
  'PENDING',
  'VERIFIED',
  'FAILED',
  'ROLE_GRANT_PENDING',
  'ROLE_GRANT_FAILED'
);

CREATE TYPE "VerificationEventType" AS ENUM (
  'STARTED',
  'COMPLETED',
  'FAILED',
  'ROLE_GRANT_PENDING',
  'ROLE_GRANT_COMPLETED',
  'ROLE_GRANT_FAILED'
);

CREATE TYPE "RoleGrantJobStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED'
);

CREATE TABLE "verifications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "discord_user_id" TEXT NOT NULL,
  "guild_id" TEXT NOT NULL,
  "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "verified_at" TIMESTAMP(3),
  "failure_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_events" (
  "id" TEXT NOT NULL,
  "verification_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "VerificationEventType" NOT NULL,
  "status" "VerificationStatus" NOT NULL,
  "message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "verification_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_role_grant_jobs" (
  "id" TEXT NOT NULL,
  "verification_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "discord_user_id" TEXT NOT NULL,
  "guild_id" TEXT NOT NULL,
  "status" "RoleGrantJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "verification_role_grant_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "verifications_user_id_guild_id_key"
  ON "verifications"("user_id", "guild_id");

CREATE INDEX "verifications_discord_user_id_idx"
  ON "verifications"("discord_user_id");

CREATE INDEX "verifications_guild_id_idx"
  ON "verifications"("guild_id");

CREATE INDEX "verifications_status_idx"
  ON "verifications"("status");

CREATE INDEX "verification_events_created_at_idx"
  ON "verification_events"("created_at");

CREATE INDEX "verification_events_user_id_idx"
  ON "verification_events"("user_id");

CREATE INDEX "verification_events_verification_id_idx"
  ON "verification_events"("verification_id");

CREATE UNIQUE INDEX "verification_role_grant_jobs_verification_id_status_key"
  ON "verification_role_grant_jobs"("verification_id", "status");

CREATE INDEX "verification_role_grant_jobs_status_idx"
  ON "verification_role_grant_jobs"("status");

CREATE INDEX "verification_role_grant_jobs_user_id_idx"
  ON "verification_role_grant_jobs"("user_id");

ALTER TABLE "verifications"
  ADD CONSTRAINT "verifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "verification_events"
  ADD CONSTRAINT "verification_events_verification_id_fkey"
  FOREIGN KEY ("verification_id") REFERENCES "verifications"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "verification_events"
  ADD CONSTRAINT "verification_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "verification_role_grant_jobs"
  ADD CONSTRAINT "verification_role_grant_jobs_verification_id_fkey"
  FOREIGN KEY ("verification_id") REFERENCES "verifications"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "verification_role_grant_jobs"
  ADD CONSTRAINT "verification_role_grant_jobs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

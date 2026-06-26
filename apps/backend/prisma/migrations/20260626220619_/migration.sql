/*
  Warnings:

  - A unique constraint covering the columns `[discord_user_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFTING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReferralSource" AS ENUM ('REDDIT', 'FRIEND_INVITE', 'WEB_SEARCH', 'GITHUB', 'OTHER');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'STAFF');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "discord_user_id" TEXT,
ALTER COLUMN "clerk_user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "membership_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFTING',
    "display_name" TEXT NOT NULL,
    "github_handle" TEXT NOT NULL,
    "strongest_project" TEXT NOT NULL,
    "project_explanation" TEXT NOT NULL,
    "tech_stack" TEXT NOT NULL,
    "experience_level" "ExperienceLevel" NOT NULL,
    "purpose_of_joining" TEXT NOT NULL,
    "self_introduction" TEXT NOT NULL,
    "linked_in_url" TEXT,
    "portfolio_url" TEXT,
    "referral_source" "ReferralSource" NOT NULL,
    "referral_other_text" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_configs" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "unverified_role_id" TEXT NOT NULL,
    "verified_role_id" TEXT NOT NULL,
    "reviewer_role_id" TEXT NOT NULL,
    "verification_channel_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membership_applications_user_id_idx" ON "membership_applications"("user_id");

-- CreateIndex
CREATE INDEX "membership_applications_status_idx" ON "membership_applications"("status");

-- CreateIndex
CREATE INDEX "membership_applications_guild_id_idx" ON "membership_applications"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "guild_configs_guild_id_key" ON "guild_configs"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_discord_user_id_key" ON "users"("discord_user_id");

-- AddForeignKey
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

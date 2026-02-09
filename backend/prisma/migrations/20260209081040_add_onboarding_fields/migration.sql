-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('STUDENT', 'PROFESSIONAL', 'RECRUITER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userType" "UserType";

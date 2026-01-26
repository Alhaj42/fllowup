-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "modificationAllowedTimes" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "modificationDaysPerTime" INTEGER NOT NULL DEFAULT 5;

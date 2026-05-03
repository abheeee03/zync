-- AlterTable
ALTER TABLE "Workflows" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "name" SET DEFAULT 'Untitled';

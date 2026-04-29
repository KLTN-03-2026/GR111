-- AlterTable
ALTER TABLE "posts" ADD COLUMN "slug" TEXT;

-- Gán slug duy nhất theo từng bản ghi (đủ để @@unique([clubId, slug]))
UPDATE "posts" SET "slug" = 'p-' || REPLACE("id", '-', '') WHERE "slug" IS NULL;

ALTER TABLE "posts" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "posts_clubId_slug_key" ON "posts"("clubId", "slug");

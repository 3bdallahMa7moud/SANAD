ALTER TABLE "package_reviews"
ADD COLUMN "is_home_featured" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "idx_package_reviews_home_featured_status"
ON "package_reviews"("is_home_featured", "status");

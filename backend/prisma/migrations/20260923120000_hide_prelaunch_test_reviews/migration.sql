-- All reviews published before launch were explicitly identified as test
-- content. Hide them without deleting review records or rewriting history.
UPDATE "package_reviews"
SET "status" = 'hidden',
    "is_home_featured" = false,
    "updated_at" = CURRENT_TIMESTAMP
WHERE "status" = 'published';

-- Keep the CMS legal-page copy aligned with the three-day Job Application
-- Service period. This updates existing published page content only.
UPDATE "pages"
SET
  "content_en" = REPLACE("content_en", '30 calendar days', '3 calendar days'),
  "content_ar" = REPLACE("content_ar", '30 يومًا تقويميًا', '3 أيام تقويمية'),
  "updated_at" = CURRENT_TIMESTAMP
WHERE "slug" IN ('terms-and-conditions', 'privacy-policy')
  AND (
    "content_en" LIKE '%30 calendar days%'
    OR "content_ar" LIKE '%30 يومًا تقويميًا%'
  );

ALTER TABLE "offers"
  ADD COLUMN "original_price" DECIMAL(10,2),
  ADD COLUMN "sale_price" DECIMAL(10,2);

ALTER TABLE "offers"
  ADD CONSTRAINT "offers_sale_price_nonnegative_check"
  CHECK ("sale_price" IS NULL OR "sale_price" >= 0),
  ADD CONSTRAINT "offers_original_price_positive_check"
  CHECK ("original_price" IS NULL OR "original_price" > 0),
  ADD CONSTRAINT "offers_price_override_pair_check"
  CHECK (
    ("original_price" IS NULL AND "sale_price" IS NULL)
    OR ("original_price" IS NOT NULL AND "sale_price" IS NOT NULL)
  );

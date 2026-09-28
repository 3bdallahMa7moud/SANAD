-- Remove indexes that duplicate the indexes already created by UNIQUE
-- constraints. PostgreSQL uses the UNIQUE indexes for the same lookups.
DROP INDEX IF EXISTS "idx_users_email";
DROP INDEX IF EXISTS "idx_coupons_code";
DROP INDEX IF EXISTS "idx_orders_order_number";
DROP INDEX IF EXISTS "idx_payments_transaction_id";
DROP INDEX IF EXISTS "idx_site_media_media_key";
DROP INDEX IF EXISTS "idx_pages_slug";
DROP INDEX IF EXISTS "idx_email_templates_template_name";
DROP INDEX IF EXISTS "idx_user_sessions_session_token";
DROP INDEX IF EXISTS "idx_pwd_reset_token";
DROP INDEX IF EXISTS "idx_email_verification_token";

-- Match the compound predicates and ordering used by customer/admin order
-- lists, the email worker, active-session revocation, OTP consumption, and
-- payment reconciliation.
CREATE INDEX "idx_orders_user_created_at"
  ON "orders"("user_id", "created_at" DESC);
CREATE INDEX "idx_orders_status_created_at"
  ON "orders"("status", "created_at" DESC);
CREATE INDEX "idx_email_queue_dispatch"
  ON "email_queue"("status", "scheduled_at", "priority");
CREATE INDEX "idx_user_sessions_user_active"
  ON "user_sessions"("user_id", "is_active");
CREATE INDEX "idx_email_otp_active_recent"
  ON "email_otp_challenges"("email", "consumed_at", "created_at" DESC);
CREATE INDEX "idx_payments_order_status"
  ON "payments"("order_id", "status");

-- NOT VALID avoids rejecting a deployment because of legacy rows while still
-- enforcing the rules for every new or updated row. Existing data can be
-- audited and each constraint validated in a later maintenance window.
ALTER TABLE "packages"
  ADD CONSTRAINT "packages_price_nonnegative" CHECK ("price" >= 0) NOT VALID,
  ADD CONSTRAINT "packages_delivery_days_positive" CHECK ("delivery_days" > 0) NOT VALID;

ALTER TABLE "offers"
  ADD CONSTRAINT "offers_discount_percentage_range" CHECK ("discount_percentage" >= 0 AND "discount_percentage" <= 100) NOT VALID,
  ADD CONSTRAINT "offers_original_price_nonnegative" CHECK ("original_price" IS NULL OR "original_price" >= 0) NOT VALID,
  ADD CONSTRAINT "offers_sale_price_nonnegative" CHECK ("sale_price" IS NULL OR "sale_price" >= 0) NOT VALID;

ALTER TABLE "coupons"
  ADD CONSTRAINT "coupons_discount_value_positive" CHECK ("discount_value" > 0) NOT VALID,
  ADD CONSTRAINT "coupons_min_order_amount_nonnegative" CHECK ("min_order_amount" IS NULL OR "min_order_amount" >= 0) NOT VALID,
  ADD CONSTRAINT "coupons_max_discount_amount_nonnegative" CHECK ("max_discount_amount" IS NULL OR "max_discount_amount" >= 0) NOT VALID,
  ADD CONSTRAINT "coupons_usage_limit_positive" CHECK ("usage_limit" IS NULL OR "usage_limit" > 0) NOT VALID,
  ADD CONSTRAINT "coupons_usage_per_user_positive" CHECK ("usage_per_user" IS NULL OR "usage_per_user" > 0) NOT VALID,
  ADD CONSTRAINT "coupons_times_used_nonnegative" CHECK ("times_used" IS NULL OR "times_used" >= 0) NOT VALID;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_amounts_nonnegative" CHECK (
    "original_amount" >= 0 AND
    ("discount_amount" IS NULL OR "discount_amount" >= 0) AND
    ("secondary_original_amount" IS NULL OR "secondary_original_amount" >= 0) AND
    ("secondary_discount_amount" IS NULL OR "secondary_discount_amount" >= 0) AND
    "vat_amount" >= 0 AND
    "total_amount" >= 0 AND
    "final_amount" >= 0
  ) NOT VALID;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_nonnegative" CHECK ("amount" >= 0) NOT VALID;

ALTER TABLE "order_files"
  ADD CONSTRAINT "order_files_size_nonnegative" CHECK ("file_size" IS NULL OR "file_size" >= 0) NOT VALID;

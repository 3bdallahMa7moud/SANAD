CREATE INDEX IF NOT EXISTS "idx_notifications_admin_feed"
ON "notifications"("user_id", "notification_type", "is_read", "created_at");

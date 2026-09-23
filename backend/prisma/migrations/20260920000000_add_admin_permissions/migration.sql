-- Regular administrators can be limited to an explicit set of admin areas.
-- NULL is reserved for existing accounts so the migration never removes an
-- administrator's previously granted access. New accounts receive an explicit
-- array through the administrator-management API.
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "admin_permissions" JSONB;

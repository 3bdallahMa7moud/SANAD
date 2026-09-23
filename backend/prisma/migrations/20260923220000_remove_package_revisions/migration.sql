-- Revision allowances are no longer a package feature or customer-facing term.
ALTER TABLE "packages" DROP COLUMN "max_revisions";

#!/bin/sh
# Deploy SANAD to the existing native Node.js services managed by systemd.
# Backs up PostgreSQL before migrations and verifies both services afterward.
set -eu
umask 027

PROJECT_ROOT=${SANAD_PROJECT_ROOT:-/opt/SANAD}
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
RUNTIME_DIR=${SANAD_WEB_RUNTIME_DIR:-$PROJECT_ROOT/.native-runtime/web}
ENV_FILE=${SANAD_ENV_FILE:-/etc/sanad/sanad.env}
API_SERVICE=${SANAD_API_SERVICE:-sanad-api}
WEB_SERVICE=${SANAD_WEB_SERVICE:-sanad-web}
API_USER=${SANAD_API_USER:-sanad}
API_GROUP=${SANAD_API_GROUP:-sanad}
WEB_USER=${SANAD_WEB_USER:-sanad}
WEB_GROUP=${SANAD_WEB_GROUP:-sanad}
BACKUP_DIR=${SANAD_BACKUP_DIR:-/var/backups/sanad}
BACKUP_STAMP=$(date -u +%Y%m%dT%H%M%SZ)
SOURCE_BACKUP="$BACKUP_DIR/source-$BACKUP_STAMP.tar.gz"
WEB_BACKUP="$BACKUP_DIR/web-runtime-$BACKUP_STAMP.tar.gz"
READY_ATTEMPTS=${SANAD_DEPLOY_READY_ATTEMPTS:-60}
INSTALL_DEPENDENCIES=${INSTALL_DEPENDENCIES:-0}
API_STOPPED=0
WEB_STOPPED=0

restart_services_if_needed() {
  if [ "$API_STOPPED" = "1" ]; then systemctl start "$API_SERVICE" || true; fi
  if [ "$WEB_STOPPED" = "1" ]; then systemctl start "$WEB_SERVICE" || true; fi
}
trap restart_services_if_needed 0

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this deployment script with sudo or as root." >&2
  exit 1
fi
for required in "$BACKEND_DIR/package.json" "$FRONTEND_DIR/package.json" "$ENV_FILE"; do
  if [ ! -f "$required" ]; then
    echo "Required deployment file not found: $required" >&2
    exit 1
  fi
done
case "$RUNTIME_DIR" in
  "$PROJECT_ROOT"/.native-runtime/web) ;;
  *) echo "Refusing unsafe web runtime target: $RUNTIME_DIR" >&2; exit 1 ;;
esac

set -a
. "$ENV_FILE"
set +a
if [ -z "${POSTGRES_USER:-}" ] || [ -z "${POSTGRES_PASSWORD:-}" ] || [ -z "${POSTGRES_DB:-}" ]; then
  echo "POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB must be set in $ENV_FILE." >&2
  exit 1
fi
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
if [ -n "${SANAD_BUILD_NODE_OPTIONS:-}" ]; then
  export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }$SANAD_BUILD_NODE_OPTIONS"
fi

# Match the connection string construction used by deploy/native/start-api.sh.
export DATABASE_URL="$(node <<'NODE'
const url = new URL('postgresql://127.0.0.1:5432');
url.username = process.env.POSTGRES_USER;
url.password = process.env.POSTGRES_PASSWORD;
url.pathname = `/${process.env.POSTGRES_DB}`;
url.searchParams.set('schema', 'public');
url.searchParams.set('connection_limit', '10');
url.searchParams.set('pool_timeout', '20');
process.stdout.write(url.toString());
NODE
)"

echo "This will build and restart the native Node.js API and web services."
echo "It will back up the database before running Prisma migrations."
echo "No Admin/CMS edits will be performed."
printf 'Continue with deployment? [y/N] '
read answer
case "$answer" in
  y|Y|yes|YES) ;;
  *) echo "Deployment cancelled."; exit 0 ;;
esac

install -d -m 0700 "$BACKUP_DIR"
echo "Creating source backup at $SOURCE_BACKUP..."
tar -czf "$SOURCE_BACKUP" -C "$PROJECT_ROOT" \
  --exclude='./.git' \
  --exclude='./.native-runtime' \
  --exclude='./.migration-backups' \
  --exclude='./.npm-cache' \
  --exclude='./.work' \
  --exclude='./frontend/node_modules' \
  --exclude='./frontend/.next' \
  --exclude='./backend/node_modules' \
  --exclude='./backend/dist' \
  --exclude='./backend/dist.before-*' \
  --exclude='./.env' \
  --exclude='./.env.production' \
  --exclude='./backend/.env' \
  --exclude='./backend/.env.production' \
  --exclude='./frontend/.env' \
  --exclude='./frontend/.env.production' \
  .

if [ "$INSTALL_DEPENDENCIES" = "1" ]; then
  # Builds need CLI and tooling packages that are normally devDependencies.
  # NODE_ENV remains production for the resulting processes and artifacts.
  echo "Installing backend build dependencies..."
  (cd "$BACKEND_DIR" && npm ci --include=dev)
  echo "Installing frontend build dependencies..."
  (cd "$FRONTEND_DIR" && npm ci --include=dev)
fi

# The API service runs as $API_USER. npm ci is run as root by this deployment
# script, so hand the backend runtime dependencies back to the service user.
chown -R "$API_USER:$API_GROUP" "$BACKEND_DIR/node_modules"

echo "Building backend..."
(cd "$BACKEND_DIR" && npm run build && NODE_ENV=production npm run preflight)
chown -R "$API_USER:$API_GROUP" "$BACKEND_DIR/dist"
echo "Building frontend..."
(cd "$FRONTEND_DIR" && npm run build)
if [ ! -f "$FRONTEND_DIR/.next/standalone/server.js" ]; then
  echo "Next.js standalone build output is missing." >&2
  exit 1
fi

# Keep the existing live services up while the release is built and backed up.
install -d -m 0700 "$BACKUP_DIR"
export BACKUP_DIR
echo "Creating database backup..."
(cd "$BACKEND_DIR" && node scripts/db-backup.cjs)

if [ -d "$RUNTIME_DIR" ]; then
  echo "Creating current web runtime backup at $WEB_BACKUP..."
  tar -czf "$WEB_BACKUP" -C "$RUNTIME_DIR" .
fi

echo "Stopping web and API services..."
systemctl stop "$WEB_SERVICE"
WEB_STOPPED=1
systemctl stop "$API_SERVICE"
API_STOPPED=1

echo "Applying database migrations..."
(cd "$BACKEND_DIR" && ./node_modules/.bin/prisma migrate deploy)

install -d -m 0750 "$RUNTIME_DIR/.next"
rsync -a --delete -- "$FRONTEND_DIR/.next/standalone/" "$RUNTIME_DIR/"
rsync -a --delete -- "$FRONTEND_DIR/.next/static/" "$RUNTIME_DIR/.next/static/"
rsync -a --delete -- "$FRONTEND_DIR/public/" "$RUNTIME_DIR/public/"
chown -R "$WEB_USER:$WEB_GROUP" "$RUNTIME_DIR"

# API startup runs migrate deploy too; it is safe after the explicit migration.
echo "Starting API service..."
systemctl start "$API_SERVICE"
API_STOPPED=0
systemctl is-active --quiet "$API_SERVICE"
API_PORT=${SANAD_API_PORT:-3001}
ATTEMPT=1
while ! curl --fail --silent "http://127.0.0.1:$API_PORT/api/v1/health/ready" >/dev/null; do
  if [ "$ATTEMPT" -ge "$READY_ATTEMPTS" ]; then
    systemctl status "$API_SERVICE" --no-pager || true
    journalctl -u "$API_SERVICE" -n 100 --no-pager || true
    echo "API did not become ready after $READY_ATTEMPTS attempts." >&2
    exit 1
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 1
done

echo "Starting web service..."
systemctl start "$WEB_SERVICE"
WEB_STOPPED=0
systemctl is-active --quiet "$WEB_SERVICE"
WEB_PORT=${SANAD_WEB_PORT:-3000}
ATTEMPT=1
while ! curl --fail --silent "http://127.0.0.1:$WEB_PORT/" >/dev/null; do
  if [ "$ATTEMPT" -ge "$READY_ATTEMPTS" ]; then
    systemctl status "$WEB_SERVICE" --no-pager || true
    journalctl -u "$WEB_SERVICE" -n 100 --no-pager || true
    echo "Web service did not become ready after $READY_ATTEMPTS attempts." >&2
    exit 1
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 1
done

systemctl --no-pager --full status "$API_SERVICE" "$WEB_SERVICE" || true
echo "Native Node.js deployment completed successfully."

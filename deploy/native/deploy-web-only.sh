#!/bin/sh
# Deploy the current frontend source to the native Node.js web service only.
# It never rebuilds or restarts the API, database, or Nginx.
set -eu
umask 027

PROJECT_ROOT=${SANAD_PROJECT_ROOT:-/opt/SANAD}
FRONTEND_DIR="$PROJECT_ROOT/frontend"
RUNTIME_DIR=${SANAD_WEB_RUNTIME_DIR:-$PROJECT_ROOT/.native-runtime/web}
ENV_FILE=${SANAD_ENV_FILE:-/etc/sanad/sanad.env}
SERVICE_NAME=${SANAD_WEB_SERVICE:-sanad-web}
WEB_USER=${SANAD_WEB_USER:-sanad}
WEB_GROUP=${SANAD_WEB_GROUP:-sanad}
BACKUP_DIR=${SANAD_BACKUP_DIR:-/var/backups/sanad}
BACKUP_STAMP=$(date -u +%Y%m%dT%H%M%SZ)
SOURCE_BACKUP="$BACKUP_DIR/source-$BACKUP_STAMP.tar.gz"
WEB_BACKUP="$BACKUP_DIR/web-runtime-$BACKUP_STAMP.tar.gz"
SERVICE_STOPPED=0

restart_service_if_needed() {
  if [ "$SERVICE_STOPPED" = "1" ]; then
    echo "Deployment did not finish; attempting to restore $SERVICE_NAME..." >&2
    systemctl start "$SERVICE_NAME" || true
  fi
}

trap restart_service_if_needed 0

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this deployment script with sudo or as root." >&2
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ] || [ ! -f "$FRONTEND_DIR/package.json" ]; then
  echo "Frontend directory was not found: $FRONTEND_DIR" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Production environment file was not found: $ENV_FILE" >&2
  exit 1
fi

# Deployment targets are intentionally limited to the native web runtime.
case "$RUNTIME_DIR" in
  "$PROJECT_ROOT"/.native-runtime/web) ;;
  *)
    echo "Refusing an unsafe runtime target: $RUNTIME_DIR" >&2
    exit 1
    ;;
esac

set -a
. "$ENV_FILE"
set +a
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Next.js may need a larger V8 heap while compiling and type-checking. Keep
# the default untouched, but allow the server operator to opt in safely, e.g.
# SANAD_BUILD_NODE_OPTIONS='--max-old-space-size=3072'.
if [ -n "${SANAD_BUILD_NODE_OPTIONS:-}" ]; then
  export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }$SANAD_BUILD_NODE_OPTIONS"
fi

cd "$FRONTEND_DIR"

# Dependencies are unchanged for this UI-only release. Set
# INSTALL_DEPENDENCIES=1 when package.json or package-lock.json changed.
if [ "${INSTALL_DEPENDENCIES:-0}" = "1" ]; then
  # Keep build tooling available even though the runtime uses NODE_ENV=production.
  npm ci --include=dev
fi

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

echo "Building the frontend..."
npm run build

if [ ! -f "$FRONTEND_DIR/.next/standalone/server.js" ]; then
  echo "Next.js standalone build output is missing." >&2
  exit 1
fi

if [ -d "$RUNTIME_DIR" ]; then
  echo "Creating current web runtime backup at $WEB_BACKUP..."
  tar -czf "$WEB_BACKUP" -C "$RUNTIME_DIR" .
fi

echo "Stopping $SERVICE_NAME..."
systemctl stop "$SERVICE_NAME"
SERVICE_STOPPED=1

mkdir -p "$RUNTIME_DIR/.next"

# Next.js does not copy these two directories into standalone output.
rsync -a --delete -- "$FRONTEND_DIR/.next/standalone/" "$RUNTIME_DIR/"
rsync -a --delete -- "$FRONTEND_DIR/.next/static/" "$RUNTIME_DIR/.next/static/"
rsync -a --delete -- "$FRONTEND_DIR/public/" "$RUNTIME_DIR/public/"
chown -R "$WEB_USER:$WEB_GROUP" "$RUNTIME_DIR"

echo "Starting $SERVICE_NAME..."
systemctl start "$SERVICE_NAME"
SERVICE_STOPPED=0
systemctl is-active --quiet "$SERVICE_NAME"

WEB_PORT=${SANAD_WEB_PORT:-3000}
READY_ATTEMPTS=${SANAD_WEB_READY_ATTEMPTS:-60}
ATTEMPT=1

echo "Waiting for the frontend to become ready..."
while ! curl --fail --silent "http://127.0.0.1:$WEB_PORT/" >/dev/null; do
  if [ "$ATTEMPT" -ge "$READY_ATTEMPTS" ]; then
    echo "The frontend did not become ready after $READY_ATTEMPTS seconds." >&2
    systemctl status "$SERVICE_NAME" --no-pager || true
    exit 1
  fi

  ATTEMPT=$((ATTEMPT + 1))
  sleep 1
done

echo "Frontend deployment completed successfully."

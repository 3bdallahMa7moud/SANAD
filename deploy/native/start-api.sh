#!/bin/sh
set -eu

set -a
. /etc/sanad/sanad.env
set +a

export NODE_ENV=production
export PORT="${SANAD_API_PORT:-3001}"
export BACKUP_DIR=/var/backups/sanad

# Build the connection string at runtime so the database password is not
# duplicated in a systemd unit or committed deployment file.
DATABASE_URL="$({
  node <<'NODE'
const url = new URL('postgresql://127.0.0.1:5432');
url.username = process.env.POSTGRES_USER;
url.password = process.env.POSTGRES_PASSWORD;
url.pathname = `/${process.env.POSTGRES_DB}`;
url.searchParams.set('schema', 'public');
url.searchParams.set('connection_limit', '10');
url.searchParams.set('pool_timeout', '20');
process.stdout.write(url.toString());
NODE
})"
export DATABASE_URL

cd /opt/SANAD/backend
node scripts/preflight.cjs
./node_modules/.bin/prisma migrate deploy
exec node dist/main

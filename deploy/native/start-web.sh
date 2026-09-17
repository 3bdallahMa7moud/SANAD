#!/bin/sh
set -eu

set -a
. /etc/sanad/sanad.env
set +a

export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export HOSTNAME=127.0.0.1
export PORT="${SANAD_WEB_PORT:-3000}"

cd /opt/SANAD/.native-runtime/web
exec node server.js

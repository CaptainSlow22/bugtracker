#!/bin/sh
set -eu

BACKEND_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="$BACKEND_DIR/.env.test"

if [ ! -f "$ENV_FILE" ]; then
    echo "Missing $ENV_FILE. Copy .env.test.example to .env.test and configure a dedicated test database." >&2
    exit 1
fi

cd "$BACKEND_DIR"
export DOTENV_CONFIG_PATH="$ENV_FILE"
export RUN_API_INTEGRATION_TESTS=true
node scripts/setup-test-db.js
node --test --test-concurrency=1 tests/api.test.js

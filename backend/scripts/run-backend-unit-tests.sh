#!/bin/sh
set -eu

BACKEND_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$BACKEND_DIR"
node --test --test-concurrency=1 tests/validation.test.js

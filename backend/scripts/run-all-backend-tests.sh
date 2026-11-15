#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
"$SCRIPT_DIR/run-backend-unit-tests.sh"
"$SCRIPT_DIR/run-backend-ai-tests.sh"
"$SCRIPT_DIR/run-api-integration-tests.sh"

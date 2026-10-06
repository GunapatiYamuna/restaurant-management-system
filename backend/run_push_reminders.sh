#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
VENV_PYTHON="$PROJECT_DIR/.venv/bin/python"

if [ ! -x "$VENV_PYTHON" ]; then
    echo "Virtual environment Python not found: $VENV_PYTHON" >&2
    exit 1
fi

cd "$SCRIPT_DIR"

run_once() {
    "$VENV_PYTHON" manage.py send_reservation_push_reminders
}

if [ "${1:-}" = "--watch" ]; then
    echo "FoodieHub reservation reminder watcher started (checking every 30 seconds)."
    while true; do
        run_once
        sleep 30
    done
fi

exec "$VENV_PYTHON" manage.py send_reservation_push_reminders

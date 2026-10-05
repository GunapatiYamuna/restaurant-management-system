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
exec "$VENV_PYTHON" manage.py send_reservation_push_reminders

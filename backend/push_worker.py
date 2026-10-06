import os
import time

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from django.core.management import call_command
from django.db import close_old_connections


if __name__ == "__main__":
    print("FoodieHub reservation push worker started.", flush=True)
    while True:
        try:
            # The worker stays alive for days, while Railway/MySQL can recycle
            # idle connections. Close stale connections before each run so
            # Django opens a fresh MySQL connection when necessary.
            close_old_connections()
            call_command("send_reservation_push_reminders", verbosity=1)
        except Exception as exc:
            print(f"Reservation push worker error: {exc}", flush=True)
            # Drop any broken DB connection so the next 30-second iteration
            # can establish a fresh one instead of reusing a dead socket.
            close_old_connections()
        finally:
            time.sleep(30)

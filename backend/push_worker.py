import os
import time

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from django.core.management import call_command


if __name__ == "__main__":
    print("FoodieHub reservation push worker started.", flush=True)
    while True:
        try:
            call_command("send_reservation_push_reminders", verbosity=1)
        except Exception as exc:
            print(f"Reservation push worker error: {exc}", flush=True)
        time.sleep(30)

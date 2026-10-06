import threading
import time

from django.db import connection
from django.core.management import call_command


_LOCK_NAME = "foodiehub_reservation_push_scheduler"
_STARTED = False


def start_reservation_push_scheduler():
    global _STARTED
    if _STARTED:
        return
    _STARTED = True

    thread = threading.Thread(
        target=_run,
        name="foodiehub-reservation-push",
        daemon=True,
    )
    thread.start()


def _run():
    from django.db import connections

    # Small delay so Django finishes startup before the worker touches the DB.
    time.sleep(2)

    while True:
        try:
            conn = connections["default"]
            conn.ensure_connection()

            with conn.cursor() as cursor:
                cursor.execute("SELECT GET_LOCK(%s, 0)", [_LOCK_NAME])
                acquired = cursor.fetchone()[0]

            if acquired == 1:
                try:
                    while True:
                        call_command(
                            "send_reservation_push_reminders",
                            verbosity=0,
                        )
                        time.sleep(30)
                finally:
                    try:
                        with conn.cursor() as cursor:
                            cursor.execute("SELECT RELEASE_LOCK(%s)", [_LOCK_NAME])
                    except Exception:
                        pass
                    try:
                        conn.close()
                    except Exception:
                        pass
            else:
                time.sleep(30)

        except Exception as exc:
            # The scheduler must never take down the web application.
            print(f"FoodieHub reservation push scheduler: {exc}", flush=True)
            try:
                connections["default"].close()
            except Exception:
                pass
            time.sleep(30)

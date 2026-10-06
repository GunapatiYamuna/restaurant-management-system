import threading
import time

from django.apps import AppConfig


class RestaurantConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "restaurant"

    def ready(self):
        # Start one reminder worker for the running web application. A MySQL
        # advisory lock prevents duplicate workers when Django has multiple
        # processes/threads or the development autoreloader is active.
        import sys

        if any(command in sys.argv for command in (
            "makemigrations",
            "migrate",
            "shell",
            "dbshell",
            "test",
            "collectstatic",
            "generate_vapid_keys",
            "send_reservation_push_reminders",
        )):
            return

        from .push_scheduler import start_reservation_push_scheduler

        start_reservation_push_scheduler()

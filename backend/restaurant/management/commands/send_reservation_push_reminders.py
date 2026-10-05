from datetime import datetime, timedelta

import json

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.signing import TimestampSigner
from pywebpush import webpush, WebPushException

from restaurant.models import PushSubscription, Reservation


class Command(BaseCommand):
    help = "Send browser push reminders one hour before reservations."

    def handle(self, *args, **options):
        if not settings.VAPID_PRIVATE_KEY_FILE or not settings.VAPID_PUBLIC_KEY:
            self.stdout.write(self.style.WARNING("VAPID keys are not configured; no push reminders sent."))
            return

        now = timezone.now()
        window_end = now + timedelta(hours=1)

        reservations = (
            Reservation.objects
            .filter(
                attendance_response="pending",
                attendance_notified_at__isnull=True,
                status__in=["pending", "confirmed"],
                date=now.astimezone(timezone.get_current_timezone()).date(),
            )
            .select_related("restaurant", "user")
        )

        sent = 0
        for reservation in reservations:
            start = timezone.make_aware(
                datetime.combine(reservation.date, reservation.time),
                timezone.get_current_timezone(),
            )
            if not (now <= start <= window_end):
                continue

            subscriptions = PushSubscription.objects.filter(user=reservation.user)
            token = TimestampSigner(salt="foodiehub-reservation-attendance").sign(
                f"{reservation.id}:{reservation.user_id}"
            )
            base = f"/api/reservations/attendance/{reservation.id}/{token}"
            payload = {
                "title": "FoodieHub reservation reminder",
                "body": (
                    f"Your reservation at {reservation.restaurant.name} is "
                    f"scheduled for {start.strftime('%I:%M %p')}. Are you coming?"
                ),
                "coming_url": f"{base}/coming/",
                "not_coming_url": f"{base}/not-coming/",
                "url": "/login/pages/reservations.html",
            }

            delivered = False
            for subscription in subscriptions:
                try:
                    webpush(
                        subscription_info={
                            "endpoint": subscription.endpoint,
                            "keys": {
                                "p256dh": subscription.p256dh,
                                "auth": subscription.auth,
                            },
                        },
                        data=json.dumps(payload),
                        vapid_private_key=settings.VAPID_PRIVATE_KEY_FILE,
                        vapid_claims={"sub": settings.VAPID_CLAIMS_EMAIL},
                    )
                    delivered = True
                except WebPushException as exc:
                    status = getattr(getattr(exc, "response", None), "status_code", None)
                    if status in (404, 410):
                        subscription.delete()

            if delivered:
                reservation.attendance_notified_at = now
                reservation.save(update_fields=["attendance_notified_at"])
                sent += 1

        self.stdout.write(self.style.SUCCESS(f"Sent {sent} reservation push reminder(s)."))

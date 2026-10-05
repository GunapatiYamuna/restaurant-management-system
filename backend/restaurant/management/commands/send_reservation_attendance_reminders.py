from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from restaurant.models import Reservation
from restaurant.views import _reservation_start, _send_reservation_attendance_sms


class Command(BaseCommand):
    help = "Send SMS attendance reminders for reservations that are one hour away."

    def handle(self, *args, **options):
        now = timezone.now()
        candidates = (
            Reservation.objects
            .filter(
                attendance_response="pending",
                attendance_notified_at__isnull=True,
                status__in=["pending", "confirmed"],
            )
            .select_related("restaurant", "user__profile")
            .order_by("date", "time", "id")
        )

        sent = 0
        skipped = 0
        failed = 0

        for candidate in candidates:
            reservation_start = _reservation_start(candidate)

            if not (reservation_start - timedelta(hours=1) <= now < reservation_start):
                continue

            with transaction.atomic():
                reservation = (
                    Reservation.objects
                    .select_for_update()
                    .select_related("restaurant", "user__profile")
                    .filter(
                        pk=candidate.pk,
                        attendance_response="pending",
                        attendance_notified_at__isnull=True,
                        status__in=["pending", "confirmed"],
                    )
                    .first()
                )

                if not reservation:
                    skipped += 1
                    continue

                try:
                    phone = _send_reservation_attendance_sms(reservation)
                    reservation.attendance_notified_at = timezone.now()
                    reservation.save(update_fields=["attendance_notified_at"])
                    sent += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Sent attendance reminder for reservation #{reservation.id} to {phone}."
                        )
                    )
                except Exception as exc:
                    failed += 1
                    self.stderr.write(
                        self.style.ERROR(
                            f"Could not send reminder for reservation #{reservation.id}: {exc}"
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"Attendance reminder run complete: {sent} sent, {skipped} skipped, {failed} failed."
            )
        )

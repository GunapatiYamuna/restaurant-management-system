from datetime import datetime, timedelta

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.db import transaction
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.utils.html import escape
from django.views.decorators.http import require_GET

from .models import Reservation


SIGNER_SALT = "foodiehub-reservation-attendance"
ATTENDANCE_LINK_MAX_AGE = 172800
REMINDER_WINDOW = timedelta(hours=1)


def _reservation_start(reservation):
    naive = datetime.combine(reservation.date, reservation.time)
    return timezone.make_aware(naive, timezone.get_current_timezone())


def _attendance_token(reservation):
    signer = TimestampSigner(salt=SIGNER_SALT)
    return signer.sign(f"{reservation.id}:{reservation.user_id}")


def _attendance_urls(reservation):
    token = _attendance_token(reservation)
    prefix = f"/api/reservations/attendance/{reservation.id}/{token}"
    return {
        "coming_url": f"{prefix}/coming/",
        "not_coming_url": f"{prefix}/not-coming/",
    }


@require_GET
def reservation_attendance_notifications(request):
    """
    Free in-site attendance reminders.

    The customer page polls this endpoint. Reservations that start within
    the next hour are returned once and marked as notified when the
    notification is delivered to the browser.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Login required."}, status=401)

    now = timezone.now()
    window_end = now + REMINDER_WINDOW

    reservations = (
        Reservation.objects
        .filter(
            user=request.user,
            attendance_response="pending",
            attendance_notified_at__isnull=True,
            status__in=["pending", "confirmed"],
        )
        .select_related("restaurant")
        .order_by("date", "time", "id")
    )

    notifications = []
    with transaction.atomic():
        for reservation in reservations:
            start = _reservation_start(reservation)
            if not (now <= start <= window_end):
                continue

            reservation.attendance_notified_at = now
            reservation.save(update_fields=["attendance_notified_at"])

            minutes_until = max(0, int((start - now).total_seconds() // 60))
            notifications.append({
                "id": reservation.id,
                "restaurant": reservation.restaurant.name,
                "date": reservation.date.isoformat(),
                "time": reservation.time.strftime("%H:%M"),
                "guests": reservation.guests,
                "minutes_until": minutes_until,
                **_attendance_urls(reservation),
            })

    return JsonResponse({"success": True, "notifications": notifications})


@require_GET
def reservation_attendance_response(request, reservation_id, token, response):
    if response not in ("coming", "not-coming"):
        return JsonResponse({"success": False, "message": "Invalid attendance response."}, status=400)

    reservation = (
        Reservation.objects
        .select_related("restaurant")
        .filter(pk=reservation_id)
        .first()
    )
    if not reservation:
        return JsonResponse({"success": False, "message": "Reservation not found."}, status=404)

    signer = TimestampSigner(salt=SIGNER_SALT)
    try:
        signed_value = signer.unsign(token, max_age=ATTENDANCE_LINK_MAX_AGE)
    except SignatureExpired:
        return _attendance_page(
            "Attendance response expired",
            "This attendance response link has expired. Please check My Reservations.",
            "Expired",
        )
    except BadSignature:
        return _attendance_page(
            "Invalid attendance link",
            "This attendance response link is not valid.",
            "Invalid",
        )

    if signed_value != f"{reservation.id}:{reservation.user_id}":
        return _attendance_page(
            "Invalid attendance link",
            "This attendance response link is not valid for this reservation.",
            "Invalid",
        )

    now = timezone.now()
    reservation_start = _reservation_start(reservation)

    if now > reservation_start:
        return _attendance_page(
            "Attendance response received",
            f"Reservation #{reservation.id} at {reservation.restaurant.name} has already reached its scheduled time.",
            reservation.status,
        )

    if reservation.status == "cancelled":
        return _attendance_page(
            "Reservation cancelled",
            "This reservation was already cancelled and cannot be confirmed.",
            "Cancelled",
        )

    if reservation.attendance_response != "pending":
        label = "Confirmed" if reservation.attendance_response == "coming" else "Cancelled"
        return _attendance_page(
            "Attendance already recorded",
            f"Your attendance response for reservation #{reservation.id} is already recorded.",
            label,
        )

    if response == "coming":
        reservation.attendance_response = "coming"
        reservation.status = "confirmed"
        heading = "Reservation confirmed"
        message = f"Thank you. Your reservation #{reservation.id} at {reservation.restaurant.name} is confirmed."
        status_label = "Confirmed"
    else:
        reservation.attendance_response = "not_coming"
        reservation.status = "cancelled"
        heading = "Reservation cancelled"
        message = f"Your reservation #{reservation.id} at {reservation.restaurant.name} has been cancelled."
        status_label = "Cancelled"

    reservation.attendance_responded_at = now
    reservation.save(update_fields=["attendance_response", "status", "attendance_responded_at"])

    return _attendance_page(heading, message, status_label)


def _attendance_page(title, message, status_label):
    safe_title = escape(title)
    safe_message = escape(message)
    safe_status = escape(status_label)

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>FoodieHub - {safe_title}</title>
<style>
body{{margin:0;font-family:Arial,sans-serif;background:#f7f7f8;display:grid;place-items:center;min-height:100vh;color:#222}}
.card{{width:min(92%,460px);background:#fff;border-radius:18px;padding:32px;box-shadow:0 12px 35px rgba(0,0,0,.1);text-align:center}}
h1{{margin:0 0 12px}} p{{color:#666;line-height:1.55}}
.status{{display:inline-block;margin-top:10px;padding:9px 16px;border-radius:999px;background:#fff1e8;color:#e85c00;font-weight:700}}
</style>
</head>
<body>
<main class="card">
<h1>{safe_title}</h1>
<p>{safe_message}</p>
<div class="status">{safe_status}</div>
<p>You can close this page and return to FoodieHub.</p>
</main>
</body>
</html>"""
    return HttpResponse(html)

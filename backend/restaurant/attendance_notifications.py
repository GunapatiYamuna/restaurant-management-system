from datetime import datetime

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.http import HttpResponse
from django.utils import timezone
from django.utils.html import escape
from django.views.decorators.http import require_GET

from .models import Reservation


SIGNER_SALT = "foodiehub-reservation-attendance"
ATTENDANCE_LINK_MAX_AGE = 172800


def _reservation_start(reservation):
    naive = datetime.combine(reservation.date, reservation.time)
    return timezone.make_aware(naive, timezone.get_current_timezone())


@require_GET
def reservation_attendance_response(request, reservation_id, token, response):
    reservation = (
        Reservation.objects
        .select_related("restaurant")
        .filter(pk=reservation_id)
        .first()
    )
    if not reservation:
        return _attendance_page("Reservation not found", "This reservation could not be found.", "Not found")

    signer = TimestampSigner(salt=SIGNER_SALT)
    try:
        signed_value = signer.unsign(token, max_age=ATTENDANCE_LINK_MAX_AGE)
    except SignatureExpired:
        return _attendance_page("Attendance response expired", "This response link has expired. Please check My Reservations.", "Expired")
    except BadSignature:
        return _attendance_page("Invalid attendance link", "This attendance response link is not valid.", "Invalid")

    if signed_value != f"{reservation.id}:{reservation.user_id}":
        return _attendance_page("Invalid attendance link", "This link is not valid for this reservation.", "Invalid")

    now = timezone.now()
    if now > _reservation_start(reservation):
        return _attendance_page("Attendance response received", "The reservation time has already passed.", reservation.status)

    if reservation.status == "cancelled":
        return _attendance_page("Reservation cancelled", "This reservation was already cancelled.", "Cancelled")

    if reservation.attendance_response != "pending":
        label = "Confirmed" if reservation.attendance_response == "coming" else "Cancelled"
        return _attendance_page("Attendance already recorded", "Your response has already been recorded.", label)

    if response == "coming":
        reservation.attendance_response = "coming"
        reservation.status = "confirmed"
        title = "Reservation confirmed"
        message = f"Your reservation #{reservation.id} at {reservation.restaurant.name} is confirmed."
        label = "Confirmed"
    elif response == "not-coming":
        reservation.attendance_response = "not_coming"
        reservation.status = "cancelled"
        title = "Reservation cancelled"
        message = f"Your reservation #{reservation.id} at {reservation.restaurant.name} has been cancelled."
        label = "Cancelled"
    else:
        return _attendance_page("Invalid response", "Please use the notification buttons.", "Invalid")

    reservation.attendance_responded_at = now
    reservation.save(update_fields=["attendance_response", "status", "attendance_responded_at"])
    return _attendance_page(
        title,
        message,
        label,
        reservation=reservation,
        payment_action="remaining" if response == "coming" else "refund" if response == "not-coming" else None,
    )


def _attendance_page(title, message, status_label, reservation=None, payment_action=None):
    action_html = ""
    if reservation and payment_action == "remaining":
        action_html = '<div class="actions"><a class="action" href="/login/pages/reservations.html">Pay Remaining Food Amount</a></div>'
    elif reservation and payment_action == "refund":
        action_html = f'''
<p><strong>Choose what you want to do with your 50% food payment:</strong></p>
<div class="refund-options">
<div class="refund-option recommended">
<span class="badge">RECOMMENDED</span>
<h3>FoodieHub Coupon</h3>
<p>Get the full paid amount as a coupon and use it on your next FoodieHub order.</p>
<strong>Valid for 2 weeks</strong>
<button onclick="refund('coupon')">Get 2-Week Coupon</button>
</div>
<div class="refund-option">
<h3>Refund to UPI</h3>
<p>Half of your paid amount will be refunded to your UPI account.</p>
<strong>Refund reference will be generated</strong>
<button class="secondary" onclick="refund('upi')">Refund to UPI</button>
</div>
</div>
<div id="result"></div>
<script>
async function refund(type) {{
  const result = document.getElementById("result");
  result.textContent = "Processing...";
  try {{
    const response = await fetch("/api/reservations/{reservation.id}/refund/", {{
      method: "POST",
      credentials: "same-origin",
      headers: {{"Content-Type": "application/json"}},
      body: JSON.stringify({{refund_type: type}})
    }});
    const data = await response.json().catch(() => ({{}}));
    if (!response.ok || !data.success) throw new Error(data.message || "Unable to process refund.");
    result.innerHTML = '<div class="success"><strong>' + (type === "upi" ? 'Refund initiated' : 'Coupon issued successfully') + '</strong><br>' + data.message + '<br><small>Reference: ' + data.reference + '</small></div><div class="actions"><a class="action" href="/login/index.html">Back to FoodieHub</a></div>';
    document.querySelectorAll(".refund-option button").forEach(button => button.disabled = true);
  }} catch (error) {{
    result.textContent = error.message;
  }}
}}
</script>
'''

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>FoodieHub - {escape(title)}</title>
<style>
body{{margin:0;font-family:Arial,sans-serif;background:#f7f7f8;display:grid;place-items:center;min-height:100vh;color:#222}}
.card{{width:min(92%,460px);background:#fff;border-radius:18px;padding:32px;box-shadow:0 12px 35px rgba(0,0,0,.1);text-align:center}}
h1{{margin:0 0 12px}} p{{color:#666;line-height:1.55}}
.status{{display:inline-block;margin-top:10px;padding:9px 16px;border-radius:999px;background:#fff1e8;color:#e85c00;font-weight:700}}
.actions{{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:22px}}
.refund-options{{display:grid;gap:12px;margin-top:20px;text-align:left}}
.refund-option{{border:2px solid #ddd;border-radius:16px;padding:18px}}
.refund-option.recommended{{border-color:#ff6b00;background:#fff8f2}}
.refund-option h3{{margin:8px 0}}
.refund-option p{{margin:6px 0}}
.badge{{display:inline-block;background:#ff6b00;color:white;border-radius:999px;padding:4px 8px;font-size:11px;font-weight:700}}
.success{{margin-top:14px;padding:14px;border-radius:12px;background:#eefaf2;color:#087b35}}

button,.action{{border:0;border-radius:10px;padding:11px 16px;background:#ff6b00;color:white;font-weight:700;cursor:pointer;text-decoration:none}}
button.secondary{{background:#333}}
#result{{margin-top:14px;font-weight:600}}
</style>
</head>
<body><main class="card"><h1>{escape(title)}</h1><p>{escape(message)}</p><div class="status">{escape(status_label)}</div>{action_html}<p>You can close this page and return to FoodieHub.</p></main></body>
</html>"""
    return HttpResponse(html)

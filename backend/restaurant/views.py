import json
import re
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta
from pathlib import Path
from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from django.utils.html import escape
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction, models
from django.http import JsonResponse, Http404, FileResponse, HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from .models import Profile, Restaurant, MenuItem, Reservation, ReservationItem, ReservationPayment, ReservationCoupon, InventoryItem, Order, OrderItem, DeliveryPartner, DeliveryAssignment, ContactMessage
from .attendance_notifications import reservation_attendance_response
from .push_notifications import push_public_key, push_subscribe, push_unsubscribe


FRONTEND = settings.PROJECT_ROOT / "frontend"

def _reservation_start(reservation):
    naive = datetime.combine(reservation.date, reservation.time)
    return timezone.make_aware(naive, timezone.get_current_timezone())


def _razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return None
    try:
        import razorpay
    except ImportError:
        return None
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _validate_order_items(items):
    if not isinstance(items, list) or not items:
        raise ValueError("Your cart is empty.")
    validated = []
    subtotal = Decimal("0.00")
    for item in items:
        try:
            qty = max(1, int(item.get("quantity", 1)))
        except (TypeError, ValueError):
            raise ValueError("Invalid item quantity.")
        menu_item = None
        item_id = item.get("id")
        if item_id not in (None, ""):
            menu_item = MenuItem.objects.filter(pk=item_id, available=True).first()
            if menu_item is None:
                raise ValueError("One of the selected menu items is unavailable.")
            price = menu_item.price
        else:
            try:
                price = Decimal(str(item.get("price", "0")))
            except Exception:
                raise ValueError("Invalid item price.")
            if price < 0:
                raise ValueError("Invalid item price.")
        name = str(item.get("name", "Item")).strip() or "Item"
        subtotal += price * qty
        validated.append((menu_item, name, price, qty))
    return validated, subtotal


def _checkout_totals(subtotal, coupon_discount=Decimal("0.00")):
    delivery = Decimal("50.00") if subtotal > 0 else Decimal("0.00")
    discount = max(Decimal("0.00"), min(coupon_discount, subtotal))
    gst = (subtotal * Decimal("0.05")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    total = max(Decimal("0.00"), subtotal + delivery - discount + gst)
    return delivery, discount, gst, total


def _coupon_code(data):
    return str(data.get("coupon_code", "")).strip().upper()


def _get_available_coupon_for_user(user, code, lock=False):
    if not code:
        return None
    queryset = ReservationCoupon.objects.filter(
        user=user,
        code=code,
        used=False,
        redeemed_order__isnull=True,
        reserved_order__isnull=True,
        expires_at__gt=timezone.now(),
    )
    if lock:
        queryset = queryset.select_for_update()
    return queryset.first()


def _coupon_error(user, code, lock=False):
    if not code:
        return None
    coupon = _get_available_coupon_for_user(user, code, lock=lock)
    if not coupon:
        return "This coupon is invalid, expired, already used, or currently being used in another checkout."
    return None



def frontend_page(request, path=""):
    clean = path.strip("/") or "index.html"
    if clean.startswith(("api/", "admin/", "static/")):
        raise Http404
    target = (FRONTEND / clean).resolve()
    if FRONTEND.resolve() not in target.parents and target != FRONTEND.resolve():
        raise Http404
    if target.is_file() and target.suffix.lower() == ".html":
        return render(request, clean)
    if target.is_file():
        return asset_file(request, clean)
    raise Http404

def asset_file(request, path):
    target = (FRONTEND / path).resolve()
    if FRONTEND.resolve() not in target.parents or not target.is_file():
        raise Http404
    return FileResponse(open(target, "rb"))

def _data(request):
    if request.content_type == "application/json":
        try: return json.loads(request.body or "{}")
        except json.JSONDecodeError: return {}
    return request.POST

def _user_payload(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    role = "admin" if user.is_staff else ("restaurant" if hasattr(user, "owned_restaurant") else ("delivery" if hasattr(user, "delivery_partner") else "user"))
    return {"id": user.id, "name": user.first_name or user.username, "email": user.email,
            "phone": profile.phone, "city": profile.city, "role": role}

def _validate_password(password, user=None):
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter."
    if not re.search(r"\d", password):
        return "Password must contain at least one number."
    if not re.search(r"[^A-Za-z0-9]", password):
        return "Password must contain at least one special character."
    try:
        validate_password(password, user=user)
    except ValidationError as error:
        return " ".join(error.messages)
    return None

def _restaurant_owner(request):
    if not request.user.is_authenticated:
        return None, JsonResponse({"success": False, "message": "Please login first."}, status=401)
    restaurant = getattr(request.user, "owned_restaurant", None)
    if not restaurant:
        return None, JsonResponse({"success": False, "message": "Restaurant account is not linked to a restaurant."}, status=403)
    return restaurant, None

def _restaurant_payload(r):
    return {"id": r.id, "name": r.name, "cuisine": r.cuisine, "rating": float(r.rating), "reviews": r.reviews,
            "price": r.price, "location": r.location, "description": r.description, "image": r.image}

@csrf_exempt
@require_POST
def submit_contact_message(request):
    data = _data(request)

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()
    subject = str(data.get("subject", "")).strip()
    message = str(data.get("message", "")).strip()

    if not name or not email or not subject or not message:
        return JsonResponse({
            "success": False,
            "message": "Name, email, subject and message are required."
        }, status=400)

    if not re.fullmatch(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        return JsonResponse({
            "success": False,
            "message": "Please enter a valid email address."
        }, status=400)

    contact = ContactMessage.objects.create(
        name=name,
        email=email,
        phone=phone,
        subject=subject,
        message=message,
    )

    return JsonResponse({
        "success": True,
        "message": "Your message has been sent successfully. Our team will get back to you soon.",
        "id": contact.id,
    })


@require_GET
def admin_contact_messages(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({
            "success": False,
            "message": "Administrator access required."
        }, status=403)

    messages = ContactMessage.objects.all()
    return JsonResponse({
        "success": True,
        "messages": [
            {
                "id": item.id,
                "name": item.name,
                "email": item.email,
                "phone": item.phone,
                "subject": item.subject,
                "message": item.message,
                "status": item.status,
                "created_at": item.created_at.isoformat(),
                "read_at": item.read_at.isoformat() if item.read_at else None,
            }
            for item in messages
        ]
    })


@csrf_exempt
@require_POST
def admin_mark_contact_message_read(request, message_id):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({
            "success": False,
            "message": "Administrator access required."
        }, status=403)

    contact = ContactMessage.objects.filter(pk=message_id).first()
    if not contact:
        return JsonResponse({
            "success": False,
            "message": "Message not found."
        }, status=404)

    contact.status = ContactMessage.STATUS_READ
    contact.read_at = timezone.now()
    contact.save(update_fields=["status", "read_at"])

    return JsonResponse({
        "success": True,
        "message": "Message marked as read."
    })


@csrf_exempt
@require_POST
def register_user(request):
    data = _data(request)
    name, email, phone, password = [str(data.get(k, "")).strip() for k in ("name", "email", "phone", "password")]
    if not all((name, email, phone, password)):
        return JsonResponse({"success": False, "message": "All fields are required."}, status=400)
    if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
        return JsonResponse({"success": False, "message": "An account with this email already exists."}, status=400)
    password_error = _validate_password(password)
    if password_error:
        return JsonResponse({"success": False, "message": password_error}, status=400)
    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    Profile.objects.create(user=user, phone=phone)
    return JsonResponse({"success": True, "message": "Account created successfully.", "user": _user_payload(user)})

@csrf_exempt
@require_POST
def admin_register(request):
    data = _data(request)
    name, email, phone, password = [str(data.get(k, "")).strip() for k in ("name", "email", "phone", "password")]
    if not all((name, email, phone, password)):
        return JsonResponse({"success": False, "message": "All fields are required."}, status=400)
    if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
        return JsonResponse({"success": False, "message": "An account with this email already exists."}, status=400)
    password_error = _validate_password(password)
    if password_error:
        return JsonResponse({"success": False, "message": password_error}, status=400)
    user = User.objects.create_user(username=email, email=email, password=password, first_name=name, is_staff=True)
    Profile.objects.create(user=user, phone=phone)
    return JsonResponse({"success": True, "message": "Administrator account created successfully.", "user": _user_payload(user)})


@csrf_exempt
@require_POST
def login_user(request):
    logout(request)
    data = _data(request)
    email, password = str(data.get("email", "")).strip().lower(), str(data.get("password", ""))
    try: user = User.objects.get(email=email)
    except User.DoesNotExist: user = None
    auth_user = authenticate(request, username=user.username if user else email, password=password)
    if not auth_user:
        return JsonResponse({"success": False, "message": "Invalid email or password."}, status=401)
    login(request, auth_user)
    return JsonResponse({"success": True, "message": "Login successful.", "user": _user_payload(auth_user)})

@csrf_exempt
@require_POST
def admin_login(request):
    logout(request)
    data = _data(request)
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        user = None
    auth_user = authenticate(request, username=user.username if user else email, password=password)
    if not auth_user or not auth_user.is_staff:
        return JsonResponse({"success": False, "message": "Invalid administrator credentials."}, status=401)
    login(request, auth_user)
    return JsonResponse({"success": True, "message": "Admin login successful.", "user": _user_payload(auth_user)})

@csrf_exempt
@require_POST
def logout_user(request):
    logout(request)
    return JsonResponse({"success": True})

@require_GET
def current_user(request):
    if not request.user.is_authenticated:
        response = JsonResponse({"authenticated": False})
    else:
        response = JsonResponse({"authenticated": True, "user": _user_payload(request.user)})
    response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response["Pragma"] = "no-cache"
    response["Expires"] = "0"
    return response

@csrf_exempt
@require_POST
def update_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Login required."}, status=401)
    data = _data(request)
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()
    city = str(data.get("city", "")).strip()

    if not name or not email or not re.fullmatch(r"[0-9]{10}", phone):
        return JsonResponse({"success": False, "message": "Enter a valid name, email and 10-digit phone number."}, status=400)

    if User.objects.filter(email__iexact=email).exclude(pk=request.user.pk).exists():
        return JsonResponse({"success": False, "message": "That email is already used by another account."}, status=409)

    user = request.user
    user.first_name = name
    user.email = email
    user.username = email
    user.save(update_fields=["first_name", "email", "username"])

    profile, _ = Profile.objects.get_or_create(user=user)
    profile.phone = phone
    profile.city = city
    profile.save(update_fields=["phone", "city"])

    delivery_partner = getattr(user, "delivery_partner", None)
    if delivery_partner:
        delivery_partner.phone = phone
        delivery_partner.save(update_fields=["phone"])

    return JsonResponse({"success": True, "message": "Profile updated successfully.", "user": _user_payload(user)})


@csrf_exempt
@require_POST
def change_password(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Login required."}, status=401)

    data = _data(request)
    current_password = str(data.get("current_password", ""))
    new_password = str(data.get("new_password", ""))
    confirm_password = str(data.get("confirm_password", ""))

    if not current_password or not new_password or not confirm_password:
        return JsonResponse({"success": False, "message": "Current password, new password and confirmation are required."}, status=400)

    if not request.user.check_password(current_password):
        return JsonResponse({"success": False, "message": "Current password is incorrect."}, status=400)

    if new_password != confirm_password:
        return JsonResponse({"success": False, "message": "New passwords do not match."}, status=400)

    password_error = _validate_password(new_password, user=request.user)
    if password_error:
        return JsonResponse({"success": False, "message": password_error}, status=400)

    request.user.set_password(new_password)
    request.user.save(update_fields=["password"])
    from django.contrib.auth import update_session_auth_hash
    update_session_auth_hash(request, request.user)

    return JsonResponse({"success": True, "message": "Password changed successfully."})


@require_GET
def restaurants(request):
    rows = Restaurant.objects.all().values("id", "name", "cuisine", "rating", "reviews", "price", "location", "description", "image")
    return JsonResponse({"success": True, "restaurants": list(rows)})

@require_GET
def menu_items(request):
    rows = MenuItem.objects.filter(available=True).select_related("restaurant").values(
        "id", "restaurant_id", "restaurant__name", "name", "category", "description", "price", "image"
    )
    items = []
    for row in rows:
        items.append({
            "id": row["id"],
            "restaurant_id": row["restaurant_id"],
            "restaurant_name": row["restaurant__name"],
            "name": row["name"],
            "category": row["category"],
            "description": row["description"],
            "price": float(row["price"]),
            "image": row["image"],
        })
    return JsonResponse({"success": True, "items": items})

@require_GET
def restaurant_detail(request, restaurant_id):
    try: r = Restaurant.objects.get(pk=restaurant_id)
    except Restaurant.DoesNotExist: return JsonResponse({"success": False, "message": "Restaurant not found."}, status=404)
    items = list(r.menu_items.filter(available=True).values("id", "name", "category", "description", "price", "image"))
    return JsonResponse({"success": True, "restaurant": {"id": r.id, "name": r.name, "cuisine": r.cuisine, "rating": float(r.rating), "reviews": r.reviews, "price": r.price, "location": r.location, "description": r.description, "image": r.image, "menu": items}})

@csrf_exempt
@require_POST
def create_reservation(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Please login to reserve a table."}, status=401)
    data = _data(request)
    required = ("restaurant_id", "name", "email", "phone", "date", "time", "guests")
    if any(not str(data.get(k, "")).strip() for k in required):
        return JsonResponse({"success": False, "message": "All reservation fields are required."}, status=400)

    try:
        restaurant_id = int(data["restaurant_id"])
        guests = int(data["guests"])
    except (TypeError, ValueError):
        return JsonResponse({"success": False, "message": "Invalid reservation data."}, status=400)
    if guests < 1:
        return JsonResponse({"success": False, "message": "Guests must be at least 1."}, status=400)

    items = data.get("items", [])
    if isinstance(items, str):
        try:
            items = json.loads(items)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "message": "Invalid pre-booked items."}, status=400)
    if not isinstance(items, list):
        return JsonResponse({"success": False, "message": "Invalid pre-booked items."}, status=400)

    try:
        restaurant = Restaurant.objects.get(pk=restaurant_id)
    except Restaurant.DoesNotExist:
        return JsonResponse({"success": False, "message": "Restaurant not found."}, status=404)

    validated_items = []
    total = Decimal("0.00")
    for item in items:
        try:
            menu_id = int(item.get("id"))
            qty = int(item.get("quantity", 1))
        except (TypeError, ValueError):
            return JsonResponse({"success": False, "message": "Invalid pre-booked item."}, status=400)
        if qty < 1:
            return JsonResponse({"success": False, "message": "Invalid pre-booked item quantity."}, status=400)
        menu_item = MenuItem.objects.filter(pk=menu_id, restaurant=restaurant, available=True).first()
        if not menu_item:
            return JsonResponse({"success": False, "message": "One of the selected menu items is unavailable."}, status=400)
        price = menu_item.price
        validated_items.append((menu_item, qty, price))
        total += price * qty

    if total > 0 and str(data.get("payment_method", "")).strip() != "UPI":
        return JsonResponse({"success": False, "message": "UPI is required for pre-booked food payment."}, status=400)

    coupon_code = _coupon_code(data)
    upfront_transaction_id = str(data.get("upfront_transaction_id", "")).strip()

    with transaction.atomic():
        coupon = _get_available_coupon_for_user(request.user, coupon_code, lock=True) if coupon_code else None
        if coupon_code and not coupon:
            return JsonResponse({"success": False, "message": "This coupon is invalid, expired, already used, or currently being used in another checkout."}, status=400)

        coupon_discount = min(coupon.amount, total) if coupon else Decimal("0.00")
        discounted_total = max(Decimal("0.00"), total - coupon_discount)
        upfront = (discounted_total / Decimal("2")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        remaining = discounted_total - upfront

        if discounted_total > 0 and not upfront_transaction_id:
            return JsonResponse({"success": False, "message": "Please complete the UPI payment before confirming the reservation."}, status=400)

        reservation = Reservation.objects.create(
            user=request.user,
            restaurant=restaurant,
            name=str(data["name"]).strip(),
            email=str(data["email"]).strip(),
            phone=str(data["phone"]).strip(),
            date=data["date"],
            time=data["time"],
            guests=guests,
            message=str(data.get("message", "")).strip(),
        )

        saved_items = []
        for menu_item, qty, price in validated_items:
            ReservationItem.objects.create(
                reservation=reservation,
                menu_item=menu_item,
                name=menu_item.name,
                price=price,
                quantity=qty,
            )
            saved_items.append({"name": menu_item.name, "price": float(price), "quantity": qty})

        if total > 0:
            ReservationPayment.objects.create(
                reservation=reservation,
                food_total=discounted_total,
                coupon_discount=coupon_discount,
                upfront_amount=upfront,
                remaining_amount=remaining,
                payment_method="UPI",
                upfront_status="paid" if upfront > 0 else "not_required",
                upfront_transaction_id=upfront_transaction_id,
                paid_at=timezone.now() if upfront > 0 else None,
            )
        if coupon:
            coupon.used = True
            coupon.redeemed_at = timezone.now()
            coupon.save(update_fields=["used", "redeemed_at"])

    return JsonResponse({
        "success": True,
        "reservation_id": reservation.id,
        "restaurant": restaurant.name,
        "items": saved_items,
        "prebook_total": float(discounted_total),
        "original_prebook_total": float(total),
        "coupon_discount": float(coupon_discount),
        "coupon_code": coupon.code if coupon else None,
        "upfront_amount": float(upfront),
        "remaining_amount": float(remaining),
        "payment_method": "UPI" if total > 0 else None,
        "message": "Table reserved successfully."
    })


@require_GET
def reservation_attendance_response(request, reservation_id, token, response):
    if response not in ("coming", "not-coming"):
        return JsonResponse({"success": False, "message": "Invalid attendance response."}, status=400)

    reservation = Reservation.objects.select_related("restaurant", "user__profile").filter(pk=reservation_id).first()
    if not reservation:
        return JsonResponse({"success": False, "message": "Reservation not found."}, status=404)

    signer = TimestampSigner(salt="foodiehub-reservation-attendance")
    try:
        signed_value = signer.unsign(token, max_age=172800)
    except SignatureExpired:
        return JsonResponse({"success": False, "message": "This attendance link has expired."}, status=410)
    except BadSignature:
        return JsonResponse({"success": False, "message": "This attendance link is invalid."}, status=400)

    if signed_value != f"{reservation.id}:{reservation.user_id}":
        return JsonResponse({"success": False, "message": "This attendance link is not valid for this reservation."}, status=403)

    now = timezone.now()
    reservation_start = _reservation_start(reservation)
    if now > reservation_start:
        return _reservation_attendance_page(
            reservation.id,
            "Attendance response received",
            f"Reservation #{reservation.id} at {reservation.restaurant.name} has already reached its scheduled time.",
            reservation.status,
        )

    if reservation.status == "cancelled":
        if reservation.attendance_response == "not_coming":
            return _reservation_attendance_page(
                reservation.id,
                "Reservation cancelled",
                f"Your reservation #{reservation.id} at {reservation.restaurant.name} has been cancelled. Please choose what you want to do with the 50% food payment already paid.",
                "Cancelled",
                True,
            )
        return _reservation_attendance_page(
            reservation.id,
            "Reservation cancelled",
            "This reservation was already cancelled and cannot be confirmed.",
            "Cancelled",
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

    return _reservation_attendance_page(reservation.id, heading, message, status_label, response == "not-coming")


def _reservation_attendance_page(reservation_id, title, message, status_label, show_refund_choices=False):
    safe_title = escape(title)
    safe_message = escape(message)
    safe_status = escape(status_label)
    refund_html = ""
    if show_refund_choices:
        refund_html = f"""
        <section class="refund-box">
          <h2>Your 50% Food Payment</h2>
          <p class="refund-intro">Since you chose <strong>Not Coming</strong>, you can receive the 50% you already paid back. Please choose one option below.</p>
          <div class="refund-options">
            <button class="refund-option recommended" data-refund="coupon" type="button">
              <span class="badge">RECOMMENDED</span>
              <span class="option-title">FoodieHub Coupon</span>
              <span class="option-text">Get the full paid amount as a coupon and use it on your next FoodieHub order.</span>
              <span class="option-valid">Valid for 2 weeks</span>
            </button>
            <button class="refund-option" data-refund="upi" type="button">
              <span class="option-title">Refund to UPI</span>
              <span class="option-text">Receive the full paid amount as a simulated refund to your UPI account.</span>
              <span class="option-valid">Refund reference will be generated</span>
            </button>
          </div>
          <div id="refundError" class="refund-error"></div>
          <div id="refundResult" class="refund-result"></div>
        </section>
        <script>
        (() => {{
          const buttons = document.querySelectorAll('.refund-option');
          const error = document.getElementById('refundError');
          const result = document.getElementById('refundResult');
          buttons.forEach(button => button.addEventListener('click', async () => {{
            const type = button.dataset.refund;
            buttons.forEach(b => b.disabled = true);
            error.textContent = '';
            result.className = 'refund-result';
            result.innerHTML = '<span class="spinner"></span> Processing your choice...';
            try {{
              const response = await fetch('/api/reservations/{reservation_id}/refund/', {{
                method: 'POST',
                credentials: 'same-origin',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{refund_type: type}})
              }});
              const data = await response.json().catch(() => ({{}}));
              if (!response.ok || !data.success) throw new Error(data.message || 'Unable to process your choice.');
              result.className = 'refund-result success';
              if (data.refund_type === 'coupon') {{
                result.innerHTML = '<strong>Coupon issued successfully</strong><br>Use coupon <span class="code">' + String(data.coupon_code || '') + '</span> for ₹' + Number(data.refund_amount || 0).toFixed(2) + '.<br><small>Valid for 2 weeks.</small>'; 
              }} else {{
                result.innerHTML = '<strong>Refund initiated</strong><br>' + String(data.message || 'Refund initiated to your UPI account.') + '.<br><small>Reference: ' + String(data.reference || '') + '</small>';
              }}
              buttons.forEach(b => b.style.display = 'none');
            }} catch (e) {{
              result.innerHTML = '';
              error.textContent = e.message || 'Unable to process your choice.';
              buttons.forEach(b => b.disabled = false);
            }}
          }}));
        }})();
        </script>
        """
    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FoodieHub - {safe_title}</title>
<style>
body{{margin:0;font-family:Arial,sans-serif;background:#f7f7f8;display:grid;place-items:center;min-height:100vh;color:#222;padding:24px;box-sizing:border-box}}
.card{{width:min(92%,560px);background:#fff;border-radius:18px;padding:32px;box-shadow:0 12px 35px rgba(0,0,0,.1);text-align:center;box-sizing:border-box}}
h1{{margin:0 0 12px}} p{{color:#666;line-height:1.55}} .status{{display:inline-block;margin-top:10px;padding:9px 16px;border-radius:999px;background:#fff1e8;color:#e85c00;font-weight:700}}
.refund-box{{margin-top:26px;text-align:left;border-top:1px solid #eee;padding-top:24px}} .refund-box h2{{text-align:center;margin:0 0 8px;font-size:22px}} .refund-intro{{text-align:center;margin-bottom:18px}}
.refund-options{{display:grid;gap:12px}} .refund-option{{position:relative;width:100%;padding:18px;text-align:left;border:2px solid #e2e2e2;border-radius:14px;background:#fff;cursor:pointer;box-sizing:border-box}} .refund-option:hover{{border-color:#ff6b00;background:#fffaf6}} .refund-option.recommended{{border-color:#ff6b00;background:#fff8f1}} .refund-option:disabled{{opacity:.6;cursor:wait}}
.badge{{display:inline-block;background:#ff6b00;color:#fff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:20px;margin-bottom:8px}} .option-title{{display:block;font-size:17px;font-weight:700;color:#222;margin-bottom:5px}} .option-text{{display:block;color:#666;font-size:14px;line-height:1.45}} .option-valid{{display:block;color:#e85c00;font-size:13px;font-weight:700;margin-top:8px}}
.refund-error{{color:#b42318;text-align:center;margin-top:12px}} .refund-result{{margin-top:14px;padding:15px;border-radius:12px;background:#f6f6f6;text-align:center;line-height:1.6}} .refund-result.success{{background:#eefaf2;color:#166534}} .code{{font-weight:700;font-size:18px}} .spinner{{display:inline-block;width:13px;height:13px;border:2px solid #ccc;border-top-color:#ff6b00;border-radius:50%;animation:spin .7s linear infinite;margin-right:6px}} @keyframes spin{{to{{transform:rotate(360deg)}}}}
.close-note{{font-size:13px;color:#888;margin-top:20px}}
</style></head><body><main class="card"><h1>{safe_title}</h1><p>{safe_message}</p><div class="status">{safe_status}</div>{refund_html}<p class="close-note">You can close this page after choosing your refund option.</p></main></body></html>"""
    return HttpResponse(html)



@csrf_exempt
@require_POST
def create_order(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Please login to place an order."}, status=401)
    data = _data(request)
    items = data.get("items", [])
    if isinstance(items, str):
        try: items = json.loads(items)
        except json.JSONDecodeError: items = []
    try:
        validated_items, subtotal = _validate_order_items(items)
    except ValueError as error:
        return JsonResponse({"success": False, "message": str(error)}, status=400)
    payment_method = str(data.get("payment_method", "Cash on Delivery")).strip() or "Cash on Delivery"
    if payment_method != "Cash on Delivery":
        return JsonResponse({"success": False, "message": "Online payments must be completed through Razorpay checkout."}, status=400)
    coupon_code = _coupon_code(data)
    with transaction.atomic():
        coupon = _get_available_coupon_for_user(request.user, coupon_code, lock=True) if coupon_code else None
        if coupon_code and not coupon:
            return JsonResponse({"success": False, "message": "This coupon is invalid, expired, already used, or currently being used in another checkout."}, status=400)
        coupon_discount = coupon.amount if coupon else Decimal("0.00")
        delivery, discount, gst, total = _checkout_totals(subtotal, coupon_discount)
        order = Order.objects.create(
            user=request.user, name=str(data.get("name", "")).strip(), email=str(data.get("email", "")).strip(),
            phone=str(data.get("phone", "")).strip(), address=str(data.get("address", "")).strip(),
            city=str(data.get("city", "")).strip(), pincode=str(data.get("pincode", "")).strip(),
            delivery_lat=data.get("delivery_lat") or None, delivery_lng=data.get("delivery_lng") or None,
            payment_method="Cash on Delivery", payment_status="cod_pending", status="placed", total=total,
        )
        for menu_item, name, price, qty in validated_items:
            OrderItem.objects.create(order=order, menu_item=menu_item, name=name, price=price, quantity=qty)
        if coupon:
            coupon.used = True
            coupon.redeemed_order = order
            coupon.redeemed_at = timezone.now()
            coupon.save(update_fields=["used", "redeemed_order", "redeemed_at"])
    return JsonResponse({"success": True, "order_id": order.id, "total": float(total), "discount": float(discount), "coupon_code": coupon.code if coupon else None, "payment_status": order.payment_status, "message": "Order placed successfully."})


@require_POST
@csrf_exempt
def create_demo_payment(request):
    """Create a simulated paid order for the college-project demo checkout."""
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Please login to place an order."}, status=401)

    data = _data(request)
    method = str(data.get("payment_method", "")).strip()
    allowed_methods = {"PhonePe", "Google Pay", "Paytm", "Credit/Debit Card"}
    if method not in allowed_methods:
        return JsonResponse({"success": False, "message": "Select a valid demo payment method."}, status=400)

    items = data.get("items", [])
    if isinstance(items, str):
        try:
            items = json.loads(items)
        except json.JSONDecodeError:
            items = []

    try:
        validated_items, subtotal = _validate_order_items(items)
    except ValueError as error:
        return JsonResponse({"success": False, "message": str(error)}, status=400)

    coupon_code = _coupon_code(data)

    with transaction.atomic():
        coupon = _get_available_coupon_for_user(request.user, coupon_code, lock=True) if coupon_code else None
        if coupon_code and not coupon:
            return JsonResponse({"success": False, "message": "This coupon is invalid, expired, already used, or currently being used in another checkout."}, status=400)
        coupon_discount = coupon.amount if coupon else Decimal("0.00")
        delivery, discount, gst, total = _checkout_totals(subtotal, coupon_discount)
        order = Order.objects.create(
            user=request.user,
            name=str(data.get("name", "")).strip(),
            email=str(data.get("email", "")).strip(),
            phone=str(data.get("phone", "")).strip(),
            address=str(data.get("address", "")).strip(),
            city=str(data.get("city", "")).strip(),
            pincode=str(data.get("pincode", "")).strip(),
            delivery_lat=data.get("delivery_lat") or None,
            delivery_lng=data.get("delivery_lng") or None,
            payment_method=method,
            payment_status="paid",
            status="placed",
            total=total,
            paid_at=timezone.now(),
        )

        for menu_item, name, price, qty in validated_items:
            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                name=name,
                price=price,
                quantity=qty,
            )

        transaction_id = f"DEMO-{order.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        order.razorpay_payment_id = transaction_id
        order.save(update_fields=["razorpay_payment_id"])
        if coupon:
            coupon.used = True
            coupon.redeemed_order = order
            coupon.redeemed_at = timezone.now()
            coupon.save(update_fields=["used", "redeemed_order", "redeemed_at"])

    return JsonResponse({
        "success": True,
        "order_id": order.id,
        "total": float(total),
        "discount": float(discount),
        "coupon_code": coupon.code if coupon else None,
        "payment_method": method,
        "payment_status": "paid",
        "transaction_id": transaction_id,
        "message": "Demo payment successful.",
    })


@csrf_exempt
@require_POST
def create_reservation_upfront_payment(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Please login first."}, status=401)
    data = _data(request)
    try:
        restaurant = Restaurant.objects.get(pk=int(data.get("restaurant_id")))
    except (TypeError, ValueError, Restaurant.DoesNotExist):
        return JsonResponse({"success": False, "message": "Restaurant not found."}, status=404)
    upi_id = str(data.get("upi_id", "")).strip()
    if not re.fullmatch(r"^[A-Za-z0-9._-]+@[A-Za-z]{2,}$", upi_id):
        return JsonResponse({"success": False, "message": "Please enter a valid UPI ID."}, status=400)
    items = data.get("items", [])
    if isinstance(items, str):
        try:
            items = json.loads(items)
        except json.JSONDecodeError:
            items = []
    if not isinstance(items, list) or not items:
        return JsonResponse({"success": False, "message": "No pre-booked food items found."}, status=400)

    total = Decimal("0.00")
    for item in items:
        try:
            menu_id, qty = int(item.get("id")), int(item.get("quantity", 1))
        except (TypeError, ValueError):
            return JsonResponse({"success": False, "message": "Invalid food item."}, status=400)
        menu_item = MenuItem.objects.filter(pk=menu_id, restaurant=restaurant, available=True).first()
        if not menu_item or qty < 1:
            return JsonResponse({"success": False, "message": "A selected food item is unavailable."}, status=400)
        total += menu_item.price * qty

    coupon_code = _coupon_code(data)
    coupon = _get_available_coupon_for_user(request.user, coupon_code) if coupon_code else None
    if coupon_code and not coupon:
        return JsonResponse({"success": False, "message": "This coupon is invalid, expired, already used, or currently being used in another checkout."}, status=400)

    coupon_discount = min(coupon.amount, total) if coupon else Decimal("0.00")
    discounted_total = max(Decimal("0.00"), total - coupon_discount)
    upfront = (discounted_total / Decimal("2")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    remaining = discounted_total - upfront
    tx = f"UPI-{timezone.now().strftime('%Y%m%d%H%M%S%f')[:20]}"
    return JsonResponse({
        "success": True,
        "payment_method": "UPI",
        "food_total": float(discounted_total),
        "original_food_total": float(total),
        "coupon_discount": float(coupon_discount),
        "coupon_code": coupon.code if coupon else None,
        "upfront_amount": float(upfront),
        "remaining_amount": float(remaining),
        "transaction_id": tx,
        "message": "UPI payment successful."
    })


@csrf_exempt
@require_POST
def pay_reservation_remaining(request, reservation_id):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Please login first."}, status=401)
    payment = ReservationPayment.objects.select_related("reservation").filter(
        reservation_id=reservation_id, reservation__user=request.user
    ).first()
    if not payment:
        return JsonResponse({"success": False, "message": "Reservation payment not found."}, status=404)
    reservation = payment.reservation
    if reservation.attendance_response != "coming":
        return JsonResponse({"success": False, "message": "Remaining payment is available only after you confirm Coming."}, status=400)
    if payment.remaining_status == "paid":
        return JsonResponse({"success": True, "already_paid": True, "transaction_id": payment.remaining_transaction_id, "amount": float(payment.remaining_amount)})
    tx = f"UPI-{reservation.id}-FINAL-{timezone.now().strftime('%Y%m%d%H%M%S')}"
    payment.remaining_status = "paid"
    payment.remaining_transaction_id = tx
    payment.remaining_paid_at = timezone.now()
    payment.save(update_fields=["remaining_status", "remaining_transaction_id", "remaining_paid_at"])
    return JsonResponse({"success": True, "amount": float(payment.remaining_amount), "transaction_id": tx, "message": "Remaining food payment completed."})


@csrf_exempt
@require_POST
def process_reservation_refund(request, reservation_id):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Please login first."}, status=401)
    payment = ReservationPayment.objects.select_related("reservation").filter(
        reservation_id=reservation_id, reservation__user=request.user
    ).first()
    if not payment:
        return JsonResponse({"success": False, "message": "Reservation payment not found."}, status=404)
    if payment.reservation.attendance_response != "not_coming":
        return JsonResponse({"success": False, "message": "Refund is available only after choosing Not Coming."}, status=400)
    if payment.refund_status == "processed":
        return JsonResponse({"success": True, "refund_amount": float(payment.refund_amount), "refund_type": payment.refund_type, "reference": payment.refund_reference})
    refund_type = str(_data(request).get("refund_type", "")).strip().lower()
    if refund_type not in {"coupon", "upi"}:
        return JsonResponse({"success": False, "message": "Choose coupon or UPI refund."}, status=400)

    amount = payment.upfront_amount
    reference = f"REF-{reservation_id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
    now = timezone.now()
    with transaction.atomic():
        payment.refund_status = "processed"
        payment.refund_type = refund_type
        payment.refund_amount = amount
        payment.refund_reference = reference
        payment.refund_processed_at = now
        payment.save(update_fields=["refund_status", "refund_type", "refund_amount", "refund_reference", "refund_processed_at"])
        if refund_type == "coupon":
            ReservationCoupon.objects.create(
                user=request.user, reservation=payment.reservation,
                code=f"FOOD{reservation_id}{now.strftime('%m%d')}",
                amount=amount, expires_at=now + timedelta(days=14)
            )
    coupon_code = None
    if refund_type == "upi":
        message = f"Refund of ₹{amount:.2f} initiated to your UPI account"
    else:
        coupon_code = ReservationCoupon.objects.get(reservation=payment.reservation).code
        message = f"Coupon worth ₹{amount:.2f} issued. Valid for 2 weeks."
    return JsonResponse({"success": True, "refund_amount": float(amount), "refund_type": refund_type, "reference": reference, "message": message, "coupon_code": coupon_code})


@require_GET
def reservation_payment_status(request, reservation_id):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Please login first."}, status=401)
    payment = ReservationPayment.objects.filter(reservation_id=reservation_id, reservation__user=request.user).first()
    if not payment:
        return JsonResponse({"success": True, "has_payment": False})
    coupon = getattr(payment.reservation, "refund_coupon", None)
    return JsonResponse({"success": True, "has_payment": True,
        "food_total": float(payment.food_total), "upfront_amount": float(payment.upfront_amount),
        "remaining_amount": float(payment.remaining_amount), "upfront_status": payment.upfront_status,
        "remaining_status": payment.remaining_status, "refund_status": payment.refund_status,
        "refund_type": payment.refund_type, "refund_amount": float(payment.refund_amount),
        "refund_reference": payment.refund_reference,
        "coupon": {"code": coupon.code, "amount": float(coupon.amount), "expires_at": coupon.expires_at.isoformat()}
        if coupon else None})


@require_GET
def payment_config(request):
    return JsonResponse({"success": True, "configured": bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET), "key_id": settings.RAZORPAY_KEY_ID})


@csrf_exempt
@require_POST
def create_razorpay_order(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Please login to place an order."}, status=401)
    client = _razorpay_client()
    if client is None:
        return JsonResponse({"success": False, "message": "Razorpay is not configured on this server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."}, status=503)
    data = _data(request)
    items = data.get("items", [])
    if isinstance(items, str):
        try: items = json.loads(items)
        except json.JSONDecodeError: items = []
    try:
        validated_items, subtotal = _validate_order_items(items)
    except ValueError as error:
        return JsonResponse({"success": False, "message": str(error)}, status=400)
    delivery, discount, gst, total = _checkout_totals(subtotal)
    amount_paise = int((total * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    try:
        with transaction.atomic():
            order = Order.objects.create(
                user=request.user, name=str(data.get("name", "")).strip(), email=str(data.get("email", "")).strip(),
                phone=str(data.get("phone", "")).strip(), address=str(data.get("address", "")).strip(),
                city=str(data.get("city", "")).strip(), pincode=str(data.get("pincode", "")).strip(),
                delivery_lat=data.get("delivery_lat") or None, delivery_lng=data.get("delivery_lng") or None,
                payment_method="Razorpay", payment_status="pending", status="pending_payment", total=total,
            )
            for menu_item, name, price, qty in validated_items:
                OrderItem.objects.create(order=order, menu_item=menu_item, name=name, price=price, quantity=qty)
            razorpay_order = client.order.create({"amount": amount_paise, "currency": "INR", "receipt": f"foodiehub-{order.id}", "notes": {"foodiehub_order_id": str(order.id)}})
            order.razorpay_order_id = razorpay_order["id"]
            order.save(update_fields=["razorpay_order_id"])
    except Exception:
        return JsonResponse({"success": False, "message": "Unable to start Razorpay payment. Check the server Razorpay configuration."}, status=502)
    return JsonResponse({"success": True, "order_id": order.id, "razorpay_order_id": order.razorpay_order_id, "amount": amount_paise, "currency": "INR", "key_id": settings.RAZORPAY_KEY_ID, "total": float(total)})


@csrf_exempt
@require_POST
def verify_razorpay_payment(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Please login first."}, status=401)
    client = _razorpay_client()
    if client is None:
        return JsonResponse({"success": False, "message": "Razorpay is not configured on this server."}, status=503)
    data = _data(request)
    try: local_order_id = int(data.get("order_id"))
    except (TypeError, ValueError): return JsonResponse({"success": False, "message": "Invalid FoodieHub order."}, status=400)
    order = Order.objects.filter(pk=local_order_id, user=request.user).first()
    if not order: return JsonResponse({"success": False, "message": "FoodieHub order not found."}, status=404)
    razorpay_order_id = str(data.get("razorpay_order_id", "")).strip()
    razorpay_payment_id = str(data.get("razorpay_payment_id", "")).strip()
    razorpay_signature = str(data.get("razorpay_signature", "")).strip()
    if order.razorpay_order_id != razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        return JsonResponse({"success": False, "message": "Incomplete or mismatched Razorpay payment response."}, status=400)
    try:
        client.utility.verify_payment_signature({"razorpay_order_id": order.razorpay_order_id, "razorpay_payment_id": razorpay_payment_id, "razorpay_signature": razorpay_signature})
        payment = client.payment.fetch(razorpay_payment_id)
    except Exception:
        return JsonResponse({"success": False, "message": "Razorpay payment verification failed."}, status=400)
    expected_amount = int((order.total * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    if payment.get("order_id") != order.razorpay_order_id or int(payment.get("amount", 0)) != expected_amount:
        return JsonResponse({"success": False, "message": "Payment details do not match the FoodieHub order."}, status=400)
    if payment.get("status") != "captured":
        return JsonResponse({"success": False, "message": "Payment is not captured yet."}, status=400)
    order.payment_status = "paid"
    order.razorpay_payment_id = razorpay_payment_id
    order.razorpay_signature = razorpay_signature
    order.paid_at = timezone.now()
    order.status = "placed"
    order.save(update_fields=["payment_status", "razorpay_payment_id", "razorpay_signature", "paid_at", "status"])
    return JsonResponse({"success": True, "order_id": order.id, "payment_status": "paid", "status": order.status, "total": float(order.total)})


@csrf_exempt
@require_POST
def mark_razorpay_payment_failed(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Please login first."}, status=401)
    data = _data(request)
    try: order_id = int(data.get("order_id"))
    except (TypeError, ValueError): return JsonResponse({"success": False, "message": "Invalid FoodieHub order."}, status=400)
    order = Order.objects.filter(pk=order_id, user=request.user).first()
    if not order: return JsonResponse({"success": False, "message": "FoodieHub order not found."}, status=404)
    if order.payment_status != "paid":
        order.payment_status = "failed"
        order.save(update_fields=["payment_status"])
    return JsonResponse({"success": True, "payment_status": order.payment_status})



def reservation_history(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Login required."}, status=401)

    reservations = []
    for r in request.user.reservations.select_related("restaurant").prefetch_related("items").order_by("-created_at"):
        reservations.append({
            "id": r.id,
            "restaurant": r.restaurant.name,
            "restaurant_id": r.restaurant_id,
            "name": r.name,
            "date": r.date.isoformat(),
            "time": r.time.strftime("%H:%M"),
            "guests": r.guests,
            "status": r.status,
            "attendance_response": r.attendance_response,
            "attendance_notified_at": r.attendance_notified_at.isoformat() if r.attendance_notified_at else None,
            "attendance_responded_at": r.attendance_responded_at.isoformat() if r.attendance_responded_at else None,
            "message": r.message,
            "created_at": r.created_at.isoformat(),
            "prebook_total": float(sum(item.price * item.quantity for item in r.items.all())),
            "payment": ({
                "food_total": float(r.payment.food_total),
                "upfront_amount": float(r.payment.upfront_amount),
                "remaining_amount": float(r.payment.remaining_amount),
                "upfront_status": r.payment.upfront_status,
                "remaining_status": r.payment.remaining_status,
                "refund_status": r.payment.refund_status,
                "refund_type": r.payment.refund_type,
                "refund_amount": float(r.payment.refund_amount),
                "refund_reference": r.payment.refund_reference,
                "coupon": ({
                    "code": r.refund_coupon.code,
                    "amount": float(r.refund_coupon.amount),
                    "expires_at": r.refund_coupon.expires_at.isoformat(),
                } if hasattr(r, "refund_coupon") else None),
            } if hasattr(r, "payment") else None),
            "items": [
                {"name": item.name, "price": float(item.price), "quantity": item.quantity}
                for item in r.items.all()
            ],
        })

    return JsonResponse({"success": True, "reservations": reservations})



@csrf_exempt
@require_POST
def restaurant_register(request):
    data = _data(request)
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()
    password = str(data.get("password", ""))
    try:
        restaurant_id = int(data.get("restaurant_id"))
    except (TypeError, ValueError):
        restaurant_id = 0
    if not all((name, email, phone, password)) or not restaurant_id:
        return JsonResponse({"success": False, "message": "Name, email, phone, password and restaurant are required."}, status=400)
    if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username=email).exists():
        return JsonResponse({"success": False, "message": "An account with this email already exists."}, status=400)
    restaurant = Restaurant.objects.filter(pk=restaurant_id).first()
    if not restaurant:
        return JsonResponse({"success": False, "message": "Restaurant not found."}, status=404)
    if restaurant.owner_id:
        return JsonResponse({"success": False, "message": "This restaurant already has a restaurant account."}, status=400)
    password_error = _validate_password(password)
    if password_error:
        return JsonResponse({"success": False, "message": password_error}, status=400)
    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    Profile.objects.create(user=user, phone=phone, city=restaurant.location)
    restaurant.owner = user
    restaurant.save(update_fields=["owner"])
    return JsonResponse({"success": True, "message": "Restaurant account created successfully.", "user": _user_payload(user), "restaurant": _restaurant_payload(restaurant)})

@csrf_exempt
@require_POST
def restaurant_login(request):
    logout(request)
    data = _data(request)
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    user = User.objects.filter(email__iexact=email).first()
    auth_user = authenticate(request, username=user.username if user else email, password=password)
    if not auth_user or not hasattr(auth_user, "owned_restaurant"):
        return JsonResponse({"success": False, "message": "Invalid restaurant credentials."}, status=401)
    login(request, auth_user)
    return JsonResponse({"success": True, "message": "Restaurant login successful.", "user": _user_payload(auth_user), "restaurant": _restaurant_payload(auth_user.owned_restaurant)})

@require_GET
def restaurant_me(request):
    restaurant, error = _restaurant_owner(request)
    if error: return error
    return JsonResponse({"success": True, "user": _user_payload(request.user), "restaurant": _restaurant_payload(restaurant)})

@require_GET
def restaurant_dashboard(request):
    restaurant, error = _restaurant_owner(request)
    if error: return error
    order_ids = OrderItem.objects.filter(menu_item__restaurant=restaurant).values_list("order_id", flat=True).distinct()
    orders = Order.objects.filter(id__in=order_ids)
    reservations = restaurant.reservations.all()
    inventory = restaurant.inventory.all()
    return JsonResponse({"success": True, "restaurant": _restaurant_payload(restaurant), "stats": {
        "menu_items": restaurant.menu_items.count(), "available_items": restaurant.menu_items.filter(available=True).count(),
        "orders": orders.count(), "pending_orders": orders.filter(status__in=["placed", "pending"]).count(),
        "reservations": reservations.count(), "pending_reservations": reservations.filter(status="pending").count(),
        "inventory_items": inventory.count(), "low_stock": inventory.filter(quantity__lte=models.F("reorder_level")).count(),
    }})

@csrf_exempt
@require_http_methods(["GET", "POST"])
def restaurant_menu(request):
    restaurant, error = _restaurant_owner(request)
    if error: return error
    if request.method == "GET":
        items = list(restaurant.menu_items.order_by("category", "name").values("id", "name", "category", "description", "price", "image", "available"))
        for x in items: x["price"] = float(x["price"])
        return JsonResponse({"success": True, "items": items})
    data = _data(request)
    name = str(data.get("name", "")).strip()
    if not name or data.get("price") in (None, ""):
        return JsonResponse({"success": False, "message": "Item name and price are required."}, status=400)
    try: price = Decimal(str(data.get("price")))
    except Exception: return JsonResponse({"success": False, "message": "Invalid price."}, status=400)
    if price < 0: return JsonResponse({"success": False, "message": "Price cannot be negative."}, status=400)
    item = MenuItem.objects.create(restaurant=restaurant, name=name, category=str(data.get("category", "Other")).strip(), description=str(data.get("description", "")).strip(), price=price, image=str(data.get("image", "")).strip(), available=bool(data.get("available", True)))
    return JsonResponse({"success": True, "item": {"id": item.id, "name": item.name, "category": item.category, "description": item.description, "price": float(item.price), "image": item.image, "available": item.available}})

@csrf_exempt
@require_http_methods(["PUT", "PATCH", "DELETE"])
def restaurant_menu_item(request, item_id):
    restaurant, error = _restaurant_owner(request)
    if error: return error
    item = restaurant.menu_items.filter(pk=item_id).first()
    if not item: return JsonResponse({"success": False, "message": "Menu item not found."}, status=404)
    if request.method == "DELETE":
        item.delete(); return JsonResponse({"success": True, "message": "Menu item deleted."})
    data = _data(request)
    for field in ("name", "category", "description", "image"):
        if field in data: setattr(item, field, str(data.get(field, "")).strip())
    if "price" in data:
        try: item.price = Decimal(str(data.get("price")))
        except Exception: return JsonResponse({"success": False, "message": "Invalid price."}, status=400)
    if "available" in data:
        value=data.get("available"); item.available = value is True or str(value).lower() in ("true","1","yes","available")
    item.save()
    return JsonResponse({"success": True, "message": "Menu item updated."})

@require_GET
def restaurant_orders(request):
    restaurant, error = _restaurant_owner(request)
    if error: return error
    order_ids = OrderItem.objects.filter(menu_item__restaurant=restaurant).values_list("order_id", flat=True).distinct()
    result=[]
    for o in Order.objects.filter(id__in=order_ids).prefetch_related("items").order_by("-created_at"):
        items=[{"name":i.name,"price":float(i.price),"quantity":i.quantity} for i in o.items.all() if i.menu_item_id and i.menu_item.restaurant_id==restaurant.id]
        result.append({"id":o.id,"name":o.name,"email":o.email,"phone":o.phone,"address":o.address,"city":o.city,"payment_method":o.payment_method,"payment_status":o.payment_status,"total":float(o.total),"status":o.status,"created_at":o.created_at.isoformat(),"items":items})
    return JsonResponse({"success":True,"orders":result})

@csrf_exempt
@require_http_methods(["PATCH", "POST"])
def restaurant_order_detail(request, order_id):
    restaurant, error = _restaurant_owner(request)
    if error: return error
    if not OrderItem.objects.filter(order_id=order_id, menu_item__restaurant=restaurant).exists(): return JsonResponse({"success":False,"message":"Order not found."},status=404)
    order=Order.objects.get(pk=order_id); data=_data(request); status=str(data.get("status","")).strip().lower()
    allowed={"placed","confirmed","preparing","ready","out_for_delivery","delivered","cancelled"}
    if status not in allowed: return JsonResponse({"success":False,"message":"Invalid order status."},status=400)
    if order.payment_method == "Razorpay" and order.payment_status != "paid" and status in {"confirmed","preparing","ready","out_for_delivery","delivered"}:
        return JsonResponse({"success":False,"message":"Online order payment must be successful before processing."},status=400)
    order.status=status; order.save(update_fields=["status"])
    return JsonResponse({"success":True,"message":"Order status updated.","status":order.status})

@require_GET
def restaurant_reservations(request):
    restaurant, error = _restaurant_owner(request)
    if error: return error
    rows=[]
    for r in restaurant.reservations.prefetch_related("items").order_by("-date","-time"):
        payment = getattr(r, "payment", None)
        rows.append({"id":r.id,"name":r.name,"email":r.email,"phone":r.phone,"date":r.date.isoformat(),"time":r.time.strftime("%H:%M"),"guests":r.guests,"message":r.message,"status":r.status,"attendance_response":r.attendance_response,"attendance_notified_at":r.attendance_notified_at.isoformat() if r.attendance_notified_at else None,"attendance_responded_at":r.attendance_responded_at.isoformat() if r.attendance_responded_at else None,"created_at":r.created_at.isoformat(),"prebook_total":float(sum(i.price*i.quantity for i in r.items.all())),"payment":({"upfront_amount":float(payment.upfront_amount),"remaining_amount":float(payment.remaining_amount),"upfront_status":payment.upfront_status,"remaining_status":payment.remaining_status,"refund_status":payment.refund_status,"refund_type":payment.refund_type,"refund_amount":float(payment.refund_amount),"refund_reference":payment.refund_reference} if payment else None),"items":[{"name":i.name,"price":float(i.price),"quantity":i.quantity} for i in r.items.all()]})
    return JsonResponse({"success":True,"reservations":rows})

@csrf_exempt
@require_http_methods(["PATCH", "POST"])
def restaurant_reservation_detail(request, reservation_id):
    restaurant, error = _restaurant_owner(request)
    if error: return error
    r=restaurant.reservations.filter(pk=reservation_id).first()
    if not r: return JsonResponse({"success":False,"message":"Reservation not found."},status=404)
    status=str(_data(request).get("status","")).strip().lower()
    if status not in {"pending","confirmed","completed","cancelled"}: return JsonResponse({"success":False,"message":"Invalid reservation status."},status=400)
    r.status=status; r.save(update_fields=["status"])
    return JsonResponse({"success":True,"message":"Reservation status updated.","status":r.status})

@csrf_exempt
@require_http_methods(["GET", "POST"])
def restaurant_inventory(request):
    restaurant, error = _restaurant_owner(request)
    if error: return error
    if request.method == "GET":
        rows=list(restaurant.inventory.order_by("name").values("id","name","quantity","unit","reorder_level","updated_at"))
        for x in rows: x["quantity"]=float(x["quantity"]); x["reorder_level"]=float(x["reorder_level"]); x["updated_at"]=x["updated_at"].isoformat()
        return JsonResponse({"success":True,"items":rows})
    data=_data(request); name=str(data.get("name","")).strip()
    if not name: return JsonResponse({"success":False,"message":"Inventory item name is required."},status=400)
    try: quantity=Decimal(str(data.get("quantity",0))); reorder=Decimal(str(data.get("reorder_level",0)))
    except Exception: return JsonResponse({"success":False,"message":"Invalid inventory values."},status=400)
    item=InventoryItem.objects.create(restaurant=restaurant,name=name,quantity=quantity,unit=str(data.get("unit","units")).strip() or "units",reorder_level=reorder)
    return JsonResponse({"success":True,"id":item.id})

@csrf_exempt
@require_http_methods(["PATCH", "DELETE"])
def restaurant_inventory_item(request, item_id):
    restaurant, error = _restaurant_owner(request)
    if error: return error
    item=restaurant.inventory.filter(pk=item_id).first()
    if not item: return JsonResponse({"success":False,"message":"Inventory item not found."},status=404)
    if request.method=="DELETE": item.delete(); return JsonResponse({"success":True})
    data=_data(request)
    for f in ("name","unit"):
        if f in data: setattr(item,f,str(data.get(f)).strip())
    for f in ("quantity","reorder_level"):
        if f in data:
            try: setattr(item,f,Decimal(str(data.get(f))))
            except Exception: return JsonResponse({"success":False,"message":"Invalid inventory value."},status=400)
    item.save(); return JsonResponse({"success":True})

@csrf_exempt
@require_POST
def forgot_password(request):
    data = _data(request)
    email = str(data.get("email", "")).strip().lower()

    user = User.objects.filter(email=email).first()

    # Do not reveal whether an account exists.
    response = {
        "success": True,
        "message": "If an account exists for that email, password reset instructions are ready."
    }

    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        reset_path = f"/login/pages/reset-password.html?uid={uid}&token={token}"
        reset_url = f"{settings.FRONTEND_BASE_URL}{reset_path}"

        try:
            send_mail(
                "FoodieHub Password Reset",
                (
                    "Hello,\n\n"
                    "We received a request to reset your FoodieHub password.\n\n"
                    "Click the link below to reset your password:\n\n"
                    f"{reset_url}\n\n"
                    "If you did not request a password reset, you can ignore this email.\n\n"
                    "FoodieHub Team"
                ),
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

        except Exception as error:
            print("Password reset email error:", error)

            return JsonResponse(
                {
                    "success": False,
                    "message": "Unable to send the password reset email. Please try again."
                },
                status=500,
            )

    return JsonResponse(response)


@csrf_exempt
@require_POST
def reset_password(request):
    data = _data(request)
    uid, token, password = str(data.get("uid", "")), str(data.get("token", "")), str(data.get("password", ""))
    if not uid or not token or len(password) < 8:
        return JsonResponse({"success": False, "message": "Invalid reset request or password."}, status=400)
    try:
        user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return JsonResponse({"success": False, "message": "Invalid or expired reset link."}, status=400)
    if not default_token_generator.check_token(user, token):
        return JsonResponse({"success": False, "message": "Invalid or expired reset link."}, status=400)
    password_error = _validate_password(password, user=user)
    if password_error:
        return JsonResponse({"success": False, "message": password_error}, status=400)
    user.set_password(password)
    user.save(update_fields=["password"])
    return JsonResponse({"success": True, "message": "Password reset successfully."})


@require_GET
def order_history(request):
    if not request.user.is_authenticated: return JsonResponse({"success": False, "message": "Login required."}, status=401)
    orders = []
    for o in request.user.orders.prefetch_related("items").order_by("-created_at"):
        orders.append({"id": o.id, "total": float(o.total), "status": o.status, "payment_method": o.payment_method, "payment_status": o.payment_status, "created_at": o.created_at.isoformat(), "items": [{"name": i.name, "price": float(i.price), "quantity": i.quantity} for i in o.items.all()]})
    return JsonResponse({"success": True, "orders": orders})


# ------------------------- Google Sign-In -------------------------

@require_GET
def google_auth_config(request):
    return JsonResponse({"success": True, "client_id": settings.GOOGLE_CLIENT_ID})


@csrf_exempt
@require_POST
def google_login(request):
    data = _data(request)
    credential = str(data.get("credential", "")).strip()
    requested_role = str(data.get("role", "user")).strip().lower()
    if not credential:
        return JsonResponse({"success": False, "message": "Google credential is required."}, status=400)
    if requested_role not in {"user", "admin", "restaurant", "delivery"}:
        requested_role = "user"
    if not settings.GOOGLE_CLIENT_ID:
        return JsonResponse({"success": False, "message": "Google authentication is not configured on this server."}, status=503)
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        info = id_token.verify_oauth2_token(credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
        if info.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
            raise ValueError("Invalid issuer.")
        if not info.get("email_verified"):
            raise ValueError("Google email is not verified.")
        google_sub = str(info["sub"])
        email = str(info.get("email", "")).strip().lower()
        name = str(info.get("name", "")).strip() or email.split("@")[0]
    except Exception:
        return JsonResponse({"success": False, "message": "Unable to verify the Google account."}, status=401)

    profile = Profile.objects.filter(google_sub=google_sub).select_related("user").first()
    user = profile.user if profile else User.objects.filter(email__iexact=email).first()

    if user is None:
        if requested_role != "user":
            return JsonResponse({"success": False, "message": f"Use the {requested_role} registration first, then Sign in with Google."}, status=403)
        user = User.objects.create_user(username=email, email=email, first_name=name)
        profile = Profile.objects.create(user=user, google_sub=google_sub)
    else:
        profile, _ = Profile.objects.get_or_create(user=user)
        if profile.google_sub and profile.google_sub != google_sub:
            return JsonResponse({"success": False, "message": "This account is linked to a different Google account."}, status=409)
        profile.google_sub = google_sub
        profile.save(update_fields=["google_sub"])

    actual_role = _user_payload(user)["role"]
    if actual_role != requested_role:
        return JsonResponse({"success": False, "message": f"This account is registered as {actual_role}, not {requested_role}."}, status=403)

    logout(request)
    login(request, user)
    payload = _user_payload(user)
    response = {"success": True, "message": "Google login successful.", "user": payload}
    if actual_role == "restaurant":
        response["restaurant"] = _restaurant_payload(user.owned_restaurant)
    return JsonResponse(response)


# ------------------------- Delivery Partner -------------------------

def _delivery_partner(request):
    if not request.user.is_authenticated:
        return None, JsonResponse({"success": False, "message": "Please login first."}, status=401)
    partner = getattr(request.user, "delivery_partner", None)
    if not partner:
        return None, JsonResponse({"success": False, "message": "Delivery partner account required."}, status=403)
    return partner, None


@csrf_exempt
@require_POST
def delivery_register(request):
    data = _data(request)
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()
    password = str(data.get("password", ""))
    vehicle_type = str(data.get("vehicle_type", "Bike")).strip() or "Bike"
    vehicle_number = str(data.get("vehicle_number", "")).strip()
    if not all((name, email, phone, password)):
        return JsonResponse({"success": False, "message": "Name, email, phone and password are required."}, status=400)
    if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username=email).exists():
        return JsonResponse({"success": False, "message": "An account with this email already exists."}, status=400)
    password_error = _validate_password(password)
    if password_error:
        return JsonResponse({"success": False, "message": password_error}, status=400)
    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    Profile.objects.create(user=user, phone=phone)
    DeliveryPartner.objects.create(user=user, phone=phone, vehicle_type=vehicle_type, vehicle_number=vehicle_number)
    return JsonResponse({"success": True, "message": "Delivery partner account created successfully.", "user": _user_payload(user)})


@csrf_exempt
@require_POST
def delivery_login(request):
    logout(request)
    data = _data(request)
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    user = User.objects.filter(email__iexact=email).first()
    auth_user = authenticate(request, username=user.username if user else email, password=password)
    if not auth_user or not hasattr(auth_user, "delivery_partner"):
        return JsonResponse({"success": False, "message": "Invalid delivery partner credentials."}, status=401)
    login(request, auth_user)
    return JsonResponse({"success": True, "message": "Delivery partner login successful.", "user": _user_payload(auth_user)})


@require_GET
def delivery_me(request):
    partner, error = _delivery_partner(request)
    if error:
        return error
    return JsonResponse({
        "success": True,
        "user": _user_payload(request.user),
        "partner": {
            "id": partner.id, "phone": partner.phone, "vehicle_type": partner.vehicle_type,
            "vehicle_number": partner.vehicle_number, "is_available": partner.is_available,
            "current_lat": float(partner.current_lat) if partner.current_lat is not None else None,
            "current_lng": float(partner.current_lng) if partner.current_lng is not None else None,
        },
    })


@require_GET
def delivery_dashboard(request):
    partner, error = _delivery_partner(request)
    if error:
        return error

    assigned = (
        DeliveryAssignment.objects
        .filter(partner=partner)
        .select_related("order")
        .prefetch_related("order__items")
        .order_by("-assigned_at")
    )

    assigned_payload = []
    for a in assigned:
        assigned_payload.append({
            "id": a.order_id,
            "name": a.order.name,
            "phone": a.order.phone,
            "address": a.order.address,
            "city": a.order.city,
            "pincode": a.order.pincode,
            "total": float(a.order.total),
            "status": a.order.status,
            "assignment_status": a.status,
            "delivery_lat": float(a.order.delivery_lat) if a.order.delivery_lat is not None else None,
            "delivery_lng": float(a.order.delivery_lng) if a.order.delivery_lng is not None else None,
            "partner_current_lat": float(partner.current_lat) if partner.current_lat is not None else None,
            "partner_current_lng": float(partner.current_lng) if partner.current_lng is not None else None,
            "partner_last_location_at": partner.last_location_at.isoformat() if partner.last_location_at else None,
            "created_at": a.order.created_at.isoformat(),
            "delivered_at": a.delivered_at.isoformat() if a.delivered_at else None,
            "items": [
                {"name": i.name, "quantity": i.quantity}
                for i in a.order.items.all()
            ],
        })

    active = [
        order for order in assigned_payload
        if order["status"] != "delivered"
    ]

    delivered = [
        order for order in assigned_payload
        if order["status"] == "delivered"
    ]

    available = []
    for o in (
        Order.objects
        .filter(
            status__in=["ready", "out_for_delivery"],
            delivery_assignment__isnull=True,
        )
        .prefetch_related("items")
        .order_by("created_at")
    ):
        available.append({
            "id": o.id,
            "name": o.name,
            "phone": o.phone,
            "address": o.address,
            "city": o.city,
            "pincode": o.pincode,
            "total": float(o.total),
            "status": o.status,
            "delivery_lat": float(o.delivery_lat) if o.delivery_lat is not None else None,
            "delivery_lng": float(o.delivery_lng) if o.delivery_lng is not None else None,
            "created_at": o.created_at.isoformat(),
            "items": [
                {"name": i.name, "quantity": i.quantity}
                for i in o.items.all()
            ],
        })

    return JsonResponse({
        "success": True,
        "active_orders": active,
        "delivered_orders": delivered,
        "available_orders": available,
    })

@csrf_exempt
@require_POST
def delivery_accept_order(request, order_id):
    partner, error = _delivery_partner(request)
    if error:
        return error
    if not partner.is_available:
        return JsonResponse({"success": False, "message": "Set yourself available before accepting orders."}, status=400)
    with transaction.atomic():
        order = Order.objects.select_for_update().filter(
            pk=order_id,
            status__in=["ready", "out_for_delivery"],
            delivery_assignment__isnull=True,
        ).first()
        if not order:
            return JsonResponse({"success": False, "message": "This order is no longer available."}, status=409)
        DeliveryAssignment.objects.create(order=order, partner=partner, status="accepted")
        order.status = "out_for_delivery"
        order.save(update_fields=["status"])
        partner.is_available = False
        partner.save(update_fields=["is_available"])
    return JsonResponse({"success": True, "message": "Delivery accepted.", "order_id": order.id})


@csrf_exempt
@require_POST
def delivery_update_status(request, order_id):
    partner, error = _delivery_partner(request)
    if error:
        return error
    assignment = DeliveryAssignment.objects.filter(order_id=order_id, partner=partner).select_related("order").first()
    if not assignment:
        return JsonResponse({"success": False, "message": "Delivery assignment not found."}, status=404)
    status = str(_data(request).get("status", "")).strip().lower()
    allowed = {"picked_up", "out_for_delivery", "delivered"}
    if status not in allowed:
        return JsonResponse({"success": False, "message": "Invalid delivery status."}, status=400)
    assignment.status = status
    if status == "picked_up":
        assignment.picked_up_at = timezone.now()
    if status == "delivered":
        assignment.delivered_at = timezone.now()
        assignment.order.status = "delivered"
        assignment.order.save(update_fields=["status"])
        partner.is_available = True
        partner.save(update_fields=["is_available"])
    else:
        assignment.order.status = "out_for_delivery"
        assignment.order.save(update_fields=["status"])
    assignment.save(update_fields=["status", "picked_up_at", "delivered_at"])
    return JsonResponse({"success": True, "status": assignment.status})


@csrf_exempt
@require_POST
def delivery_update_location(request, order_id):
    partner, error = _delivery_partner(request)
    if error:
        return error
    assignment = DeliveryAssignment.objects.filter(order_id=order_id, partner=partner).first()
    if not assignment:
        return JsonResponse({"success": False, "message": "Delivery assignment not found."}, status=404)
    data = _data(request)
    try:
        lat = Decimal(str(data.get("lat")))
        lng = Decimal(str(data.get("lng")))
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            raise ValueError
    except Exception:
        return JsonResponse({"success": False, "message": "Invalid location."}, status=400)
    partner.current_lat, partner.current_lng, partner.last_location_at = lat, lng, timezone.now()
    partner.save(update_fields=["current_lat", "current_lng", "last_location_at"])
    return JsonResponse({"success": True})


@require_GET
def delivery_available_partners(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"success": False, "message": "Administrator access required."}, status=403)
    rows = []
    for p in DeliveryPartner.objects.select_related("user").filter(is_available=True):
        rows.append({"id": p.id, "name": p.user.first_name or p.user.username, "phone": p.phone, "vehicle_type": p.vehicle_type, "vehicle_number": p.vehicle_number})
    return JsonResponse({"success": True, "partners": rows})


@csrf_exempt
@require_POST
def admin_assign_delivery(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"success": False, "message": "Administrator access required."}, status=403)
    data = _data(request)
    try:
        order_id = int(data.get("order_id"))
        partner_id = int(data.get("partner_id"))
    except (TypeError, ValueError):
        return JsonResponse({"success": False, "message": "Order and delivery partner are required."}, status=400)
    order = Order.objects.filter(pk=order_id).first()
    partner = DeliveryPartner.objects.filter(pk=partner_id, is_available=True).first()
    if not order or not partner:
        return JsonResponse({"success": False, "message": "Order or available partner not found."}, status=404)
    assignment, _ = DeliveryAssignment.objects.update_or_create(order=order, defaults={"partner": partner, "status": "assigned"})
    order.status = "out_for_delivery"
    order.save(update_fields=["status"])
    partner.is_available = False
    partner.save(update_fields=["is_available"])
    return JsonResponse({"success": True, "message": "Delivery partner assigned.", "order_id": order.id, "partner_id": partner.id})


@require_GET
def admin_delivery_partners(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"success": False, "message": "Administrator access required."}, status=403)
    rows = []
    for p in DeliveryPartner.objects.select_related("user").prefetch_related("assignments"):
        active = p.assignments.filter(order__status="out_for_delivery").first()
        rows.append({
            "id": p.id, "name": p.user.first_name or p.user.username, "email": p.user.email,
            "phone": p.phone, "vehicle_type": p.vehicle_type, "vehicle_number": p.vehicle_number,
            "is_available": p.is_available, "active_order_id": active.order_id if active else None,
            "current_lat": float(p.current_lat) if p.current_lat is not None else None,
            "current_lng": float(p.current_lng) if p.current_lng is not None else None,
        })
    return JsonResponse({"success": True, "partners": rows})


@require_GET
def order_tracking(request, order_id):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Login required."}, status=401)
    order = Order.objects.filter(pk=order_id).select_related("delivery_assignment__partner__user").first()
    if not order:
        return JsonResponse({"success": False, "message": "Order not found."}, status=404)
    assignment = getattr(order, "delivery_assignment", None)
    partner = assignment.partner if assignment else None
    is_customer = order.user_id == request.user.id
    is_assigned_partner = bool(assignment and partner and partner.user_id == request.user.id)
    if not (request.user.is_staff or is_customer or is_assigned_partner):
        return JsonResponse({"success": False, "message": "You cannot track this order."}, status=403)
    restaurant = None
    restaurant_ids = list(OrderItem.objects.filter(order=order, menu_item__isnull=False).values_list("menu_item__restaurant_id", flat=True).distinct())
    if restaurant_ids:
        restaurant = Restaurant.objects.filter(pk=restaurant_ids[0]).first()
    return JsonResponse({
        "success": True,
        "order": {
            "id": order.id, "status": order.status, "payment_method": order.payment_method, "payment_status": order.payment_status, "address": order.address, "city": order.city,
            "pincode": order.pincode, "delivery_lat": float(order.delivery_lat) if order.delivery_lat is not None else None,
            "delivery_lng": float(order.delivery_lng) if order.delivery_lng is not None else None,
            "total": float(order.total),
        },
        "restaurant": ({
            "id": restaurant.id,
            "name": restaurant.name,
            "location": restaurant.location,
            "image": restaurant.image,
        } if restaurant else None),
        "partner": ({
            "id": partner.id, "name": partner.user.first_name or partner.user.username,
            "phone": partner.phone, "vehicle_type": partner.vehicle_type,
            "current_lat": float(partner.current_lat) if partner.current_lat is not None else None,
            "current_lng": float(partner.current_lng) if partner.current_lng is not None else None,
            "last_location_at": partner.last_location_at.isoformat() if partner.last_location_at else None,
        } if partner else None),
        "assignment": {"status": assignment.status} if assignment else None,
    })


@require_GET
def admin_orders(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"success": False, "message": "Administrator access required."}, status=403)
    rows = []
    for o in Order.objects.prefetch_related("items").select_related("delivery_assignment__partner__user").order_by("-created_at"):
        assignment = getattr(o, "delivery_assignment", None)
        rows.append({
            "id": o.id, "name": o.name, "phone": o.phone, "address": o.address,
            "city": o.city, "pincode": o.pincode, "total": float(o.total), "status": o.status,
            "payment_method": o.payment_method, "payment_status": o.payment_status,
            "created_at": o.created_at.isoformat(),
            "partner_id": assignment.partner_id if assignment else None,
            "partner_name": (assignment.partner.user.first_name or assignment.partner.user.username) if assignment and assignment.partner else None,
            "items": [{"name": i.name, "quantity": i.quantity} for i in o.items.all()],
        })
    return JsonResponse({"success": True, "orders": rows})


@csrf_exempt
@require_POST
def delivery_toggle_availability(request):
    partner, error = _delivery_partner(request)
    if error:
        return error
    active = DeliveryAssignment.objects.filter(partner=partner, order__status="out_for_delivery").exists()
    if active:
        return JsonResponse({"success": False, "message": "Finish your active delivery before changing availability."}, status=400)
    value = _data(request).get("is_available")
    partner.is_available = value is True or str(value).lower() in ("true", "1", "yes")
    partner.save(update_fields=["is_available"])
    return JsonResponse({"success": True, "is_available": partner.is_available})

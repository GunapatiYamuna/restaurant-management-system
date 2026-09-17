import json
from datetime import date
from decimal import Decimal
from pathlib import Path
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.models import User
from django.db import transaction
from django.http import JsonResponse, Http404, FileResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from .models import Profile, Restaurant, MenuItem, Reservation, ReservationItem, Order, OrderItem

FRONTEND = settings.PROJECT_ROOT / "frontend"

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
    return {"id": user.id, "name": user.first_name or user.username, "email": user.email,
            "phone": profile.phone, "city": profile.city, "role": "admin" if user.is_staff else "user"}

@csrf_exempt
@require_POST
def register_user(request):
    data = _data(request)
    name, email, phone, password = [str(data.get(k, "")).strip() for k in ("name", "email", "phone", "password")]
    if not all((name, email, phone, password)):
        return JsonResponse({"success": False, "message": "All fields are required."}, status=400)
    if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
        return JsonResponse({"success": False, "message": "An account with this email already exists."}, status=400)
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
    user = User.objects.create_user(username=email, email=email, password=password, first_name=name, is_staff=True)
    Profile.objects.create(user=user, phone=phone)
    return JsonResponse({"success": True, "message": "Administrator account created successfully.", "user": _user_payload(user)})


@csrf_exempt
@require_POST
def login_user(request):
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

@require_POST
def logout_user(request):
    logout(request)
    return JsonResponse({"success": True})

@require_GET
def current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False})
    return JsonResponse({"authenticated": True, "user": _user_payload(request.user)})

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
    data = _data(request)
    required = ("restaurant_id", "name", "email", "phone", "date", "time", "guests")
    if any(not str(data.get(k, "")).strip() for k in required):
        return JsonResponse({"success": False, "message": "All reservation fields are required."}, status=400)

    items = data.get("items", [])
    if isinstance(items, str):
        try:
            items = json.loads(items)
        except json.JSONDecodeError:
            items = []
    if not isinstance(items, list):
        items = []

    try:
        with transaction.atomic():
            r = Restaurant.objects.get(pk=int(data["restaurant_id"]))
            reservation = Reservation.objects.create(
                user=request.user if request.user.is_authenticated else None,
                restaurant=r,
                name=str(data["name"]).strip(),
                email=str(data["email"]).strip(),
                phone=str(data["phone"]).strip(),
                date=data["date"],
                time=data["time"],
                guests=int(data["guests"]),
                message=str(data.get("message", "")).strip(),
            )

            total = Decimal("0.00")
            saved_items = []
            for item in items:
                try:
                    menu_id = int(item.get("id"))
                    qty = max(1, int(item.get("quantity", 1)))
                except (TypeError, ValueError):
                    return JsonResponse({"success": False, "message": "Invalid pre-booked item."}, status=400)

                menu_item = MenuItem.objects.filter(
                    pk=menu_id, restaurant=r, available=True
                ).first()
                if not menu_item:
                    return JsonResponse({"success": False, "message": "One of the selected menu items is unavailable."}, status=400)

                price = menu_item.price
                ReservationItem.objects.create(
                    reservation=reservation,
                    menu_item=menu_item,
                    name=menu_item.name,
                    price=price,
                    quantity=qty,
                )
                total += price * qty
                saved_items.append({"name": menu_item.name, "price": float(price), "quantity": qty})

    except (Restaurant.DoesNotExist, ValueError):
        return JsonResponse({"success": False, "message": "Invalid reservation data."}, status=400)

    return JsonResponse({
        "success": True,
        "reservation_id": reservation.id,
        "restaurant": r.name,
        "items": saved_items,
        "prebook_total": float(total),
        "message": "Table reserved successfully."
    })

@csrf_exempt
@require_POST
def create_order(request):
    data = _data(request)
    items = data.get("items", [])
    if isinstance(items, str):
        try:
            items = json.loads(items)
        except json.JSONDecodeError:
            items = []
    if not isinstance(items, list) or not items:
        return JsonResponse({"success": False, "message": "Your cart is empty."}, status=400)

    with transaction.atomic():
        order = Order.objects.create(
            user=request.user if request.user.is_authenticated else None,
            name=str(data.get("name", "")).strip(),
            email=str(data.get("email", "")).strip(),
            phone=str(data.get("phone", "")).strip(),
            address=str(data.get("address", "")).strip(),
            city=str(data.get("city", "")).strip(),
            pincode=str(data.get("pincode", "")).strip(),
            payment_method=str(data.get("payment_method", "Cash on Delivery")).strip() or "Cash on Delivery",
        )
        total = Decimal("0.00")
        for item in items:
            try:
                qty = max(1, int(item.get("quantity", 1)))
            except (TypeError, ValueError):
                return JsonResponse({"success": False, "message": "Invalid item quantity."}, status=400)
            menu_item = None
            item_id = item.get("id")
            if item_id:
                menu_item = MenuItem.objects.filter(pk=item_id, available=True).first()
            # Existing frontend cart entries may not have database IDs, so retain their snapshot price.
            try:
                price = Decimal(str(item.get("price", "0")))
            except Exception:
                return JsonResponse({"success": False, "message": "Invalid item price."}, status=400)
            if price < 0:
                return JsonResponse({"success": False, "message": "Invalid item price."}, status=400)
            if menu_item is not None:
                price = menu_item.price
            name = str(item.get("name", "Item")).strip() or "Item"
            total += price * qty
            OrderItem.objects.create(order=order, menu_item=menu_item, name=name, price=price, quantity=qty)
        order.total = total
        order.save(update_fields=["total"])
    return JsonResponse({"success": True, "order_id": order.id, "total": float(order.total), "message": "Order placed successfully."})


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
    user.set_password(password)
    user.save(update_fields=["password"])
    return JsonResponse({"success": True, "message": "Password reset successfully."})


@require_GET
def order_history(request):
    if not request.user.is_authenticated: return JsonResponse({"success": False, "message": "Login required."}, status=401)
    orders = []
    for o in request.user.orders.prefetch_related("items").order_by("-created_at"):
        orders.append({"id": o.id, "total": float(o.total), "status": o.status, "created_at": o.created_at.isoformat(), "items": [{"name": i.name, "price": float(i.price), "quantity": i.quantity} for i in o.items.all()]})
    return JsonResponse({"success": True, "orders": orders})

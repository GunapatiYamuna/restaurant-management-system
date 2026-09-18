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
from django.db import transaction, models
from django.http import JsonResponse, Http404, FileResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST, require_http_methods
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
    role = "admin" if user.is_staff else ("restaurant" if hasattr(user, "owned_restaurant") else "user")
    return {"id": user.id, "name": user.first_name or user.username, "email": user.email,
            "phone": profile.phone, "city": profile.city, "role": role}

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
                user=request.user,
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
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Please login to place an order."}, status=401)
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
            user=request.user,
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


@require_GET
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
            "message": r.message,
            "created_at": r.created_at.isoformat(),
            "prebook_total": float(sum(item.price * item.quantity for item in r.items.all())),
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
        result.append({"id":o.id,"name":o.name,"email":o.email,"phone":o.phone,"address":o.address,"city":o.city,"payment_method":o.payment_method,"total":float(o.total),"status":o.status,"created_at":o.created_at.isoformat(),"items":items})
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
    order.status=status; order.save(update_fields=["status"])
    return JsonResponse({"success":True,"message":"Order status updated.","status":order.status})

@require_GET
def restaurant_reservations(request):
    restaurant, error = _restaurant_owner(request)
    if error: return error
    rows=[]
    for r in restaurant.reservations.prefetch_related("items").order_by("-date","-time"):
        rows.append({"id":r.id,"name":r.name,"email":r.email,"phone":r.phone,"date":r.date.isoformat(),"time":r.time.strftime("%H:%M"),"guests":r.guests,"message":r.message,"status":r.status,"created_at":r.created_at.isoformat(),"prebook_total":float(sum(i.price*i.quantity for i in r.items.all())),"items":[{"name":i.name,"price":float(i.price),"quantity":i.quantity} for i in r.items.all()]})
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

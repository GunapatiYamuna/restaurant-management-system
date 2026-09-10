from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password

RESTAURANTS = [
    {
        "id": 1,
        "name": "Spice Garden",
        "cuisine": "Indian",
        "rating": 4.8,
        "reviews": 124,
        "price": "₹₹",
        "location": "Vijayawada",
        "description": "Authentic Indian cuisine prepared with fresh ingredients and traditional spices.",
        "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900",
    },
    {
        "id": 2,
        "name": "The Food Court",
        "cuisine": "Multi-Cuisine",
        "rating": 4.6,
        "reviews": 98,
        "price": "₹₹",
        "location": "Guntur",
        "description": "A modern restaurant offering delicious dishes from different cuisines.",
        "image": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=900",
    },
    {
        "id": 3,
        "name": "Royal Treat",
        "cuisine": "North Indian",
        "rating": 4.7,
        "reviews": 156,
        "price": "₹₹₹",
        "location": "Hyderabad",
        "description": "Premium dining experience with rich flavours and elegant interiors.",
        "image": "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=900",
    },
    {
        "id": 4,
        "name": "Tasty Bites",
        "cuisine": "Chinese",
        "rating": 4.5,
        "reviews": 87,
        "price": "₹₹",
        "location": "Vijayawada",
        "description": "Delicious Chinese dishes, noodles, fried rice and more.",
        "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900",
    },
    {
        "id": 5,
        "name": "Urban Cafe",
        "cuisine": "Cafe",
        "rating": 4.4,
        "reviews": 76,
        "price": "₹",
        "location": "Guntur",
        "description": "A cozy cafe serving snacks, coffee, desserts and quick bites.",
        "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900",
    },
    {
        "id": 6,
        "name": "Green Leaf",
        "cuisine": "Vegetarian",
        "rating": 4.6,
        "reviews": 112,
        "price": "₹₹",
        "location": "Hyderabad",
        "description": "Fresh vegetarian food prepared with healthy and natural ingredients.",
        "image": "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=900",
    },
]

@csrf_exempt
@require_POST
def register_user(request):
    name = request.POST.get("name", "").strip()
    email = request.POST.get("email", "").strip().lower()
    phone = request.POST.get("phone", "").strip()
    password = request.POST.get("password", "")

    if not name or not email or not phone or not password:
        return JsonResponse(
            {"success": False, "message": "All fields are required."},
            status=400
        )

    if not email:
        return JsonResponse(
            {"success": False, "message": "Email is required."},
            status=400
        )

    if User.objects.filter(username=email).exists():
        return JsonResponse(
            {"success": False, "message": "An account with this email already exists."},
            status=400
        )

    if User.objects.filter(email=email).exists():
        return JsonResponse(
            {"success": False, "message": "An account with this email already exists."},
            status=400
        )

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=name,
    )

    user.save()

    return JsonResponse({
        "success": True,
        "message": "Account created successfully."
    })

@csrf_exempt
@require_POST
def login_user(request):
    email = request.POST.get("email", "").strip().lower()
    password = request.POST.get("password", "")

    if not email or not password:
        return JsonResponse(
            {
                "success": False,
                "message": "Email and password are required."
            },
            status=400
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse(
            {
                "success": False,
                "message": "Invalid email or password."
            },
            status=401
        )

    authenticated_user = authenticate(
        request,
        username=user.username,
        password=password
    )

    if authenticated_user is None:
        return JsonResponse(
            {
                "success": False,
                "message": "Invalid email or password."
            },
            status=401
        )

    return JsonResponse({
        "success": True,
        "message": "Login successful.",
        "user": {
            "id": user.id,
            "name": user.first_name or user.username,
            "email": user.email,
        }
    })

@csrf_exempt
@require_POST
def forgot_password(request):
    email = request.POST.get("email", "").strip().lower()

    if not email:
        return JsonResponse(
            {
                "success": False,
                "message": "Please enter your email address."
            },
            status=400
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal whether an email is registered.
        return JsonResponse(
            {
                "success": True,
                "message": "If an account exists with this email, a password reset link has been sent."
            }
        )

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    reset_link = (
        "http://127.0.0.1:5500/login/pages/reset-password.html"
        f"?uid={uid}&token={token}"
    )

    subject = "FoodieHub Password Reset"

    message = f"""Hello {user.first_name or user.username},

We received a request to reset your FoodieHub password.

Click the link below to create a new password:

{reset_link}

If you did not request a password reset, you can safely ignore this email.

Thanks,
FoodieHub Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

    return JsonResponse(
        {
            "success": True,
            "message": "If an account exists with this email, a password reset link has been sent."
        }
    )

@csrf_exempt
@require_POST
def reset_password(request):
    uid = request.POST.get("uid", "").strip()
    token = request.POST.get("token", "").strip()
    new_password = request.POST.get("password", "")

    if not uid or not token or not new_password:
        return JsonResponse(
            {
                "success": False,
                "message": "Invalid password reset request."
            },
            status=400
        )

    try:
        uid_value = urlsafe_base64_decode(uid).decode()
        user = User.objects.get(pk=uid_value)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return JsonResponse(
            {
                "success": False,
                "message": "Invalid or expired reset link."
            },
            status=400
        )

    if not default_token_generator.check_token(user, token):
        return JsonResponse(
            {
                "success": False,
                "message": "Invalid or expired reset link."
            },
            status=400
        )

    try:
        validate_password(new_password, user=user)
    except ValidationError as error:
        return JsonResponse(
            {
                "success": False,
                "message": error.messages[0]
            },
            status=400
        )

    user.set_password(new_password)
    user.save()

    return JsonResponse(
        {
            "success": True,
            "message": "Password reset successfully."
        }
    )

def restaurant_list(request):
    return render(
        request,
        "restaurant/restaurants.html",
        {"restaurants": RESTAURANTS}
    )


def restaurant_details(request, restaurant_id):
    restaurant = next(
        (r for r in RESTAURANTS if r["id"] == restaurant_id),
        None
    )

    if restaurant is None:
        return render(
            request,
            "restaurant/restaurant-details.html",
            {"restaurant": None}
        )

    return render(
        request,
        "restaurant/restaurant-details.html",
        {"restaurant": restaurant}
    )


def reservation(request, restaurant_id):
    restaurant = next(
        (r for r in RESTAURANTS if r["id"] == restaurant_id),
        None
    )

    if restaurant is None:
        return render(
            request,
            "restaurant/restaurant-details.html",
            {"restaurant": None}
        )

    if request.method == "POST":
        reservation_data = {
            "name": request.POST.get("name"),
            "email": request.POST.get("email"),
            "phone": request.POST.get("phone"),
            "date": request.POST.get("date"),
            "time": request.POST.get("time"),
            "guests": request.POST.get("guests"),
            "restaurant": restaurant,
        }

        return render(
            request,
            "restaurant/confirmation.html",
            {"reservation": reservation_data}
        )

    return render(
        request,
        "restaurant/reservation.html",
        {"restaurant": restaurant}
    )
import hashlib
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import PushSubscription
from .vapid import ensure_vapid_keys


@require_GET
def push_public_key(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Login required."}, status=401)

    try:
        public_key, _ = ensure_vapid_keys()
    except Exception as exc:
        return JsonResponse({
            "success": False,
            "message": f"Web Push is not configured: {exc}",
        }, status=503)

    return JsonResponse({"success": True, "public_key": public_key})


@csrf_exempt
@require_POST
def push_subscribe(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Login required."}, status=401)

    try:
        data = json.loads(request.body or "{}")
        endpoint = str(data["endpoint"]).strip()
        keys = data.get("keys") or {}
        p256dh = str(keys["p256dh"]).strip()
        auth = str(keys["auth"]).strip()
    except (ValueError, KeyError, TypeError):
        return JsonResponse({"success": False, "message": "Invalid push subscription."}, status=400)

    if not endpoint or not p256dh or not auth:
        return JsonResponse({"success": False, "message": "Incomplete push subscription."}, status=400)

    endpoint_hash = hashlib.sha256(endpoint.encode("utf-8")).hexdigest()
    subscription, _ = PushSubscription.objects.update_or_create(
        endpoint_hash=endpoint_hash,
        defaults={
            "endpoint": endpoint,
            "user": request.user,
            "p256dh": p256dh,
            "auth": auth,
        },
    )
    return JsonResponse({"success": True, "subscription_id": subscription.id})


@csrf_exempt
@require_POST
def push_unsubscribe(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Login required."}, status=401)

    try:
        data = json.loads(request.body or "{}")
        endpoint = str(data["endpoint"]).strip()
    except (ValueError, KeyError, TypeError):
        return JsonResponse({"success": False, "message": "Invalid subscription."}, status=400)

    endpoint_hash = hashlib.sha256(endpoint.encode("utf-8")).hexdigest()
    PushSubscription.objects.filter(user=request.user, endpoint_hash=endpoint_hash).delete()
    return JsonResponse({"success": True})

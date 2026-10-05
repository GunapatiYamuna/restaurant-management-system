import json

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import PushSubscription


@require_GET
def push_public_key(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Login required."}, status=401)
    public_key = getattr(settings, "VAPID_PUBLIC_KEY", "")
    if not public_key:
        return JsonResponse({
            "success": False,
            "message": "Web Push is not configured on the server."
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

    subscription, _ = PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={
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

    PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
    return JsonResponse({"success": True})

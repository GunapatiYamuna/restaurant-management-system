import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
load_dotenv(BASE_DIR / ".env")


def _env(*names, default=""):
    for name in names:
        value = os.getenv(name)
        if value not in (None, ""):
            return value
    return default


def _env_bool(name, default=False):
    return _env(name, default=str(default)).strip().lower() in ("1", "true", "yes", "on")


FRONTEND_BASE_URL = _env("FRONTEND_BASE_URL", default="http://127.0.0.1:8000")
RESEND_API_KEY = _env("RESEND_API_KEY")
RESEND_FROM_EMAIL = _env("RESEND_FROM_EMAIL", default="onboarding@resend.dev")
GOOGLE_CLIENT_ID = _env("GOOGLE_CLIENT_ID")
RAZORPAY_KEY_ID = _env("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = _env("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = _env("RAZORPAY_WEBHOOK_SECRET")

# Free browser Web Push (VAPID). Keep the private key secret and never commit it.
VAPID_PUBLIC_KEY = _env("VAPID_PUBLIC_KEY")
VAPID_PRIVATE_KEY_B64 = _env("VAPID_PRIVATE_KEY_B64")
VAPID_PRIVATE_KEY_FILE = _env(
    "VAPID_PRIVATE_KEY_FILE",
    default=str(BASE_DIR / "vapid_private_key.pem"),
)
VAPID_CLAIMS_EMAIL = _env("VAPID_CLAIMS_EMAIL", default="mailto:admin@example.com")

SECRET_KEY = _env("DJANGO_SECRET_KEY", default="dev-only-change-me")
DEBUG = _env_bool("DJANGO_DEBUG", default=True)

# Allow the Railway-generated public domain automatically in production.
# DJANGO_ALLOWED_HOSTS can still be used for custom domains or local hosts.
_allowed_hosts = [
    host.strip()
    for host in _env(
        "DJANGO_ALLOWED_HOSTS",
        default="127.0.0.1,localhost,web-production-09472.up.railway.app",
    ).split(",")
    if host.strip()
]

# Railway may not expose RAILWAY_PUBLIC_DOMAIN to the application container,
# so keep the current public Railway domain explicitly allowed as well.
if "web-production-09472.up.railway.app" not in _allowed_hosts:
    _allowed_hosts.append("web-production-09472.up.railway.app")
railway_public_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN", "").strip()
if railway_public_domain and railway_public_domain not in _allowed_hosts:
    _allowed_hosts.append(railway_public_domain)
ALLOWED_HOSTS = _allowed_hosts

# Trust the Railway HTTPS origin automatically when Railway provides it.
_trusted_origins = [
    origin.strip()
    for origin in _env("DJANGO_CSRF_TRUSTED_ORIGINS").split(",")
    if origin.strip()
]
if railway_public_domain:
    railway_origin = f"https://{railway_public_domain}"
    if railway_origin not in _trusted_origins:
        _trusted_origins.append(railway_origin)
CSRF_TRUSTED_ORIGINS = _trusted_origins

# Keep local development behavior unchanged, but allow Railway to disable the
# public admin-registration endpoint without changing the frontend.
ALLOW_ADMIN_REGISTRATION = _env_bool(
    "ALLOW_ADMIN_REGISTRATION",
    default=DEBUG,
)
RUN_PUSH_SCHEDULER_IN_WEB = _env_bool(
    "RUN_PUSH_SCHEDULER_IN_WEB",
    default=DEBUG,
)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "restaurant",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "config.urls"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [PROJECT_ROOT / "frontend"],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {"default": {
    "ENGINE": "django.db.backends.mysql",
    "NAME": _env("MYSQL_DATABASE", "MYSQLDATABASE", default="foodiehub"),
    "USER": _env("MYSQL_USER", "MYSQLUSER", default="root"),
    "PASSWORD": _env("MYSQL_PASSWORD", "MYSQLPASSWORD", default=""),
    "HOST": _env("MYSQL_HOST", "MYSQLHOST", default="127.0.0.1"),
    "PORT": _env("MYSQL_PORT", "MYSQLPORT", default="3306"),
    "OPTIONS": {"charset": "utf8mb4"},
}}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Railway terminates HTTPS at its proxy. Preserve the original scheme for Django.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = not DEBUG

# Email configuration
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 465
EMAIL_USE_TLS = False
EMAIL_USE_SSL = True
EMAIL_TIMEOUT = 10
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_FROM_EMAIL = os.getenv("BREVO_FROM_EMAIL") or EMAIL_HOST_USER
BREVO_FROM_NAME = os.getenv("BREVO_FROM_NAME", "FoodieHub")

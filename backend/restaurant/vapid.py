import base64
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from django.conf import settings


def _public_key_string(public_key):
    raw_public = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    )
    return base64.urlsafe_b64encode(raw_public).rstrip(b"=").decode("ascii")


def _write_private_key_from_env(private_path):
    encoded = str(getattr(settings, "VAPID_PRIVATE_KEY_B64", "") or "").strip()
    if not encoded:
        return False
    try:
        private_pem = base64.b64decode(encoded)
    except Exception as exc:
        raise RuntimeError("VAPID_PRIVATE_KEY_B64 is not valid base64.") from exc
    private_path.parent.mkdir(parents=True, exist_ok=True)
    private_path.write_bytes(private_pem)
    return True


def ensure_vapid_keys():
    """Return (public_key, private_key_path), keeping the key pair stable in production."""
    private_path = Path(settings.VAPID_PRIVATE_KEY_FILE)
    public_path = private_path.with_name("vapid_public_key.pem")

    if not private_path.exists():
        _write_private_key_from_env(private_path)

    if not private_path.exists():
        from py_vapid import Vapid

        private_path.parent.mkdir(parents=True, exist_ok=True)
        vapid = Vapid()
        vapid.generate_keys()
        private_path.write_bytes(vapid.private_pem())
        public_path.write_bytes(vapid.public_pem())

    private_key = serialization.load_pem_private_key(
        private_path.read_bytes(),
        password=None,
    )
    derived_public = _public_key_string(private_key.public_key())

    configured_public = str(getattr(settings, "VAPID_PUBLIC_KEY", "") or "").strip().rstrip("=")
    if configured_public and configured_public != derived_public:
        raise RuntimeError(
            "VAPID_PUBLIC_KEY does not match the configured private key."
        )

    return derived_public, str(private_path)

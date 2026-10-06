from base64 import urlsafe_b64encode
from pathlib import Path

from django.conf import settings


def ensure_vapid_keys():
    """Return (public_key, private_key_path), creating a local key pair when needed."""
    private_path = Path(settings.VAPID_PRIVATE_KEY_FILE)
    public_path = private_path.with_name("vapid_public_key.pem")
    configured_public = str(getattr(settings, "VAPID_PUBLIC_KEY", "") or "").strip()

    if not private_path.exists():
        from py_vapid import Vapid

        private_path.parent.mkdir(parents=True, exist_ok=True)
        vapid = Vapid()
        vapid.generate_keys()
        private_path.write_bytes(vapid.private_pem())
        public_path.write_bytes(vapid.public_pem())
        raw_public = vapid.public_key.public_bytes(
            encoding=__import__("cryptography.hazmat.primitives.serialization", fromlist=["serialization"]).Encoding.X962,
            format=__import__("cryptography.hazmat.primitives.serialization", fromlist=["serialization"]).PublicFormat.UncompressedPoint,
        )
        return urlsafe_b64encode(raw_public).rstrip(b"=").decode("ascii"), str(private_path)

    if configured_public:
        return configured_public, str(private_path)

    if public_path.exists():
        from cryptography.hazmat.primitives import serialization

        public_key = serialization.load_pem_public_key(public_path.read_bytes())
        raw_public = public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint,
        )
        return urlsafe_b64encode(raw_public).rstrip(b"=").decode("ascii"), str(private_path)

    raise RuntimeError("VAPID public key is unavailable. Run generate_vapid_keys or configure VAPID_PUBLIC_KEY.")

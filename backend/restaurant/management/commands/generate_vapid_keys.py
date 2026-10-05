from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from py_vapid import Vapid
from py_vapid.utils import b64urlencode
from cryptography.hazmat.primitives import serialization


class Command(BaseCommand):
    help = "Generate a VAPID key pair for free browser Web Push."

    def handle(self, *args, **options):
        private_path = Path(settings.VAPID_PRIVATE_KEY_FILE)
        public_path = private_path.with_name("vapid_public_key.pem")

        if private_path.exists():
            self.stdout.write(self.style.WARNING(f"Private key already exists: {private_path}"))
            self.stdout.write("Delete it first only if you intentionally want to replace all existing subscriptions.")
            return

        vapid = Vapid()
        vapid.generate_keys()
        private_path.parent.mkdir(parents=True, exist_ok=True)
        private_path.write_bytes(vapid.private_pem())
        public_path.write_bytes(vapid.public_pem())

        raw_public = vapid.public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint,
        )
        public_key = b64urlencode(raw_public).decode("ascii")

        self.stdout.write(self.style.SUCCESS("VAPID keys generated."))
        self.stdout.write(f"Private key: {private_path}")
        self.stdout.write(f"Public key: {public_key}")
        self.stdout.write("")
        self.stdout.write("Add this to backend/.env:")
        self.stdout.write(f"VAPID_PUBLIC_KEY={public_key}")
        self.stdout.write("VAPID_CLAIMS_EMAIL=mailto:your-email@example.com")

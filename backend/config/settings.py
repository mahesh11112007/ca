import os
import base64
from dotenv import load_dotenv

load_dotenv()

def check_and_generate_vapid():
    """Ensure VAPID keys exist. Generate and write to .env if missing."""
    if os.environ.get("VAPID_PUBLIC_KEY") and os.environ.get("VAPID_PRIVATE_KEY"):
        return

    try:
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.primitives import serialization

        private_key = ec.generate_private_key(ec.SECP256R1())
        private_bytes = private_key.private_numbers().private_value.to_bytes(32, byteorder='big')
        public_bytes = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )
        public_key_b64 = base64.urlsafe_b64encode(public_bytes).decode('utf-8').rstrip('=')
        private_key_b64 = base64.urlsafe_b64encode(private_bytes).decode('utf-8').rstrip('=')

        # Try to save to local .env
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                content = f.read()
            if 'VAPID_PUBLIC_KEY' not in content:
                with open(env_path, 'a') as f:
                    f.write(f"\n# Auto-generated Web Push VAPID keys\n")
                    f.write(f"VAPID_PUBLIC_KEY={public_key_b64}\n")
                    f.write(f"VAPID_PRIVATE_KEY={private_key_b64}\n")
                    f.write(f"VAPID_CLAIM_EMAIL=mailto:support@caledger.com\n")
                
                os.environ["VAPID_PUBLIC_KEY"] = public_key_b64
                os.environ["VAPID_PRIVATE_KEY"] = private_key_b64
                os.environ["VAPID_CLAIM_EMAIL"] = "mailto:support@caledger.com"
                print("Generated persistent VAPID keys and updated local .env file.")
                return

        # Fallback to in-memory keys
        os.environ["VAPID_PUBLIC_KEY"] = public_key_b64
        os.environ["VAPID_PRIVATE_KEY"] = private_key_b64
        os.environ["VAPID_CLAIM_EMAIL"] = "mailto:support@caledger.com"
        print("Generated in-memory VAPID keys.")
    except Exception as e:
        print(f"Failed to auto-generate VAPID keys: {e}")


# Run generator
check_and_generate_vapid()

_settings = None


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self):
        self.DATABASE_URL = os.environ.get("DATABASE_URL")
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL environment variable is required")

        self.JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
        if not self.JWT_SECRET_KEY:
            raise ValueError("JWT_SECRET_KEY environment variable is required")

        self.JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
        self.JWT_EXPIRATION_MINUTES = int(
            os.environ.get("JWT_EXPIRATION_MINUTES", "1440")
        )

        cors_origins_str = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
        self.CORS_ORIGINS = [
            origin.strip() for origin in cors_origins_str.split(",") if origin.strip()
        ]

        self.VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY")
        self.VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY")
        self.VAPID_CLAIM_EMAIL = os.environ.get("VAPID_CLAIM_EMAIL", "mailto:support@caledger.com")


def get_settings() -> Settings:
    """Return cached settings instance (singleton)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

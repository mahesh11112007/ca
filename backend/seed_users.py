import os
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from database.connection import get_db
from database.init_db import init_db
from models.user import User
from werkzeug.security import generate_password_hash, check_password_hash

def seed_users():
    init_db()
    db = get_db()
    users_to_add = [
        {"username": "Mahesh", "password_raw": "1234567", "role": "Receiver"},
        {"username": "Vignesh", "password_raw": "123456", "role": "Sender"},
        {"username": "Shiva", "password_raw": "123456", "role": "Sender"},
    ]

    for user_data in users_to_add:
        # Check if user already exists
        existing = db.query(User).filter(User.username == user_data["username"]).first()
        
        # If Mahesh exists with the old password, delete and recreate them
        if existing and user_data["username"] == "Mahesh":
            if check_password_hash(existing.password_hash, "123456"):
                print("Found old Mahesh (password 123456). Deleting to recreate with password 1234567...")
                # To preserve their QR code and other fields, we can also just update the password_hash!
                # Wait! The user says "add new user Mahesh with password 1234567 and remove old Mahesh".
                # Deleting and recreating is exactly what they asked.
                # However, updating the password_hash is cleaner, but let's delete to satisfy "remove old Mahesh"
                # while resetting everything, or we can just update password. Let's do exactly what they asked: delete and recreate.
                db.delete(existing)
                db.commit()
                existing = None
            elif not check_password_hash(existing.password_hash, "1234567"):
                # If they have some other password, make sure it's updated to 1234567
                existing.password_hash = generate_password_hash("1234567")
                db.commit()
                print("Updated Mahesh password to 1234567.")

        if not existing:
            new_user = User(
                username=user_data["username"],
                password_hash=generate_password_hash(user_data["password_raw"]),
                role=user_data["role"]
            )
            db.add(new_user)
            print(f"Created user: {user_data['username']} ({user_data['role']})")
        else:
            print(f"User already exists: {user_data['username']}")

    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_users()

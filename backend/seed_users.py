import os
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from database.connection import get_db
from database.init_db import init_db
from models.user import User
from werkzeug.security import generate_password_hash

def seed_users():
    init_db()
    db = get_db()
    users_to_add = [
        {"username": "Mahesh", "password_raw": "123456", "role": "Receiver"},
        {"username": "Vignesh", "password_raw": "123456", "role": "Sender"},
        {"username": "Shiva", "password_raw": "123456", "role": "Sender"},
    ]

    for user_data in users_to_add:
        # Check if user already exists
        existing = db.query(User).filter(User.username == user_data["username"]).first()
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

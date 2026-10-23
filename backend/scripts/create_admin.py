import sys
import os
import argparse
import getpass
import re

# Ensure workspace root is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
workspace_root = os.path.dirname(os.path.dirname(current_dir))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

from backend.app.core.config import settings
from backend.app.db.session import SessionLocal, Base, engine
from backend.app.models.models import User, Profile
from backend.app.core.security import hash_password

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def setup_admin(email: str, password: str, name: str = "System Administrator", force: bool = False, db = None):
    should_close = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        should_close = True
    try:
        clean_email = email.strip().lower()
        if not EMAIL_REGEX.match(clean_email):
            print(f"[ERROR] Invalid email address format: {email}")
            return False

        if len(password) < 8:
            print("[ERROR] Password must be at least 8 characters long.")
            return False

        existing = db.query(User).filter(User.email == clean_email).first()
        if existing:
            if existing.role == "admin" and not force:
                print(f"[INFO] Administrator account '{clean_email}' already exists.")
                print("      Password was NOT modified to preserve security. (Use --force to overwrite)")
                return True
            else:
                existing.role = "admin"
                existing.display_name = name or existing.display_name
                existing.hashed_password = hash_password(password)
                existing.is_active = True
                
                # Sync profile
                profile = db.query(Profile).filter(Profile.id == existing.id).first()
                if profile:
                    profile.role = "admin"
                    profile.display_name = existing.display_name
                else:
                    db.add(Profile(id=existing.id, display_name=existing.display_name, role="admin"))

                db.commit()
                print(f"[SUCCESS] User '{clean_email}' has been successfully promoted to Administrator.")
                return True
        else:
            new_admin = User(
                email=clean_email,
                hashed_password=hash_password(password),
                display_name=name or "System Administrator",
                role="admin",
                is_active=True
            )
            db.add(new_admin)

            new_profile = Profile(
                id=new_admin.id,
                display_name=new_admin.display_name,
                role="admin"
            )
            db.add(new_profile)
            db.commit()
            print(f"[SUCCESS] Initial Administrator account '{clean_email}' created successfully.")
            return True
    finally:
        if should_close:
            db.close()

def main():
    parser = argparse.ArgumentParser(description="Securely create or promote the initial LakeClean Mission Control Administrator.")
    parser.add_argument("--email", type=str, help="Administrator email address (or set INITIAL_ADMIN_EMAIL env)")
    parser.add_argument("--password", type=str, help="Administrator password (or set INITIAL_ADMIN_PASSWORD env)")
    parser.add_argument("--name", type=str, default="System Administrator", help="Display name for the administrator")
    parser.add_argument("--force", action="store_true", help="Force update password if admin already exists")

    args = parser.parse_args()

    email = args.email or os.getenv("INITIAL_ADMIN_EMAIL") or settings.INITIAL_ADMIN_EMAIL
    password = args.password or os.getenv("INITIAL_ADMIN_PASSWORD") or settings.INITIAL_ADMIN_PASSWORD
    name = args.name or os.getenv("INITIAL_ADMIN_NAME") or settings.INITIAL_ADMIN_NAME or "System Administrator"

    # Interactive prompt if running in a terminal and credentials not supplied
    if not email:
        if sys.stdin.isatty():
            try:
                email = input("Enter Administrator Email: ").strip()
            except (KeyboardInterrupt, EOFError):
                print("\nAborted.")
                sys.exit(1)
        else:
            print("[ERROR] Email is required. Supply via --email or INITIAL_ADMIN_EMAIL environment variable.")
            sys.exit(1)

    if not password:
        if sys.stdin.isatty():
            try:
                password = getpass.getpass("Enter Administrator Password (min 8 characters): ").strip()
                confirm = getpass.getpass("Confirm Administrator Password: ").strip()
                if password != confirm:
                    print("[ERROR] Passwords do not match.")
                    sys.exit(1)
            except (KeyboardInterrupt, EOFError):
                print("\nAborted.")
                sys.exit(1)
        else:
            print("[ERROR] Password is required. Supply via --password or INITIAL_ADMIN_PASSWORD environment variable.")
            sys.exit(1)

    success = setup_admin(email=email, password=password, name=name, force=args.force)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()

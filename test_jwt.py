import sys
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "backend")
sys.path.insert(0, backend_dir)

from app.services.security import create_access_token, get_current_user, get_password_hash, verify_password
from app.core.config import settings

token = create_access_token({"sub": "test@example.com", "role": "user"})
print("Token:", token)

from jose import jwt
payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
print("Payload:", payload)

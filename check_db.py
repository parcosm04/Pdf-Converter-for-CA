import sys
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqlite:///backend/test.db")
Session = sessionmaker(bind=engine)
session = Session()

from backend.app.models.models import User
users = session.query(User).all()
print("Users in DB:", len(users))
for u in users:
    print(u.email, u.is_active)

import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup path so tests can run
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import get_db
from app.models.models import Base
from main import app

# Setup test database (in-memory sqlite)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_api.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override database session dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create testing client
client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    # Clean up test database file if created
    if os.path.exists("./test_api.db"):
        os.remove("./test_api.db")

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_auth_and_register():
    # 1. Register a new user
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"email": "tester@example.com", "password": "securepassword123"}
    )
    assert reg_response.status_code == 201
    assert reg_response.json()["email"] == "tester@example.com"
    
    # 2. Duplicate registration should fail
    dup_response = client.post(
        "/api/v1/auth/register",
        json={"email": "tester@example.com", "password": "anotherpassword"}
    )
    assert dup_response.status_code == 400
    
    # 3. Login with correct credentials
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "tester@example.com", "password": "securepassword123"}
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    
    # 4. Access protected profile route with token
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_response = client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "tester@example.com"

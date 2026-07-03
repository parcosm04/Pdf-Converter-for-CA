import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "backend")
sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from backend.main import app
import uuid

def run_tests():
    with TestClient(app) as client:
        test_email = f"test_{uuid.uuid4().hex[:6]}@example.com"
        print(f"Testing /api/v1/auth/register with {test_email}...")
        res = client.post("/api/v1/auth/register", json={"email": test_email, "password": "password123"})
        print("Register response:", res.status_code, res.text)
        
        print("\nTesting /api/v1/auth/login...")
        res = client.post("/api/v1/auth/login", data={"username": test_email, "password": "password123"})
        print("Login response:", res.status_code, res.text)
        if res.status_code == 200:
            token = res.json()["access_token"]
            print("\nTesting /api/v1/auth/me...")
            res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
            print("Me response:", res_me.status_code, res_me.text)

if __name__ == "__main__":
    run_tests()

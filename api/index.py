import sys
import os

# Add backend directory and root to sys.path for serverless execution
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

for path in [root_dir, backend_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

from backend.main import app

# Export ASGI app for Vercel / serverless runtime
__all__ = ["app"]

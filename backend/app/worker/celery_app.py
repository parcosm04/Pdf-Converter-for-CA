from celery import Celery
import os

from app.core.config import settings

# Initialize Celery app instance with Redis broker and backend storage URLs
celery_app = Celery(
    "ubsp_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Configure Celery tasks behavior
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    imports=["app.worker.tasks"]  # Explicitly import tasks module
)

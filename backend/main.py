import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

# Add current backend dir and parser path to sys.path so all imports resolve correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
parser_dir = os.path.abspath(os.path.join(current_dir, "app", "services", "parser"))
if parser_dir not in sys.path:
    sys.path.insert(0, parser_dir)


startup_error = None
try:
    from app.core.config import settings
    from app.core.database import engine
    from app.models.models import Base
    from app.api import auth, jobs

    # Create database tables automatically if using a local sqlite engine (useful for tests/quick dev)
    if settings.DATABASE_URL.startswith("sqlite"):
        logger.info("Initializing sqlite database tables...")
        Base.metadata.create_all(bind=engine)

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.PROJECT_VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )

    # CORS Policy configuration
    origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    extra_origins = os.getenv("BACKEND_CORS_ORIGINS")
    if extra_origins:
        origins.extend([o.strip() for o in extra_origins.split(",") if o.strip()])

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex="https://.*\\.vercel\\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include endpoint modules
    app.include_router(auth.router, prefix=settings.API_V1_STR)
    app.include_router(jobs.router, prefix=settings.API_V1_STR)

    @app.get("/")
    def root_endpoint():
        """
        Service health check endpoint.
        """
        return {
            "status": "online",
            "service": settings.APP_NAME,
            "version": settings.PROJECT_VERSION
        }

except Exception as e:
    import traceback
    startup_error = traceback.format_exc()
    logger.error(f"FastAPI Startup Error: {startup_error}")
    
    # Raw ASGI fallback application to guarantee error output without FastAPI routing overhead
    async def app(scope, receive, send):
        if scope['type'] == 'http':
            # Handle OPTIONS preflight request
            if scope.get('method') == 'OPTIONS':
                await send({
                    'type': 'http.response.start',
                    'status': 200,
                    'headers': [
                        (b'access-control-allow-origin', b'*'),
                        (b'access-control-allow-methods', b'GET, POST, PUT, DELETE, OPTIONS'),
                        (b'access-control-allow-headers', b'content-type, authorization'),
                        (b'access-control-max-age', b'86400'),
                    ]
                })
                await send({
                    'type': 'http.response.body',
                    'body': b'',
                    'more_body': False
                })
                return

            await send({
                'type': 'http.response.start',
                'status': 200,
                'headers': [
                    (b'content-type', b'application/json'),
                    (b'access-control-allow-origin', b'*'),
                    (b'access-control-allow-methods', b'GET, POST, PUT, DELETE, OPTIONS'),
                    (b'access-control-allow-headers', b'content-type, authorization'),
                ]
            })
            import json
            err_data = {
                "status": "error",
                "message": "FastAPI failed to start up on Vercel.",
                "error_details": str(e),
                "traceback": startup_error.split("\n")
            }
            await send({
                'type': 'http.response.body',
                'body': json.dumps(err_data).encode('utf-8'),
                'more_body': False
            })






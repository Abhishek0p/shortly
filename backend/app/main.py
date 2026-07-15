from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import connect_db, close_db
from app.cache import connect_redis, close_redis
from app.routes.shorten import router as shorten_router
from app.routes.analytics import router as analytics_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    await connect_redis()
    yield
    # Shutdown
    await close_db()
    await close_redis()


app = FastAPI(
    title="URL Shortener API",
    description="A production-grade URL shortener with analytics powered by FastAPI + MongoDB + Redis",
    version="1.0.0",
    lifespan=lifespan,
)

# Build allowed origins list — covers localhost dev, Vercel, and Render preview deployments
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
# Add the configured frontend URL if set (e.g. https://shortly-abc.vercel.app)
if settings.frontend_url and "localhost" not in settings.frontend_url:
    allowed_origins.append(settings.frontend_url)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.+\.(vercel\.app|onrender\.com)",  # covers preview deploys too
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers — analytics first so /api/* routes don't clash with /{code} catch-all
app.include_router(analytics_router)
app.include_router(shorten_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "URL Shortener API is running 🚀"}

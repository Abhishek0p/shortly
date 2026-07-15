import random
import string
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Request, HTTPException, Header
from fastapi.responses import RedirectResponse
import json

from app.database import get_db
from app.cache import cache_get, cache_set, cache_delete, check_rate_limit
from app.models import ShortenRequest, ShortenResponse
from app.config import settings
from app.auth import get_current_user
from fastapi import Depends

router = APIRouter()

def generate_code(length: int = 6) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))

@router.post("/api/shorten", response_model=ShortenResponse)
async def shorten_url(
    body: ShortenRequest,
    request: Request,
    user_id: str = Depends(get_current_user),
):
    ip = request.client.host

    # Rate limit: 10 requests per minute per IP
    allowed = await check_rate_limit(ip, settings.rate_limit_requests, settings.rate_limit_window)
    if not allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again in a minute.")

    db = get_db()

    # Validate URL
    if not body.url.startswith(("http://", "https://")):
        body.url = "https://" + body.url

    # Generate or validate custom code
    if body.custom_code:
        code = body.custom_code.strip()
        existing = await db.links.find_one({"code": code})
        if existing:
            raise HTTPException(status_code=409, detail="Custom code already in use.")
    else:
        for _ in range(5):
            code = generate_code()
            if not await db.links.find_one({"code": code}):
                break

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=body.expires_in_days) if body.expires_in_days else None

    doc = {
        "code": code,
        "original_url": body.url,
        "title": body.title or "",
        "created_at": now,
        "expires_at": expires_at,
        "total_clicks": 0,
        "created_by_ip": ip,
        "user_id": user_id,
    }
    await db.links.insert_one(doc)

    short_url = f"{settings.base_url}/{code}"

    # Cache it
    await cache_set(f"url:{code}", body.url, ttl=86400)

    return ShortenResponse(
        code=code,
        short_url=short_url,
        original_url=body.url,
        title=body.title,
        created_at=now,
        expires_at=expires_at,
        total_clicks=0,
    )


@router.get("/api/links")
async def get_all_links(request: Request, skip: int = 0, limit: int = 20, user_id: str = Depends(get_current_user)):
    """Get all shortened links for the user (paginated)."""
    db = get_db()
    cursor = db.links.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    links = await cursor.to_list(length=limit)
    total = await db.links.count_documents({"user_id": user_id})

    for link in links:
        if link.get("created_at"):
            link["created_at"] = link["created_at"].isoformat()
        if link.get("expires_at"):
            link["expires_at"] = link["expires_at"].isoformat()
        link["short_url"] = f"{settings.base_url}/{link['code']}"

    return {"links": links, "total": total, "skip": skip, "limit": limit}


@router.get("/{code}")
async def redirect_url(code: str, request: Request):
    """Redirect short code to original URL and track click."""
    # Check cache first
    cached_url = await cache_get(f"url:{code}")

    db = get_db()

    if cached_url:
        original_url = cached_url
    else:
        link = await db.links.find_one({"code": code})
        if not link:
            raise HTTPException(status_code=404, detail="Short link not found.")

        # Check expiry
        if link.get("expires_at") and datetime.now(timezone.utc) > link["expires_at"]:
            raise HTTPException(status_code=410, detail="This link has expired.")

        original_url = link["original_url"]
        await cache_set(f"url:{code}", original_url, ttl=86400)

    # Track the click asynchronously
    try:
        from app.routes.analytics import record_click
        await record_click(code, request, db)
    except Exception:
        pass  # Don't block redirect on analytics failure

    return RedirectResponse(url=original_url, status_code=302)

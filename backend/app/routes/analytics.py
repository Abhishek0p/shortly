from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request
from collections import defaultdict
import user_agents

from app.database import get_db
from app.cache import cache_get, cache_set
from app.auth import get_current_user
from fastapi import Depends

router = APIRouter()


async def record_click(code: str, request: Request, db):
    """Record a click event for analytics."""
    ua_string = request.headers.get("user-agent", "")
    ua = user_agents.parse(ua_string)

    referrer = request.headers.get("referer", "Direct")
    if not referrer:
        referrer = "Direct"

    click_doc = {
        "code": code,
        "ip": request.client.host,
        "referrer": referrer,
        "user_agent": ua_string,
        "device": "Mobile" if ua.is_mobile else ("Tablet" if ua.is_tablet else "Desktop"),
        "browser": ua.browser.family or "Unknown",
        "os": ua.os.family or "Unknown",
        "clicked_at": datetime.now(timezone.utc),
    }
    await db.clicks.insert_one(click_doc)

    # Increment click counter on the link document
    await db.links.update_one({"code": code}, {"$inc": {"total_clicks": 1}})

    # Invalidate analytics cache
    await cache_set(f"analytics:{code}", "", ttl=1)


@router.get("/api/analytics/{code}")
async def get_analytics(code: str, user_id: str = Depends(get_current_user)):
    """Get analytics for a specific short link."""
    # Try cache
    cached = await cache_get(f"analytics:{code}")
    if cached and len(cached) > 5:
        import json
        return json.loads(cached)

    db = get_db()
    link = await db.links.find_one({"code": code, "user_id": user_id}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Link not found.")

    # All clicks for this code
    clicks_cursor = db.clicks.find({"code": code}, {"_id": 0})
    all_clicks = await clicks_cursor.to_list(length=10000)

    # Clicks by day (last 30 days)
    clicks_by_day: dict = defaultdict(int)
    clicks_by_device: dict = defaultdict(int)
    clicks_by_browser: dict = defaultdict(int)

    for click in all_clicks:
        day = click["clicked_at"].strftime("%Y-%m-%d")
        clicks_by_day[day] += 1
        clicks_by_device[click.get("device", "Unknown")] += 1
        clicks_by_browser[click.get("browser", "Unknown")] += 1

    # Recent 10 clicks
    recent_cursor = db.clicks.find({"code": code}, {"_id": 0}).sort("clicked_at", -1).limit(10)
    recent = await recent_cursor.to_list(length=10)
    for r in recent:
        r["clicked_at"] = r["clicked_at"].isoformat()

    result = {
        "code": code,
        "original_url": link["original_url"],
        "title": link.get("title", ""),
        "total_clicks": link.get("total_clicks", 0),
        "created_at": link["created_at"].isoformat(),
        "short_url": link.get("short_url", ""),
        "clicks_by_day": [{"date": k, "clicks": v} for k, v in sorted(clicks_by_day.items())],
        "clicks_by_device": [{"device": k, "clicks": v} for k, v in clicks_by_device.items()],
        "clicks_by_browser": [{"browser": k, "clicks": v} for k, v in clicks_by_browser.items()],
        "recent_clicks": recent,
    }

    # Cache for 5 minutes
    import json
    await cache_set(f"analytics:{code}", json.dumps(result), ttl=300)

    return result


@router.get("/api/stats")
async def get_global_stats(user_id: str = Depends(get_current_user)):
    """Get global statistics for the user dashboard."""
    db = get_db()
    total_links = await db.links.count_documents({"user_id": user_id})
    # For total clicks we might want to aggregate across all links of this user
    # But since we update `total_clicks` on the link document itself, we can sum it up
    pipeline = [{"$match": {"user_id": user_id}}, {"$group": {"_id": None, "total": {"$sum": "$total_clicks"}}}]
    result = await db.links.aggregate(pipeline).to_list(1)
    total_clicks = result[0]["total"] if result else 0

    # Links created today
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    links_today = await db.links.count_documents({"user_id": user_id, "created_at": {"$gte": today}})
    
    # Fast approach for clicks today across user's links
    user_links = await db.links.find({"user_id": user_id}, {"code": 1}).to_list(None)
    user_codes = [l["code"] for l in user_links]
    clicks_today = await db.clicks.count_documents({"code": {"$in": user_codes}, "clicked_at": {"$gte": today}})

    return {
        "total_links": total_links,
        "total_clicks": total_clicks,
        "links_today": links_today,
        "clicks_today": clicks_today,
    }

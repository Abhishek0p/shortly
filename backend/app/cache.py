import redis.asyncio as aioredis
from app.config import settings

redis_client: aioredis.Redis = None

async def connect_redis():
    global redis_client
    redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    await redis_client.ping()
    print("[OK] Connected to Redis")

async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()

def get_redis() -> aioredis.Redis:
    return redis_client

# --- Cache helpers ---

async def cache_get(key: str) -> str | None:
    return await redis_client.get(key)

async def cache_set(key: str, value: str, ttl: int = 3600):
    await redis_client.setex(key, ttl, value)

async def cache_delete(key: str):
    await redis_client.delete(key)

# --- Rate limiting ---

async def check_rate_limit(ip: str, limit: int, window: int) -> bool:
    """Returns True if request is allowed, False if rate limited."""
    key = f"rate:{ip}"
    count = await redis_client.get(key)
    if count is None:
        await redis_client.setex(key, window, 1)
        return True
    if int(count) >= limit:
        return False
    await redis_client.incr(key)
    return True

async def get_rate_limit_remaining(ip: str, limit: int) -> int:
    key = f"rate:{ip}"
    count = await redis_client.get(key)
    if count is None:
        return limit
    return max(0, limit - int(count))

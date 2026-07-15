from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.db_name]
    # Create indexes
    await db.links.create_index("code", unique=True)
    await db.links.create_index("created_at")
    await db.clicks.create_index("code")
    await db.clicks.create_index("clicked_at")
    print("[OK] Connected to MongoDB")

async def close_db():
    global client
    if client:
        client.close()
        print("[CLOSED] MongoDB connection closed")

def get_db():
    return db

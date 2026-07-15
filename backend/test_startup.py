import asyncio
from app.main import lifespan, app

async def test():
    try:
        async with lifespan(app):
            print('Success! Connected to DB.')
    except Exception as e:
        print(f"Error during startup: {type(e).__name__} - {e}")

asyncio.run(test())

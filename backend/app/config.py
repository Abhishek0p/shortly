from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    db_name: str = "url_shortener"
    redis_url: str = "redis://localhost:6379"
    base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"
    api_key: str = "dev-secret-key-change-in-production"
    rate_limit_requests: int = 10
    rate_limit_window: int = 60
    
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_jwt_secret: str = ""

    class Config:
        env_file = ".env"

settings = Settings()

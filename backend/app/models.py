from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
from datetime import datetime

class ShortenRequest(BaseModel):
    url: str
    custom_code: Optional[str] = None
    title: Optional[str] = None
    expires_in_days: Optional[int] = None

class ShortenResponse(BaseModel):
    code: str
    short_url: str
    original_url: str
    title: Optional[str]
    created_at: datetime
    expires_at: Optional[datetime]
    total_clicks: int = 0

class ClickRecord(BaseModel):
    code: str
    ip: str
    referrer: Optional[str]
    user_agent: str
    device: str
    browser: str
    os: str
    country: Optional[str]
    clicked_at: datetime

class AnalyticsResponse(BaseModel):
    code: str
    original_url: str
    title: Optional[str]
    total_clicks: int
    created_at: datetime
    clicks_by_day: list[dict]
    clicks_by_device: list[dict]
    clicks_by_browser: list[dict]
    recent_clicks: list[dict]

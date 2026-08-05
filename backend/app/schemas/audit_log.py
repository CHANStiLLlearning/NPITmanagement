from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AuditLogOut(BaseModel):
    id: int
    user_email: str
    user_name: Optional[str]
    action: str
    module: str
    details: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

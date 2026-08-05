from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id           = Column(Integer, primary_key=True, index=True)
    user_email   = Column(String(200), nullable=False, index=True)
    user_name    = Column(String(200), nullable=True)
    action       = Column(String(50), nullable=False, index=True)   # login, logout, create, update, delete, export
    module       = Column(String(100), nullable=False, index=True)  # Auth, Students, Teachers, Attendance, Scores, etc.
    details      = Column(Text, nullable=True)
    ip_address   = Column(String(50), nullable=True)
    timestamp    = Column(DateTime, default=datetime.utcnow, index=True)

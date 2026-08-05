from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import date, datetime
from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    user_email: str,
    action: str,
    module: str,
    user_name: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Helper to log any system event."""
    log = AuditLog(
        user_email=user_email,
        user_name=user_name or user_email,
        action=action.lower(),
        module=module,
        details=details,
        ip_address=ip_address or "127.0.0.1",
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_audit_logs(
    db: Session,
    action: Optional[str] = None,
    module: Optional[str] = None,
    user_email: Optional[str] = None,
    search: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 200,
) -> list[AuditLog]:
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action.lower())
    if module:
        q = q.filter(AuditLog.module == module)
    if user_email:
        q = q.filter(AuditLog.user_email == user_email)
    if from_date:
        q = q.filter(AuditLog.timestamp >= from_date)
    if to_date:
        q = q.filter(AuditLog.timestamp <= to_date)
    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                AuditLog.user_email.ilike(term),
                AuditLog.user_name.ilike(term),
                AuditLog.details.ilike(term),
                AuditLog.ip_address.ilike(term),
                AuditLog.module.ilike(term),
            )
        )
    return q.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

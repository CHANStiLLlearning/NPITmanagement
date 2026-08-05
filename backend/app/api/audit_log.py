import io
import csv
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.audit_log import AuditLogOut
from app.crud.audit_log import get_audit_logs, log_action
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[AuditLogOut])
def list_system_logs(
    action: Optional[str] = None,
    module: Optional[str] = None,
    user_email: Optional[str] = None,
    search: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_audit_logs(
        db,
        action=action,
        module=module,
        user_email=user_email,
        search=search,
        from_date=from_date,
        to_date=to_date,
        skip=skip,
        limit=limit,
    )


@router.get("/export/csv")
def export_audit_logs_csv(
    action: Optional[str] = None,
    module: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    logs = get_audit_logs(db, action=action, module=module, search=search, limit=5000)

    # Log the export action itself!
    log_action(
        db,
        user_email=current_user.email,
        user_name=f"{current_user.first_name or ''} {current_user.last_name or ''}".strip(),
        action="export",
        module="Audit Log",
        details="Exported audit logs to CSV",
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "User Email", "User Name", "Action", "Module", "IP Address", "Details"])
    for l in logs:
        writer.writerow([
            l.id,
            l.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            l.user_email,
            l.user_name,
            l.action.upper(),
            l.module,
            l.ip_address,
            l.details,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=system_audit_logs.csv"},
    )

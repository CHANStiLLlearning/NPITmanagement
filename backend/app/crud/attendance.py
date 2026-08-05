from datetime import datetime, date, time as time_type
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from app.models.attendance import AttendanceRecord, AttendanceStatus
from app.models.student import Student
from app.schemas.attendance import ScanRequest, AttendanceCreate, AttendanceUpdate, AttendanceOut, ScanResponse


def get_today_record(db: Session, student_sid: str, today: date) -> AttendanceRecord | None:
    """Check if student already has a record today."""
    return db.query(AttendanceRecord).filter(
        AttendanceRecord.student_sid == student_sid,
        AttendanceRecord.date == today,
    ).first()


def scan_qr(db: Session, request: ScanRequest, scanned_by: str) -> ScanResponse:
    """Core scan logic: resolve student → check duplicate → determine status → save."""
    student = db.query(Student).filter(Student.student_id == request.student_sid).first()
    if not student:
        return ScanResponse(success=False, message=f"Student '{request.student_sid}' not found.", duplicate=False)

    today = datetime.utcnow().date()
    now   = datetime.utcnow().time()

    # Duplicate prevention
    existing = get_today_record(db, request.student_sid, today)
    if existing:
        return ScanResponse(
            success=False,
            message=f"{student.first_name} {student.last_name} already marked {existing.status.value} today.",
            record=AttendanceOut.model_validate(existing),
            duplicate=True,
        )

    # Late detection
    status = AttendanceStatus.present
    if request.late_after:
        h, m = map(int, request.late_after.split(":"))
        cutoff = time_type(h, m)
        if now > cutoff:
            status = AttendanceStatus.late

    record = AttendanceRecord(
        student_id   = student.id,
        student_sid  = student.student_id,
        student_name = f"{student.first_name} {student.last_name}",
        class_name   = request.class_name or student.class_name,
        section      = student.section,
        date         = today,
        time_in      = now,
        status       = status,
        scanned_by   = scanned_by,
        scan_method  = "qr",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    label = "on time" if status == AttendanceStatus.present else "late"
    return ScanResponse(
        success=True,
        message=f"✓ {student.first_name} {student.last_name} marked {label}.",
        record=AttendanceOut.model_validate(record),
        duplicate=False,
    )


def get_records(
    db: Session,
    date_filter: Optional[date] = None,
    class_name: Optional[str] = None,
    status: Optional[str] = None,
    student_sid: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
) -> list[AttendanceRecord]:
    query = db.query(AttendanceRecord)
    if date_filter:
        query = query.filter(AttendanceRecord.date == date_filter)
    if class_name:
        query = query.filter(AttendanceRecord.class_name == class_name)
    if status:
        query = query.filter(AttendanceRecord.status == status)
    if student_sid:
        query = query.filter(AttendanceRecord.student_sid == student_sid)
    return query.order_by(AttendanceRecord.created_at.desc()).offset(skip).limit(limit).all()


def get_analytics(db: Session, from_date: Optional[date] = None, to_date: Optional[date] = None) -> dict:
    query = db.query(AttendanceRecord)
    if from_date:
        query = query.filter(AttendanceRecord.date >= from_date)
    if to_date:
        query = query.filter(AttendanceRecord.date <= to_date)

    total   = query.count()
    present = query.filter(AttendanceRecord.status == "present").count()
    late    = query.filter(AttendanceRecord.status == "late").count()
    absent  = query.filter(AttendanceRecord.status == "absent").count()
    excused = query.filter(AttendanceRecord.status == "excused").count()

    # Daily trend (last 7 days)
    daily = (
        db.query(AttendanceRecord.date, func.count().label("count"))
        .group_by(AttendanceRecord.date)
        .order_by(AttendanceRecord.date.desc())
        .limit(7)
        .all()
    )

    return {
        "total": total,
        "present": present,
        "late": late,
        "absent": absent,
        "excused": excused,
        "rate": round(((present + late) / total * 100), 1) if total else 0,
        "daily_trend": [{"date": str(d.date), "count": d.count} for d in reversed(daily)],
    }


def update_record(db: Session, record: AttendanceRecord, data: AttendanceUpdate) -> AttendanceRecord:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(record, k, v)
    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record: AttendanceRecord):
    db.delete(record)
    db.commit()

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


def auto_mark_absents(db: Session, target_date: date) -> int:
    """
    Auto-mark active students absent if they haven't scanned on a school day.
    Friday (weekday 4) and Sunday (weekday 6) are EXEMPT (off days / weekends).
    Future dates are NEVER marked absent.
    """
    today_local = datetime.now().date()
    if target_date > today_local:
        return 0

    # 4 = Friday, 6 = Sunday
    if target_date.weekday() in (4, 6):
        return 0

    active_students = db.query(Student).filter(Student.is_active == True).all()
    if not active_students:
        return 0

    scanned_sids = set(
        r[0] for r in db.query(AttendanceRecord.student_sid)
        .filter(AttendanceRecord.date == target_date)
        .all()
    )

    absent_count = 0
    for student in active_students:
        if student.student_id not in scanned_sids:
            record = AttendanceRecord(
                student_id=student.id,
                student_sid=student.student_id,
                student_name=f"{student.first_name} {student.last_name}",
                class_name=student.class_name,
                section=student.section,
                date=target_date,
                status=AttendanceStatus.absent,
                scan_method="auto_system",
                scanned_by="system_cron",
                notes="Auto-marked absent (No scan recorded)",
            )
            db.add(record)
            absent_count += 1

    if absent_count > 0:
        db.commit()

    return absent_count


def scan_qr(db: Session, request: ScanRequest, scanned_by: str) -> ScanResponse:
    """Core scan logic: resolve student → check duplicate → determine status → save."""
    student = db.query(Student).filter(Student.student_id == request.student_sid).first()
    if not student:
        return ScanResponse(success=False, message=f"Student '{request.student_sid}' not found.", duplicate=False)

    today = datetime.utcnow().date()
    now   = datetime.utcnow().time()

    # Duplicate prevention / auto-absent update
    existing = get_today_record(db, request.student_sid, today)
    if existing:
        if existing.status == AttendanceStatus.absent and existing.scan_method == "auto_system":
            # Student was auto-marked absent, but scanned in now!
            status = AttendanceStatus.present
            if request.late_after:
                h, m = map(int, request.late_after.split(":"))
                cutoff = time_type(h, m)
                if now > cutoff:
                    status = AttendanceStatus.late

            existing.status = status
            existing.time_in = now
            existing.scan_method = "qr"
            existing.scanned_by = scanned_by
            existing.notes = None
            db.commit()
            db.refresh(existing)

            label = "on time" if status == AttendanceStatus.present else "late"
            out = AttendanceOut.model_validate(existing)
            out.photo_url = student.photo_url
            return ScanResponse(
                success=True,
                message=f"✓ {student.first_name} {student.last_name} marked {label}.",
                record=out,
                duplicate=False,
                photo_url=student.photo_url,
            )
        elif not existing.time_out:
            # Student is scanning a second time to CHECK OUT / GO HOME!
            existing.time_out = now
            db.commit()
            db.refresh(existing)

            time_out_str = now.strftime('%I:%M %p')
            out = AttendanceOut.model_validate(existing)
            out.photo_url = student.photo_url
            return ScanResponse(
                success=True,
                message=f"👋 Goodbye {student.first_name} {student.last_name}! Checked OUT at {time_out_str}.",
                record=out,
                duplicate=False,
                photo_url=student.photo_url,
            )
        else:
            out = AttendanceOut.model_validate(existing)
            out.photo_url = student.photo_url
            time_out_str = existing.time_out.strftime('%I:%M %p') if existing.time_out else "earlier"
            return ScanResponse(
                success=False,
                message=f"{student.first_name} {student.last_name} already checked OUT at {time_out_str} today.",
                record=out,
                duplicate=True,
                photo_url=student.photo_url,
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
    out = AttendanceOut.model_validate(record)
    out.photo_url = student.photo_url
    return ScanResponse(
        success=True,
        message=f"✓ {student.first_name} {student.last_name} marked {label}.",
        record=out,
        duplicate=False,
        photo_url=student.photo_url,
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
    if not isinstance(date_filter, (date, datetime)):
        date_filter = None
    target_date = date_filter or datetime.utcnow().date()
    # Auto mark unscanned students as absent on school days
    auto_mark_absents(db, target_date)

    query = db.query(AttendanceRecord)
    if date_filter:
        query = query.filter(AttendanceRecord.date == date_filter)
    if class_name:
        query = query.filter(AttendanceRecord.class_name == class_name)
    if status:
        query = query.filter(AttendanceRecord.status == status)
    if student_sid:
        query = query.filter(AttendanceRecord.student_sid == student_sid)
    
    records = query.order_by(AttendanceRecord.created_at.desc()).offset(skip).limit(limit).all()
    # Populate photo_url dynamically from student model
    for r in records:
        if r.student:
            r.photo_url = r.student.photo_url
    return records


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

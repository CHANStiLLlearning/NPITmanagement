import io
import csv
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from typing import List, Optional

from app.db.session import get_db
from app.schemas.attendance import (
    ScanRequest, ScanResponse, AttendanceCreate,
    AttendanceUpdate, AttendanceOut,
)
from app.crud.attendance import (
    scan_qr, get_records, get_analytics,
    update_record, delete_record, get_today_record,
)
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.attendance import AttendanceRecord
from app.models.student import Student

router = APIRouter()


@router.post("/scan", response_model=ScanResponse)
def scan_attendance(
    request: ScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Process a QR code scan — creates or flags duplicate."""
    return scan_qr(db, request, scanned_by=current_user.email)


@router.get("/", response_model=List[AttendanceOut])
def read_attendance(
    date_filter: Optional[date] = Query(None, alias="date"),
    class_name: Optional[str] = None,
    status: Optional[str] = None,
    student_sid: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_records(db, date_filter=date_filter, class_name=class_name,
                       status=status, student_sid=student_sid, skip=skip, limit=limit)


@router.get("/analytics")
def attendance_analytics(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_analytics(db, from_date=from_date, to_date=to_date)


# ── Rich Reporting Endpoints ───────────────────────────

@router.get("/reports/summary")
def report_summary(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(AttendanceRecord)
    if from_date:   q = q.filter(AttendanceRecord.date >= from_date)
    if to_date:     q = q.filter(AttendanceRecord.date <= to_date)
    if class_name:  q = q.filter(AttendanceRecord.class_name == class_name)
    total   = q.count()
    present = q.filter(AttendanceRecord.status == "present").count()
    late    = q.filter(AttendanceRecord.status == "late").count()
    absent  = q.filter(AttendanceRecord.status == "absent").count()
    excused = q.filter(AttendanceRecord.status == "excused").count()
    rate    = round((present + late) / total * 100, 1) if total else 0.0
    unique_students = db.query(AttendanceRecord.student_sid).distinct().count()
    unique_days     = db.query(AttendanceRecord.date).distinct().count()
    return {
        "total": total, "present": present, "late": late,
        "absent": absent, "excused": excused,
        "rate": rate, "unique_students": unique_students, "unique_days": unique_days,
    }


@router.get("/reports/daily")
def report_daily(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(
        AttendanceRecord.date,
        AttendanceRecord.status,
        func.count().label("count"),
    ).group_by(AttendanceRecord.date, AttendanceRecord.status)
    if from_date:   q = q.filter(AttendanceRecord.date >= from_date)
    if to_date:     q = q.filter(AttendanceRecord.date <= to_date)
    if class_name:  q = q.filter(AttendanceRecord.class_name == class_name)
    rows = q.order_by(AttendanceRecord.date).all()
    pivot: dict = {}
    for row in rows:
        d = str(row.date)
        if d not in pivot:
            pivot[d] = {"date": d, "present": 0, "late": 0, "absent": 0, "excused": 0}
        pivot[d][row.status] = row.count
    data = list(pivot.values())
    for d in data:
        total = sum([d["present"], d["late"], d["absent"], d["excused"]])
        d["total"] = total
        d["rate"]  = round((d["present"] + d["late"]) / total * 100, 1) if total else 0.0
    return data


@router.get("/reports/weekly")
def report_weekly(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(
        extract("year",  AttendanceRecord.date).label("year"),
        extract("week",  AttendanceRecord.date).label("week"),
        AttendanceRecord.status,
        func.count().label("count"),
    ).group_by("year", "week", AttendanceRecord.status)
    if from_date:   q = q.filter(AttendanceRecord.date >= from_date)
    if to_date:     q = q.filter(AttendanceRecord.date <= to_date)
    if class_name:  q = q.filter(AttendanceRecord.class_name == class_name)
    rows = q.order_by("year", "week").all()
    pivot: dict = {}
    for row in rows:
        key = f"{int(row.year)}-W{int(row.week):02d}"
        if key not in pivot:
            pivot[key] = {"week": key, "present": 0, "late": 0, "absent": 0, "excused": 0}
        pivot[key][row.status] = row.count
    data = list(pivot.values())
    for d in data:
        total = sum([d["present"], d["late"], d["absent"], d["excused"]])
        d["total"] = total
        d["rate"] = round((d["present"] + d["late"]) / total * 100, 1) if total else 0.0
    return data


@router.get("/reports/monthly")
def report_monthly(
    year: Optional[int] = None,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(
        extract("year",  AttendanceRecord.date).label("year"),
        extract("month", AttendanceRecord.date).label("month"),
        AttendanceRecord.status,
        func.count().label("count"),
    ).group_by("year", "month", AttendanceRecord.status)
    if year:        q = q.filter(extract("year", AttendanceRecord.date) == year)
    if class_name:  q = q.filter(AttendanceRecord.class_name == class_name)
    rows = q.order_by("year", "month").all()
    MONTHS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    pivot: dict = {}
    for row in rows:
        key = f"{int(row.year)}-{MONTHS[int(row.month)]}"
        if key not in pivot:
            pivot[key] = {"month": key, "present": 0, "late": 0, "absent": 0, "excused": 0}
        pivot[key][row.status] = row.count
    data = list(pivot.values())
    for d in data:
        total = sum([d["present"], d["late"], d["absent"], d["excused"]])
        d["total"] = total
        d["rate"] = round((d["present"] + d["late"]) / total * 100, 1) if total else 0.0
    return data


@router.get("/reports/by-class")
def report_by_class(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(
        AttendanceRecord.class_name,
        AttendanceRecord.status,
        func.count().label("count"),
    ).group_by(AttendanceRecord.class_name, AttendanceRecord.status)
    if from_date: q = q.filter(AttendanceRecord.date >= from_date)
    if to_date:   q = q.filter(AttendanceRecord.date <= to_date)
    rows = q.all()
    pivot: dict = {}
    for row in rows:
        cn = row.class_name or "Unknown"
        if cn not in pivot:
            pivot[cn] = {"class_name": cn, "present": 0, "late": 0, "absent": 0, "excused": 0}
        pivot[cn][row.status] = row.count
    data = list(pivot.values())
    for d in data:
        total = sum([d["present"], d["late"], d["absent"], d["excused"]])
        d["total"] = total
        d["rate"] = round((d["present"] + d["late"]) / total * 100, 1) if total else 0.0
    return sorted(data, key=lambda x: x.get("class_name", ""))


@router.get("/reports/by-student")
def report_by_student(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    class_name: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(
        AttendanceRecord.student_sid,
        AttendanceRecord.student_name,
        AttendanceRecord.class_name,
        AttendanceRecord.status,
        func.count().label("count"),
    ).group_by(
        AttendanceRecord.student_sid, AttendanceRecord.student_name,
        AttendanceRecord.class_name, AttendanceRecord.status,
    )
    if from_date:   q = q.filter(AttendanceRecord.date >= from_date)
    if to_date:     q = q.filter(AttendanceRecord.date <= to_date)
    if class_name:  q = q.filter(AttendanceRecord.class_name == class_name)
    rows = q.all()
    pivot: dict = {}
    for row in rows:
        sid = row.student_sid
        if sid not in pivot:
            pivot[sid] = {
                "student_sid": sid, "student_name": row.student_name,
                "class_name": row.class_name,
                "present": 0, "late": 0, "absent": 0, "excused": 0,
            }
        pivot[sid][row.status] = row.count
    data = list(pivot.values())
    for d in data:
        total = sum([d["present"], d["late"], d["absent"], d["excused"]])
        d["total"] = total
        d["rate"] = round((d["present"] + d["late"]) / total * 100, 1) if total else 0.0
    return sorted(data, key=lambda x: x["rate"])[:limit]


@router.get("/reports/heatmap")
def report_heatmap(
    year: Optional[int] = None,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(
        AttendanceRecord.date,
        AttendanceRecord.status,
        func.count().label("count"),
    ).group_by(AttendanceRecord.date, AttendanceRecord.status)
    if year:       q = q.filter(extract("year", AttendanceRecord.date) == year)
    if class_name: q = q.filter(AttendanceRecord.class_name == class_name)
    rows = q.all()
    pivot: dict = {}
    for row in rows:
        d = str(row.date)
        if d not in pivot:
            pivot[d] = {"date": d, "present": 0, "late": 0, "absent": 0, "excused": 0}
        pivot[d][row.status] = row.count
    result = []
    for d, v in pivot.items():
        total = sum([v["present"], v["late"], v["absent"], v["excused"]])
        rate  = round((v["present"] + v["late"]) / total * 100, 1) if total else 0.0
        result.append({"date": d, "rate": rate, "total": total,
                       "present": v["present"], "late": v["late"],
                       "absent": v["absent"]})
    return sorted(result, key=lambda x: x["date"])


@router.get("/export/csv")
def export_attendance_csv(
    date_filter: Optional[date] = Query(None, alias="date"),
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    records = get_records(db, date_filter=date_filter, class_name=class_name, limit=10000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student ID","Student Name","Class","Section","Date","Time In","Status","Scan Method","Scanned By"])
    for r in records:
        writer.writerow([r.student_sid, r.student_name, r.class_name, r.section,
                         r.date, r.time_in, r.status, r.scan_method, r.scanned_by])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"},
    )


@router.get("/students-qr")
def get_students_qr(
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return students with their QR codes for card printing."""
    query = db.query(Student).filter(Student.is_active == True)
    if class_name:
        query = query.filter(Student.class_name == class_name)
    students = query.all()
    return [
        {
            "id": s.id,
            "student_id": s.student_id,
            "name": f"{s.first_name} {s.last_name}",
            "class_name": s.class_name,
            "section": s.section,
            "qr_code": s.qr_code,
        }
        for s in students
    ]


@router.put("/{record_id}", response_model=AttendanceOut)
def update_attendance(
    record_id: int,
    data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return update_record(db, record, data)


@router.delete("/{record_id}")
def delete_attendance(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    delete_record(db, record)
    return {"message": "Deleted"}

from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from app.models.attendance import AttendanceStatus


class ScanRequest(BaseModel):
    """Payload sent when a QR code is scanned."""
    student_sid: str          # e.g. STU-2025-0001
    class_name: Optional[str] = None
    late_after: Optional[str] = "08:30"   # HH:MM  — scans after this time → late


class AttendanceCreate(BaseModel):
    student_id: int
    date: date
    time_in: Optional[time] = None
    status: AttendanceStatus = AttendanceStatus.present
    class_name: Optional[str] = None
    section: Optional[str] = None
    scan_method: str = "manual"
    notes: Optional[str] = None


class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    notes: Optional[str] = None


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    student_sid: str
    student_name: str
    class_name: Optional[str]
    section: Optional[str]
    date: date
    time_in: Optional[time]
    time_out: Optional[time] = None
    status: AttendanceStatus
    scanned_by: Optional[str]
    scan_method: str
    notes: Optional[str]
    photo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ScanResponse(BaseModel):
    success: bool
    message: str
    record: Optional[AttendanceOut] = None
    duplicate: bool = False
    photo_url: Optional[str] = None


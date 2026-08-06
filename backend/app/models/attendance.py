import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Time, Text, Enum, DateTime, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class AttendanceStatus(str, enum.Enum):
    present = "present"
    late = "late"
    absent = "absent"
    excused = "excused"


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)

    # Who
    student_id    = Column(Integer, ForeignKey("students.id"), nullable=False)
    student_sid   = Column(String(20), nullable=False, index=True)   # denormalised for fast look-up
    student_name  = Column(String(200), nullable=False)
    class_name    = Column(String(50), nullable=True)
    section       = Column(String(10), nullable=True)

    # When
    date          = Column(Date, nullable=False, index=True)
    time_in       = Column(Time, nullable=True)
    time_out      = Column(Time, nullable=True)
    status        = Column(Enum(AttendanceStatus), default=AttendanceStatus.present)

    # Scan meta
    scanned_by    = Column(String(200), nullable=True)   # teacher email
    scan_method   = Column(String(20), default="qr")     # qr | manual
    notes         = Column(Text, nullable=True)

    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student       = relationship("Student", backref="attendance_records")

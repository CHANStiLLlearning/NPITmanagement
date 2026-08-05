import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Text, Enum, DateTime, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class TeacherStatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    on_leave = "on_leave"
    terminated = "terminated"


class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(String(20), unique=True, index=True, nullable=False)

    # Personal Info
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(Enum(GenderEnum), nullable=True)
    photo_url = Column(String(500), nullable=True)
    qr_code = Column(Text, nullable=True)

    # Contact
    email = Column(String(200), unique=True, nullable=True)
    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(30), nullable=True)

    # Professional
    department = Column(String(100), nullable=True)
    qualification = Column(String(300), nullable=True)
    specialization = Column(String(200), nullable=True)
    experience_years = Column(Integer, default=0)
    join_date = Column(Date, nullable=True)
    employment_type = Column(String(50), nullable=True)  # full_time / part_time / contract
    status = Column(Enum(TeacherStatusEnum), default=TeacherStatusEnum.active)

    # Salary
    salary = Column(Numeric(12, 2), nullable=True)
    bank_account = Column(String(50), nullable=True)
    bank_name = Column(String(100), nullable=True)

    # Performance
    performance_rating = Column(Numeric(3, 2), nullable=True)  # 0.00 - 5.00
    performance_notes = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

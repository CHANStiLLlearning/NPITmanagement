import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Text, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class StatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    transferred = "transferred"
    graduated = "graduated"


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), unique=True, index=True, nullable=False)
    
    # Personal Info
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(Enum(GenderEnum), nullable=True)
    photo_url = Column(String(500), nullable=True)
    qr_code = Column(Text, nullable=True)  # base64 QR code
    
    # Contact Info
    email = Column(String(200), nullable=True)
    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    
    # Academic Info
    class_name = Column(String(50), nullable=True)
    section = Column(String(10), nullable=True)
    enrollment_date = Column(Date, nullable=True)
    status = Column(Enum(StatusEnum), default=StatusEnum.active)
    
    # Guardian Info
    guardian_name = Column(String(200), nullable=True)
    guardian_phone = Column(String(30), nullable=True)
    guardian_email = Column(String(200), nullable=True)
    guardian_relationship = Column(String(50), nullable=True)
    
    # Emergency Contact
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(30), nullable=True)
    emergency_contact_relationship = Column(String(50), nullable=True)
    
    # Medical Info
    blood_type = Column(String(10), nullable=True)
    allergies = Column(Text, nullable=True)
    medical_conditions = Column(Text, nullable=True)
    medical_notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

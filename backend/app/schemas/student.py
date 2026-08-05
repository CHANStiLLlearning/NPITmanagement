from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from app.models.student import GenderEnum, StatusEnum


class StudentBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    class_name: Optional[str] = None
    section: Optional[str] = None
    enrollment_date: Optional[date] = None
    status: StatusEnum = StatusEnum.active
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[str] = None
    guardian_relationship: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    medical_notes: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    class_name: Optional[str] = None
    section: Optional[str] = None
    enrollment_date: Optional[date] = None
    status: Optional[StatusEnum] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[str] = None
    guardian_relationship: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    medical_notes: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None


class StudentInDB(StudentBase):
    id: int
    student_id: str
    photo_url: Optional[str] = None
    qr_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class Student(StudentInDB):
    pass

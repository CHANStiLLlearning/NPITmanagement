from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from app.models.teacher import TeacherStatusEnum, GenderEnum


class TeacherBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    department: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = 0
    join_date: Optional[date] = None
    employment_type: Optional[str] = None
    status: TeacherStatusEnum = TeacherStatusEnum.active
    salary: Optional[Decimal] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    performance_rating: Optional[Decimal] = None
    performance_notes: Optional[str] = None


class TeacherCreate(TeacherBase):
    pass


class TeacherUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    department: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    join_date: Optional[date] = None
    employment_type: Optional[str] = None
    status: Optional[TeacherStatusEnum] = None
    salary: Optional[Decimal] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    performance_rating: Optional[Decimal] = None
    performance_notes: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None


class TeacherInDB(TeacherBase):
    id: int
    teacher_id: str
    photo_url: Optional[str] = None
    qr_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class Teacher(TeacherInDB):
    pass

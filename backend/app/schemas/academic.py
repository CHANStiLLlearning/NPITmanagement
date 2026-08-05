from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime


# Academic Year
class AcademicYearCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_current: bool = False

class AcademicYearOut(AcademicYearCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


# Semester
class SemesterCreate(BaseModel):
    academic_year_id: int
    name: str
    start_date: date
    end_date: date
    is_current: bool = False

class SemesterOut(SemesterCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


# Grade & Section
class SectionCreate(BaseModel):
    name: str
    grade_id: int
    room_number: Optional[str] = None
    capacity: int = 30

class SectionOut(SectionCreate):
    id: int
    class Config:
        from_attributes = True

class GradeCreate(BaseModel):
    name: str
    level: int = 1
    description: Optional[str] = None

class GradeOut(GradeCreate):
    id: int
    sections: List[SectionOut] = []
    class Config:
        from_attributes = True


# Subject
class SubjectCreate(BaseModel):
    name: str
    code: str
    type: str = "Core"
    description: Optional[str] = None

class SubjectOut(SubjectCreate):
    id: int
    class Config:
        from_attributes = True


# Teacher Assignment
class TeacherAssignmentCreate(BaseModel):
    teacher_email: str
    teacher_name: str
    subject_id: int
    grade_id: Optional[int] = None
    section_id: Optional[int] = None
    academic_year: Optional[str] = None

class TeacherAssignmentOut(TeacherAssignmentCreate):
    id: int
    subject_name: Optional[str] = None
    grade_name: Optional[str] = None
    section_name: Optional[str] = None
    class Config:
        from_attributes = True


# Timetable Entry
class TimetableEntryCreate(BaseModel):
    day_of_week: str
    period_number: int
    start_time: str # "08:00"
    end_time: str   # "08:45"
    grade_id: int
    section_id: Optional[int] = None
    subject_id: int
    teacher_name: Optional[str] = None
    room_number: Optional[str] = None

class TimetableEntryOut(BaseModel):
    id: int
    day_of_week: str
    period_number: int
    start_time: str
    end_time: str
    grade_id: int
    section_id: Optional[int]
    subject_id: int
    teacher_name: Optional[str]
    room_number: Optional[str]
    subject_name: Optional[str]
    grade_name: Optional[str]
    section_name: Optional[str]
    class Config:
        from_attributes = True


# Holiday
class HolidayCreate(BaseModel):
    title: str
    start_date: date
    end_date: date
    type: str = "Public Holiday"
    description: Optional[str] = None

class HolidayOut(HolidayCreate):
    id: int
    class Config:
        from_attributes = True

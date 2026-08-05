from sqlalchemy import (
    Column, Integer, String, Boolean, Date, Time, ForeignKey, Text, Enum, DateTime
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.session import Base


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)  # e.g., "2025-2026"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    semesters = relationship("Semester", back_populates="academic_year", cascade="all, delete-orphan")


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g., "Fall 2025" or "Semester 1"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    academic_year = relationship("AcademicYear", back_populates="semesters")


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)  # e.g., "Grade 10"
    level = Column(Integer, nullable=False, default=1)      # Numeric ordering e.g. 10
    description = Column(Text, nullable=True)

    sections = relationship("Section", back_populates="grade", cascade="all, delete-orphan")


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=False)
    name = Column(String(50), nullable=False)  # e.g. "Section A"
    room_number = Column(String(50), nullable=True)
    capacity = Column(Integer, default=30)

    grade = relationship("Grade", back_populates="sections")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)  # e.g. "Mathematics"
    code = Column(String(20), nullable=False, unique=True)   # e.g. "MATH101"
    type = Column(String(50), default="Core")                 # Core, Elective, Extra
    description = Column(Text, nullable=True)


class TeacherAssignment(Base):
    """Maps Teacher to Subject and Grade/Section"""
    __tablename__ = "teacher_assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_email = Column(String(200), nullable=False)
    teacher_name = Column(String(200), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True)
    academic_year = Column(String(100), nullable=True)

    subject = relationship("Subject")
    grade = relationship("Grade")
    section = relationship("Section")


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String(20), nullable=False) # Monday, Tuesday...
    period_number = Column(Integer, nullable=False)    # 1, 2, 3...
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_name = Column(String(200), nullable=True)
    room_number = Column(String(50), nullable=True)

    grade = relationship("Grade")
    section = relationship("Section")
    subject = relationship("Subject")


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    type = Column(String(50), default="Public Holiday") # National, Religious, School Break
    description = Column(Text, nullable=True)

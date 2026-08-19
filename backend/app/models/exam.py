from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class ExamType(Base):
    __tablename__ = "exam_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)  # e.g., "Midterm Exam", "Final Semester Exam", "Quiz"
    description = Column(Text, nullable=True)
    weight_percentage = Column(Float, default=100.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    exams = relationship("Exam", back_populates="exam_type", cascade="all, delete-orphan")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    exam_type_id = Column(Integer, ForeignKey("exam_types.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    academic_year = Column(String(50), default="2025-2026")
    term_name = Column(String(50), default="Semester 1")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_published = Column(Integer, default=0)  # 0: Draft, 1: Published
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    exam_type = relationship("ExamType", back_populates="exams")
    schedules = relationship("ExamSchedule", back_populates="exam", cascade="all, delete-orphan")
    marks = relationship("ExamMark", back_populates="exam", cascade="all, delete-orphan")


class ExamSchedule(Base):
    __tablename__ = "exam_schedules"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    class_name = Column(String(50), nullable=True)
    exam_date = Column(Date, nullable=False)
    start_time = Column(String(20), nullable=False)  # e.g., "08:00 AM"
    end_time = Column(String(20), nullable=False)    # e.g., "10:00 AM"
    room = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    exam = relationship("Exam", back_populates="schedules")
    subject = relationship("Subject")


class ExamMark(Base):
    __tablename__ = "exam_marks"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False, default=0.0)
    grade = Column(String(5), nullable=True)  # A, B+, B, C+, C, D, E, F
    remarks = Column(String(255), nullable=True)
    entered_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    exam = relationship("Exam", back_populates="marks")
    student = relationship("Student")
    subject = relationship("Subject")

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Guardian(Base):
    __tablename__ = "guardians"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    relationship_type = Column(String(50), default="Parent")  # Father, Mother, Guardian, Sponsor
    phone = Column(String(50), nullable=False)
    email = Column(String(150), nullable=True)
    occupation = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    students = relationship("StudentGuardian", back_populates="guardian", cascade="all, delete-orphan")


class StudentGuardian(Base):
    __tablename__ = "student_guardians"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    guardian_id = Column(Integer, ForeignKey("guardians.id", ondelete="CASCADE"), nullable=False)
    is_primary = Column(Boolean, default=True)
    is_emergency_contact = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student")
    guardian = relationship("Guardian", back_populates="students")

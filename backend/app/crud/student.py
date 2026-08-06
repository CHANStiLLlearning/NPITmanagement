import qrcode
import io
import base64
import random
import string
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate


def generate_student_id(db: Session) -> str:
    """Generate a unique student ID like STU-2026-0001"""
    from datetime import datetime
    year = datetime.utcnow().year
    count = db.query(Student).count() + 1
    while True:
        candidate = f"STU-{year}-{count:04d}"
        if not db.query(Student).filter(Student.student_id == candidate).first():
            return candidate
        count += 1



def generate_qr_code(student_id: str) -> str:
    """Generate a base64-encoded QR code for a student ID"""
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(student_id)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode()


def get_student(db: Session, student_id: int) -> Student | None:
    return db.query(Student).filter(Student.id == student_id).first()


def get_student_by_sid(db: Session, student_id: str) -> Student | None:
    return db.query(Student).filter(Student.student_id == student_id).first()


def get_students(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    class_name: str | None = None,
    section: str | None = None,
    status: str | None = None,
) -> list[Student]:
    query = db.query(Student)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Student.first_name.ilike(search_term),
                Student.last_name.ilike(search_term),
                Student.student_id.ilike(search_term),
                Student.email.ilike(search_term),
                Student.phone.ilike(search_term),
            )
        )
    if class_name:
        query = query.filter(Student.class_name == class_name)
    if section:
        query = query.filter(Student.section == section)
    if status:
        query = query.filter(Student.status == status)

    return query.offset(skip).limit(limit).all()


def count_students(
    db: Session,
    search: str | None = None,
    class_name: str | None = None,
    section: str | None = None,
    status: str | None = None,
) -> int:
    query = db.query(Student)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Student.first_name.ilike(search_term),
                Student.last_name.ilike(search_term),
                Student.student_id.ilike(search_term),
                Student.email.ilike(search_term),
            )
        )
    if class_name:
        query = query.filter(Student.class_name == class_name)
    if section:
        query = query.filter(Student.section == section)
    if status:
        query = query.filter(Student.status == status)
    return query.count()


def create_student(db: Session, student: StudentCreate) -> Student:
    student_id = generate_student_id(db)
    qr = generate_qr_code(student_id)
    db_student = Student(
        **student.model_dump(),
        student_id=student_id,
        qr_code=qr,
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


def update_student(db: Session, db_student: Student, student: StudentUpdate) -> Student:
    update_data = student.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_student, field, value)
    db.commit()
    db.refresh(db_student)
    return db_student


def delete_student(db: Session, db_student: Student) -> Student:
    db.delete(db_student)
    db.commit()
    return db_student

import qrcode
import io
import base64
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.teacher import Teacher
from app.schemas.teacher import TeacherCreate, TeacherUpdate


def generate_teacher_id(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(Teacher).count() + 1
    while True:
        candidate = f"TCH-{year}-{count:04d}"
        if not db.query(Teacher).filter(Teacher.teacher_id == candidate).first():
            return candidate
        count += 1



def generate_qr_code(teacher_id: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(teacher_id)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode()


def get_teacher(db: Session, teacher_id: int) -> Teacher | None:
    return db.query(Teacher).filter(Teacher.id == teacher_id).first()


def get_teachers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    department: str | None = None,
    status: str | None = None,
) -> list[Teacher]:
    query = db.query(Teacher)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Teacher.first_name.ilike(term),
                Teacher.last_name.ilike(term),
                Teacher.teacher_id.ilike(term),
                Teacher.email.ilike(term),
                Teacher.department.ilike(term),
                Teacher.specialization.ilike(term),
            )
        )
    if department:
        query = query.filter(Teacher.department == department)
    if status:
        query = query.filter(Teacher.status == status)
    return query.offset(skip).limit(limit).all()


def count_teachers(
    db: Session,
    search: str | None = None,
    department: str | None = None,
    status: str | None = None,
) -> int:
    query = db.query(Teacher)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(Teacher.first_name.ilike(term), Teacher.last_name.ilike(term), Teacher.teacher_id.ilike(term))
        )
    if department:
        query = query.filter(Teacher.department == department)
    if status:
        query = query.filter(Teacher.status == status)
    return query.count()


def create_teacher(db: Session, teacher: TeacherCreate) -> Teacher:
    teacher_id = generate_teacher_id(db)
    qr = generate_qr_code(teacher_id)
    db_teacher = Teacher(**teacher.model_dump(), teacher_id=teacher_id, qr_code=qr)
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher


def update_teacher(db: Session, db_teacher: Teacher, teacher: TeacherUpdate) -> Teacher:
    for field, value in teacher.model_dump(exclude_unset=True).items():
        setattr(db_teacher, field, value)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher


def delete_teacher(db: Session, db_teacher: Teacher) -> Teacher:
    db.delete(db_teacher)
    db.commit()
    return db_teacher

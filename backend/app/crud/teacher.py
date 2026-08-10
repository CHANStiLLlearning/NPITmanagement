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
    teachers = query.offset(skip).limit(limit).all()
    updated = False
    for t in teachers:
        if not t.qr_code and t.teacher_id:
            t.qr_code = generate_qr_code(t.teacher_id)
            updated = True
    if updated:
        db.commit()
    return teachers


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
    from app.models.user import User, RoleEnum
    from app.core.security import get_password_hash
    from sqlalchemy import func

    teacher_id = generate_teacher_id(db)
    qr = generate_qr_code(teacher_id)
    db_teacher = Teacher(**teacher.model_dump(), teacher_id=teacher_id, qr_code=qr)
    db.add(db_teacher)

    # Auto-create User login account if email provided and doesn't exist
    if teacher.email:
        clean_email = teacher.email.strip().lower()
        existing_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
        if not existing_user:
            user = User(
                email=clean_email,
                hashed_password=get_password_hash("Teacher@123"),
                first_name=teacher.first_name,
                last_name=teacher.last_name,
                role=RoleEnum.teacher,
                is_active=True,
            )
            db.add(user)

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
    from app.models.user import User
    from app.models.academic import TeacherAssignment
    from app.models.teaching_report import TeachingReport
    from sqlalchemy import func

    email = db_teacher.email.strip().lower() if db_teacher.email else None

    if email:
        # Delete linked user account if exists
        u = db.query(User).filter(func.lower(User.email) == email).first()
        if u:
            db.delete(u)

        # Delete teacher assignments and teaching reports
        db.query(TeacherAssignment).filter(func.lower(TeacherAssignment.teacher_email) == email).delete(synchronize_session=False)
        db.query(TeachingReport).filter(func.lower(TeachingReport.teacher_email) == email).delete(synchronize_session=False)

    db.delete(db_teacher)
    db.commit()
    return db_teacher


from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

from sqlalchemy import func

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    if not email:
        return None
    clean_email = email.strip().lower()
    return db.query(User).filter(func.lower(User.email) == clean_email).first()

def create_user(db: Session, user: UserCreate):
    clean_email = user.email.strip().lower()
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=clean_email,
        hashed_password=hashed_password,
        first_name=user.first_name.strip() if user.first_name else "",
        last_name=user.last_name.strip() if user.last_name else "",
        role=user.role,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    role: str = None,
    search: str = None,
    sort_by: str = "id",
    order: str = "desc",
):
    from sqlalchemy import or_
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                User.email.ilike(term),
                User.first_name.ilike(term),
                User.last_name.ilike(term),
            )
        )
    column = getattr(User, sort_by, User.id)
    if order.lower() == "desc":
        q = q.order_by(column.desc())
    else:
        q = q.order_by(column.asc())
    return q.offset(skip).limit(limit).all()

def update_user(db: Session, db_user: User, user: UserUpdate):
    update_data = user.model_dump(exclude_unset=True)
    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
    for field, value in update_data.items():
        setattr(db_user, field, value)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, db_user: User):
    from app.models.student import Student
    from app.models.teacher import Teacher
    from app.models.attendance import AttendanceRecord
    from app.models.score import StudentScore, ReportCard
    from app.models.academic import TeacherAssignment
    from app.models.teaching_report import TeachingReport
    from app.models.audit_log import AuditLog
    from app.models.session import UserSession

    user_id = db_user.id
    email = db_user.email.strip().lower() if db_user.email else None

    # Always remove active login sessions first
    db.query(UserSession).filter(UserSession.user_id == user_id).delete(synchronize_session=False)

    if email:
        # Delete linked Student record and its dependent records
        st = db.query(Student).filter(func.lower(Student.email) == email).first()
        if st:
            db.query(AttendanceRecord).filter(AttendanceRecord.student_sid == st.student_id).delete(synchronize_session=False)
            db.query(StudentScore).filter(StudentScore.student_sid == st.student_id).delete(synchronize_session=False)
            db.query(ReportCard).filter(ReportCard.student_sid == st.student_id).delete(synchronize_session=False)
            db.delete(st)

        # Delete linked Teacher record and its dependent records
        tch = db.query(Teacher).filter(func.lower(Teacher.email) == email).first()
        if tch:
            db.query(TeacherAssignment).filter(func.lower(TeacherAssignment.teacher_email) == email).delete(synchronize_session=False)
            db.query(TeachingReport).filter(func.lower(TeachingReport.teacher_email) == email).delete(synchronize_session=False)
            db.delete(tch)

        # Clean up any leftover records linked by email
        db.query(TeacherAssignment).filter(func.lower(TeacherAssignment.teacher_email) == email).delete(synchronize_session=False)
        db.query(TeachingReport).filter(func.lower(TeachingReport.teacher_email) == email).delete(synchronize_session=False)
        db.query(AuditLog).filter(func.lower(AuditLog.user_email) == email).delete(synchronize_session=False)

    db.delete(db_user)
    db.commit()
    return db_user


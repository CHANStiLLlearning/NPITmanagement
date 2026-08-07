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
    db.delete(db_user)
    db.commit()
    return db_user

from sqlalchemy import Column, Integer, String, Boolean, Enum
import enum
from app.db.session import Base

class RoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    principal = "principal"
    teacher = "teacher"
    student = "student"
    parent = "parent"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.student)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

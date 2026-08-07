from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, Body, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import secrets

from app.db.session import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, get_password_hash
from app.core.config import settings
from app.crud.user import get_user_by_email
from app.schemas.token import Token
from app.models.session import UserSession
from pydantic import BaseModel, EmailStr

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str  # "student" or "parent"

from app.crud.audit_log import log_action

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    db: Session = Depends(get_db), 
    remember_me: bool = Form(False)
):
    user = get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        if user:
            log_action(db, user_email=user.email, action="login_failed", module="Auth", details="Invalid password attempt", ip_address=request.client.host if (request and request.client) else "127.0.0.1")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS) if remember_me else timedelta(days=1)
    refresh_token = create_refresh_token(
        subject=user.email, expires_delta=refresh_token_expires
    )

    # Save session
    db_session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + refresh_token_expires
    )
    db.add(db_session)
    db.commit()

    # Log successful login
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    user_full_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email
    log_action(db, user_email=user.email, user_name=user_full_name, action="login", module="Auth", details=f"User logged in successfully (Role: {user.role})", ip_address=client_ip)

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/logout")
def logout(
    request: Request,
    refresh_token: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    if refresh_token:
        session = db.query(UserSession).filter(UserSession.refresh_token == refresh_token).first()
        if session:
            session.is_active = False
            user = session.user
            client_ip = request.client.host if request.client else "127.0.0.1"
            log_action(db, user_email=user.email, user_name=f"{user.first_name or ''} {user.last_name or ''}".strip(), action="logout", module="Auth", details="User logged out", ip_address=client_ip)
            db.commit()
    return {"message": "Logged out successfully"}

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    db_session = db.query(UserSession).filter(UserSession.refresh_token == request.refresh_token, UserSession.is_active == True).first()
    if not db_session or db_session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    # Generate new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=db_session.user.email, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "refresh_token": db_session.refresh_token, "token_type": "bearer"}

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=request.email)
    if user:
        reset_token = create_access_token(subject=user.email, expires_delta=timedelta(hours=1))
        # Simulate sending email
        print(f"--- SIMULATED EMAIL ---")
        print(f"To: {user.email}")
        print(f"Subject: Password Reset Request")
        print(f"Body: Use this token to reset your password: {reset_token}")
        print(f"-----------------------")
    return {"message": "If that email exists, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    from jose import jwt, JWTError
    try:
        payload = jwt.decode(request.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    user = get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password successfully reset"}

@router.post("/register", status_code=status.HTTP_201_CREATED)
def public_register(request_data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Public self-registration for students and parents only.
    """
    allowed_roles = {"student", "parent", "teacher"}
    if request_data.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Admin accounts cannot self-register. Please contact school administration."
        )
    existing = get_user_by_email(db, email=request_data.email)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )
    from app.schemas.user import UserCreate
    from app.models.user import RoleEnum
    user_in = UserCreate(
        email=request_data.email,
        password=request_data.password,
        first_name=request_data.first_name,
        last_name=request_data.last_name,
        role=RoleEnum(request_data.role),
        is_active=True,
    )
    from app.crud.user import create_user
    user = create_user(db, user_in)
    
    user_email = user.email
    user_name = f"{user.first_name} {user.last_name}".strip()
    user_role = user.role

    if user.role == RoleEnum.student:
        from app.schemas.student import StudentCreate
        from app.crud.student import create_student
        try:
            student_in = StudentCreate(
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
            )
            create_student(db, student_in)
        except Exception as e:
            db.rollback()
            print(f"Failed to create student profile for user {user_email}: {e}")
    elif user.role == RoleEnum.teacher:
        from app.schemas.teacher import TeacherCreate
        from app.crud.teacher import create_teacher
        try:
            teacher_in = TeacherCreate(
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
            )
            create_teacher(db, teacher_in)
        except Exception as e:
            db.rollback()
            print(f"Failed to create teacher profile for user {user_email}: {e}")

    log_action(
        db,
        user_email=user_email,
        user_name=user_name,
        action="create",
        module="Auth",
        details=f"New self-registration as {user_role}",
        ip_address="self-register"
    )
    return {"message": "Account created successfully. You can now log in."}

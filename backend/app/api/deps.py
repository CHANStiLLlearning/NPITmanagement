from typing import Generator
from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.api.auth import oauth2_scheme
from app.crud.user import get_user_by_email
from app.schemas.token import TokenData
from app.models.user import User, RoleEnum

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role != RoleEnum.super_admin:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user

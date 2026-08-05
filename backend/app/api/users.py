from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.user import User, UserCreate, UserUpdate
from app.crud.user import create_user, get_user_by_email, get_users, get_user, update_user, delete_user
from app.api.deps import get_current_active_superuser, get_current_active_user

router = APIRouter()

from typing import Optional
from fastapi import Request
from app.crud.audit_log import log_action

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
def register_user(
    request: Request,
    user_in: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Create new user (Super Admin only).
    """
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = create_user(db, user_in)
    log_action(
        db,
        user_email=current_user.email,
        action="create",
        module="Users",
        details=f"Created user {user.email} ({user.role})",
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    return user

@router.get("/", response_model=List[User])
def read_users(
    skip: int = Query(0, ge=0, description="Pagination skip offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination page size limit"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    search: Optional[str] = Query(None, description="Search query string"),
    sort_by: Optional[str] = Query("id", description="Field to sort by"),
    order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Retrieve users with Pagination, Filtering, Searching, and Sorting (Super Admin only).
    """
    users = get_users(db, skip=skip, limit=limit, role=role, search=search, sort_by=sort_by, order=order)
    return users

@router.get("/me", response_model=User)
def read_users_me(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current active user profile.
    """
    return current_user

@router.get("/{user_id}", response_model=User)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Get a specific user by ID (Super Admin only).
    """
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=User)
def update_user_by_id(
    request: Request,
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Update a user (Super Admin only).
    """
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = update_user(db, db_user=user, user=user_in)
    log_action(
        db,
        user_email=current_user.email,
        action="update",
        module="Users",
        details=f"Updated user ID {user.id} ({user.email})",
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    return user

@router.delete("/{user_id}", response_model=User)
def delete_user_by_id(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Delete a user (Super Admin only).
    """
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = delete_user(db, db_user=user)
    log_action(
        db,
        user_email=current_user.email,
        action="delete",
        module="Users",
        details=f"Deleted user ID {user.id} ({user.email})",
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    return user

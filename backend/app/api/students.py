import io
import csv
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.schemas.student import Student, StudentCreate, StudentUpdate
from app.crud.student import (
    get_student, get_students, count_students,
    create_student, update_student, delete_student
)
from app.api.deps import get_current_active_user, get_current_active_superuser
from app.models.user import User

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_IMAGE_EXTS = {"png", "jpg", "jpeg", "webp", "gif"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB

@router.post("/{student_id}/avatar")
async def upload_student_avatar(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload profile photo for a specific student."""
    student = get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    content = await file.read()
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(status_code=400, detail="Invalid image type.")
    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=400, detail="Image exceeds 5 MB limit.")
    unique_name = f"student_{uuid.uuid4().hex[:10]}.{ext}"
    with open(os.path.join(UPLOAD_DIR, unique_name), "wb") as f:
        f.write(content)
    student.photo_url = f"/static/uploads/{unique_name}"
    if student.email:
        u = db.query(User).filter(User.email == student.email).first()
        if u:
            u.photo_url = student.photo_url
    db.commit()
    db.refresh(student)
    return {"photo_url": student.photo_url}


@router.get("/", response_model=List[Student])
def read_students(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    class_name: Optional[str] = None,
    section: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve students with optional search and filters."""
    return get_students(db, skip=skip, limit=limit, search=search,
                        class_name=class_name, section=section, status=status)


@router.get("/count")
def read_students_count(
    search: Optional[str] = None,
    class_name: Optional[str] = None,
    section: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return {"count": count_students(db, search=search, class_name=class_name,
                                     section=section, status=status)}


@router.get("/export/csv")
def export_students_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Export all students as CSV (Excel-compatible)."""
    students = get_students(db, skip=0, limit=10000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Student ID", "First Name", "Last Name", "Gender", "Date of Birth",
        "Email", "Phone", "Class", "Section", "Status",
        "Guardian Name", "Guardian Phone", "Emergency Contact", "Blood Type",
    ])
    for s in students:
        writer.writerow([
            s.student_id, s.first_name, s.last_name, s.gender, s.date_of_birth,
            s.email, s.phone, s.class_name, s.section, s.status,
            s.guardian_name, s.guardian_phone, s.emergency_contact_name, s.blood_type,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students.csv"},
    )


@router.post("/import/csv")
async def import_students_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """Import students from a CSV file."""
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    created, skipped = 0, 0
    for row in reader:
        try:
            student_in = StudentCreate(
                first_name=row.get("First Name", ""),
                last_name=row.get("Last Name", ""),
                email=row.get("Email"),
                phone=row.get("Phone"),
                class_name=row.get("Class"),
                section=row.get("Section"),
                guardian_name=row.get("Guardian Name"),
                guardian_phone=row.get("Guardian Phone"),
            )
            create_student(db, student_in)
            created += 1
        except Exception:
            skipped += 1
    return {"message": f"Import complete. Created: {created}, Skipped: {skipped}"}


@router.get("/{student_id}", response_model=Student)
def read_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    student = get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.post("/", response_model=Student, status_code=status.HTTP_201_CREATED)
def create_student_endpoint(
    student_in: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return create_student(db, student_in)


@router.put("/{student_id}", response_model=Student)
def update_student_endpoint(
    student_id: int,
    student_in: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    student = get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return update_student(db, db_student=student, student=student_in)


@router.delete("/{student_id}", response_model=Student)
def delete_student_endpoint(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    student = get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return delete_student(db, db_student=student)

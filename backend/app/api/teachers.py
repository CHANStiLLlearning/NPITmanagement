import io
import csv
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.schemas.teacher import Teacher, TeacherCreate, TeacherUpdate
from app.crud.teacher import (
    get_teacher, get_teachers, count_teachers,
    create_teacher, update_teacher, delete_teacher,
)
from app.api.deps import get_current_active_user, get_current_active_superuser
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[Teacher])
def read_teachers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_teachers(db, skip=skip, limit=limit, search=search,
                        department=department, status=status)


@router.get("/count")
def read_teachers_count(
    search: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return {"count": count_teachers(db, search=search, department=department, status=status)}


@router.get("/export/csv")
def export_teachers_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    teachers = get_teachers(db, skip=0, limit=10000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Teacher ID", "First Name", "Last Name", "Gender", "Date of Birth",
        "Email", "Phone", "Department", "Specialization", "Qualification",
        "Experience (yrs)", "Employment Type", "Join Date", "Salary", "Status",
        "Performance Rating",
    ])
    for t in teachers:
        writer.writerow([
            t.teacher_id, t.first_name, t.last_name, t.gender, t.date_of_birth,
            t.email, t.phone, t.department, t.specialization, t.qualification,
            t.experience_years, t.employment_type, t.join_date, t.salary, t.status,
            t.performance_rating,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=teachers.csv"},
    )


@router.post("/import/csv")
async def import_teachers_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    created, skipped = 0, 0
    for row in reader:
        try:
            t_in = TeacherCreate(
                first_name=row.get("First Name", ""),
                last_name=row.get("Last Name", ""),
                email=row.get("Email"),
                phone=row.get("Phone"),
                department=row.get("Department"),
                qualification=row.get("Qualification"),
            )
            create_teacher(db, t_in)
            created += 1
        except Exception:
            skipped += 1
    return {"message": f"Import complete. Created: {created}, Skipped: {skipped}"}


@router.get("/{teacher_id}", response_model=Teacher)
def read_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    teacher = get_teacher(db, teacher_id=teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


@router.post("/", response_model=Teacher, status_code=status.HTTP_201_CREATED)
def create_teacher_endpoint(
    teacher_in: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return create_teacher(db, teacher_in)


@router.put("/{teacher_id}", response_model=Teacher)
def update_teacher_endpoint(
    teacher_id: int,
    teacher_in: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    teacher = get_teacher(db, teacher_id=teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return update_teacher(db, db_teacher=teacher, teacher=teacher_in)


@router.delete("/{teacher_id}", response_model=Teacher)
def delete_teacher_endpoint(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    teacher = get_teacher(db, teacher_id=teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return delete_teacher(db, db_teacher=teacher)

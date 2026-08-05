from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.score import (
    ScoreCategoryCreate, ScoreCategoryUpdate, ScoreCategoryOut,
    StudentScoreUpsert, StudentScoreOut,
    ReportCardUpdate, ReportCardOut,
)
from app.crud.score import (
    create_category, get_categories, update_category, delete_category,
    upsert_score, get_scores_for_class, get_scores_for_category,
    generate_report_cards, get_report_cards, update_report_card,
)
from app.api.deps import get_current_active_user
from app.models.user import User, RoleEnum
from app.models.score import ScoreCategory, ReportCard

router = APIRouter()

REVIEWER_ROLES = {RoleEnum.super_admin, RoleEnum.admin, RoleEnum.principal}


# ── Categories ─────────────────────────────────────────
@router.get("/categories", response_model=List[ScoreCategoryOut])
def list_categories(
    class_name: Optional[str] = None,
    subject: Optional[str] = None,
    term: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    teacher = current_user.email if current_user.role == RoleEnum.teacher else None
    return get_categories(db, class_name=class_name, subject=subject, term=term, teacher_email=teacher)


@router.post("/categories", response_model=ScoreCategoryOut, status_code=201)
def create_category_endpoint(
    data: ScoreCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return create_category(db, data, teacher_email=current_user.email)


@router.put("/categories/{cat_id}", response_model=ScoreCategoryOut)
def update_category_endpoint(
    cat_id: int,
    data: ScoreCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cat = db.query(ScoreCategory).filter(ScoreCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    return update_category(db, cat, data)


@router.delete("/categories/{cat_id}")
def delete_category_endpoint(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cat = db.query(ScoreCategory).filter(ScoreCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    delete_category(db, cat)
    return {"message": "Deleted"}


# ── Score entry ────────────────────────────────────────
@router.post("/categories/{cat_id}/scores", response_model=StudentScoreOut)
def upsert_score_endpoint(
    cat_id: int,
    data: StudentScoreUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return upsert_score(db, cat_id, data)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/categories/{cat_id}/scores", response_model=List[StudentScoreOut])
def list_category_scores(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_scores_for_category(db, cat_id)


# ── Grade book ─────────────────────────────────────────
@router.get("/gradebook")
def get_gradebook(
    class_name: str,
    subject: Optional[str] = None,
    term: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return the full grade book: categories + all student scores + calculated results."""
    return get_scores_for_class(db, class_name=class_name, subject=subject, term=term)


# ── Report Cards ───────────────────────────────────────
@router.post("/report-cards/generate")
def generate_report_cards_endpoint(
    class_name: str,
    subject: str,
    term: str = "Term 1",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cards = generate_report_cards(db, class_name=class_name, subject=subject, term=term)
    return {"message": f"Generated {len(cards)} report cards", "count": len(cards)}


@router.get("/report-cards", response_model=List[ReportCardOut])
def list_report_cards(
    class_name: Optional[str] = None,
    subject: Optional[str] = None,
    term: Optional[str] = None,
    student_sid: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_report_cards(db, class_name=class_name, subject=subject,
                             term=term, student_sid=student_sid)


@router.put("/report-cards/{card_id}", response_model=ReportCardOut)
def update_report_card_endpoint(
    card_id: int,
    data: ReportCardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    card = db.query(ReportCard).filter(ReportCard.id == card_id).first()
    if not card:
        raise HTTPException(404, "Report card not found")
    return update_report_card(db, card, data)

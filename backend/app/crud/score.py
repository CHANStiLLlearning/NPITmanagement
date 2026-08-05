from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.score import ScoreCategory, StudentScore, ReportCard
from app.models.student import Student
from app.schemas.score import (
    ScoreCategoryCreate, ScoreCategoryUpdate,
    StudentScoreUpsert, StudentResult, ReportCardUpdate,
)


# ── Grade engine ───────────────────────────────────────
GRADE_TABLE = [
    (97, "A+", 4.0), (93, "A",  4.0), (90, "A-", 3.7),
    (87, "B+", 3.3), (83, "B",  3.0), (80, "B-", 2.7),
    (77, "C+", 2.3), (73, "C",  2.0), (70, "C-", 1.7),
    (67, "D+", 1.3), (63, "D",  1.0), (60, "D-", 0.7),
    (0,  "F",  0.0),
]

def compute_letter_grade(score: float) -> tuple[str, float]:
    for threshold, letter, gpa in GRADE_TABLE:
        if score >= threshold:
            return letter, gpa
    return "F", 0.0


def compute_weighted_total(
    categories: list[ScoreCategory],
    scores_map: dict[int, Optional[float]],
) -> float:
    """
    weighted_total = Σ (score / max_score * weight_percent)
    Skips categories with no score yet.
    """
    total_weight = 0.0
    total_value  = 0.0
    for cat in categories:
        raw = scores_map.get(cat.id)
        if raw is None:
            continue
        pct = (raw / cat.max_score) * 100.0
        total_value  += pct * cat.weight_percent
        total_weight += cat.weight_percent
    if total_weight == 0:
        return 0.0
    # Normalize in case weights don't add to 100
    return round(total_value / total_weight, 2)


# ── Category CRUD ──────────────────────────────────────
def create_category(db: Session, data: ScoreCategoryCreate, teacher_email: str) -> ScoreCategory:
    cat = ScoreCategory(**data.model_dump(), teacher_email=teacher_email)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def get_categories(
    db: Session,
    class_name: Optional[str] = None,
    subject: Optional[str] = None,
    term: Optional[str] = None,
    teacher_email: Optional[str] = None,
) -> list[ScoreCategory]:
    q = db.query(ScoreCategory)
    if class_name:    q = q.filter(ScoreCategory.class_name == class_name)
    if subject:       q = q.filter(ScoreCategory.subject == subject)
    if term:          q = q.filter(ScoreCategory.term == term)
    if teacher_email: q = q.filter(ScoreCategory.teacher_email == teacher_email)
    return q.order_by(ScoreCategory.id).all()


def update_category(db: Session, cat: ScoreCategory, data: ScoreCategoryUpdate) -> ScoreCategory:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


def delete_category(db: Session, cat: ScoreCategory):
    db.delete(cat)
    db.commit()


# ── Score CRUD (upsert) ────────────────────────────────
def upsert_score(db: Session, category_id: int, data: StudentScoreUpsert) -> StudentScore:
    student = db.query(Student).filter(Student.student_id == data.student_sid).first()
    if not student:
        raise ValueError(f"Student '{data.student_sid}' not found")

    existing = db.query(StudentScore).filter(
        StudentScore.student_sid == data.student_sid,
        StudentScore.category_id == category_id,
    ).first()

    if existing:
        if data.score is not None:
            existing.score = data.score
        if data.teacher_comment is not None:
            existing.teacher_comment = data.teacher_comment
        db.commit()
        db.refresh(existing)
        return existing
    else:
        cat = db.query(ScoreCategory).filter(ScoreCategory.id == category_id).first()
        entry = StudentScore(
            student_id=student.id,
            student_sid=data.student_sid,
            student_name=f"{student.first_name} {student.last_name}",
            class_name=student.class_name,
            category_id=category_id,
            score=data.score,
            teacher_comment=data.teacher_comment,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry


def get_scores_for_category(db: Session, category_id: int) -> list[StudentScore]:
    return db.query(StudentScore).filter(StudentScore.category_id == category_id).all()


def get_scores_for_class(
    db: Session,
    class_name: str,
    subject: Optional[str] = None,
    term: Optional[str] = None,
) -> dict:
    """Return all categories + scores for a class/subject/term grouped for grade book."""
    categories = get_categories(db, class_name=class_name, subject=subject, term=term)
    if not categories:
        return {"categories": [], "students": []}

    cat_ids = [c.id for c in categories]
    all_scores = db.query(StudentScore).filter(StudentScore.category_id.in_(cat_ids)).all()

    # Build student list from the class
    students = db.query(Student).filter(Student.class_name == class_name, Student.is_active == True).all()

    # Map: student_sid → {category_id: score}
    score_map: dict[str, dict[int, Optional[float]]] = {}
    comment_map: dict[str, str] = {}
    for s in all_scores:
        if s.student_sid not in score_map:
            score_map[s.student_sid] = {}
        score_map[s.student_sid][s.category_id] = s.score
        if s.teacher_comment:
            comment_map[s.student_sid] = s.teacher_comment

    results: list[StudentResult] = []
    for st in students:
        sid = st.student_id
        scores = score_map.get(sid, {})
        weighted = compute_weighted_total(categories, scores)
        letter, gpa = compute_letter_grade(weighted)
        results.append(StudentResult(
            student_sid=sid,
            student_name=f"{st.first_name} {st.last_name}",
            class_name=class_name,
            scores={str(c.id): scores.get(c.id) for c in categories},
            weighted_total=weighted,
            letter_grade=letter,
            gpa=gpa,
        ))

    # Assign ranks by weighted_total descending
    results.sort(key=lambda r: r.weighted_total, reverse=True)
    for i, r in enumerate(results, 1):
        r.rank = i

    return {"categories": categories, "students": results}


# ── Report Card CRUD ───────────────────────────────────
def generate_report_cards(
    db: Session,
    class_name: str,
    subject: str,
    term: str,
) -> list[ReportCard]:
    """Calculate and upsert report cards for an entire class."""
    data = get_scores_for_class(db, class_name=class_name, subject=subject, term=term)
    cards = []
    for sr in data["students"]:
        existing = db.query(ReportCard).filter(
            ReportCard.student_sid == sr.student_sid,
            ReportCard.class_name == class_name,
            ReportCard.subject == subject,
            ReportCard.term == term,
        ).first()
        if existing:
            existing.weighted_total = sr.weighted_total
            existing.letter_grade   = sr.letter_grade
            existing.gpa            = sr.gpa
            existing.rank           = sr.rank
            db.commit()
            db.refresh(existing)
            cards.append(existing)
        else:
            student = db.query(Student).filter(Student.student_id == sr.student_sid).first()
            card = ReportCard(
                student_id=student.id if student else 0,
                student_sid=sr.student_sid,
                student_name=sr.student_name,
                class_name=class_name,
                subject=subject,
                term=term,
                weighted_total=sr.weighted_total,
                letter_grade=sr.letter_grade,
                gpa=sr.gpa,
                rank=sr.rank,
            )
            db.add(card)
            db.commit()
            db.refresh(card)
            cards.append(card)
    return cards


def get_report_cards(
    db: Session,
    class_name: Optional[str] = None,
    subject: Optional[str] = None,
    term: Optional[str] = None,
    student_sid: Optional[str] = None,
) -> list[ReportCard]:
    q = db.query(ReportCard)
    if class_name:   q = q.filter(ReportCard.class_name == class_name)
    if subject:      q = q.filter(ReportCard.subject == subject)
    if term:         q = q.filter(ReportCard.term == term)
    if student_sid:  q = q.filter(ReportCard.student_sid == student_sid)
    return q.order_by(ReportCard.rank).all()


def update_report_card(db: Session, card: ReportCard, data: ReportCardUpdate) -> ReportCard:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(card, k, v)
    if data.status == "published":
        card.published_at = datetime.utcnow()
    db.commit()
    db.refresh(card)
    return card

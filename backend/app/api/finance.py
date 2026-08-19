from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, RoleEnum
from app.models.student import Student
from app.models.finance import (
    FeeCategory, FeeStructure, Invoice, InvoiceItem, Payment,
    InvoiceStatusEnum, PaymentMethodEnum
)
from pydantic import BaseModel

router = APIRouter()

# Pydantic schemas
class FeeCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class FeeStructureCreate(BaseModel):
    fee_category_id: int
    academic_year: str = "2025-2026"
    grade_name: Optional[str] = "Year 1"
    amount: float

class InvoiceItemCreate(BaseModel):
    description: str
    amount: float

class InvoiceCreate(BaseModel):
    student_id: int
    academic_year: str = "2025-2026"
    term_name: str = "Semester 1"
    due_date: Optional[datetime] = None
    items: List[InvoiceItemCreate]
    discount_total: float = 0.0

class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    method: str = "cash"  # cash, bank_transfer, khqr, card
    reference: Optional[str] = None
    notes: Optional[str] = None


@router.get("/summary")
def get_finance_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Financial KPI Metrics & Overview."""
    invoices = db.query(Invoice).all()
    total_billed = sum(inv.grand_total for inv in invoices)
    total_paid = sum(inv.paid_amount for inv in invoices)
    total_unpaid = total_billed - total_paid

    unpaid_count = sum(1 for inv in invoices if inv.status == InvoiceStatusEnum.unpaid)
    partial_count = sum(1 for inv in invoices if inv.status == InvoiceStatusEnum.partial)
    paid_count = sum(1 for inv in invoices if inv.status == InvoiceStatusEnum.paid)

    recent_payments = (
        db.query(Payment)
        .order_by(Payment.payment_date.desc())
        .limit(5)
        .all()
    )

    return {
        "total_billed": round(total_billed, 2),
        "total_paid": round(total_paid, 2),
        "total_outstanding": round(total_unpaid, 2),
        "total_invoices": len(invoices),
        "unpaid_invoices_count": unpaid_count,
        "partial_invoices_count": partial_count,
        "paid_invoices_count": paid_count,
        "recent_payments": [
            {
                "id": p.id,
                "amount": p.amount,
                "method": p.method,
                "reference": p.reference,
                "date": p.payment_date.strftime("%Y-%m-%d %H:%M"),
                "student_name": f"{p.student.first_name} {p.student.last_name}" if p.student else "Student"
            }
            for p in recent_payments
        ]
    }


@router.get("/invoices")
def list_invoices(
    status: Optional[str] = None,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List student invoices."""
    q = db.query(Invoice)
    if status:
        q = q.filter(Invoice.status == status)
    if student_id:
        q = q.filter(Invoice.student_id == student_id)

    invoices = q.order_by(Invoice.created_at.desc()).all()
    results = []
    for inv in invoices:
        st = inv.student
        results.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "student_id": inv.student_id,
            "student_name": f"{st.first_name} {st.last_name}" if st else "N/A",
            "student_code": st.student_id if st else "N/A",
            "academic_year": inv.academic_year,
            "term_name": inv.term_name,
            "issue_date": inv.issue_date.strftime("%Y-%m-%d") if inv.issue_date else "",
            "due_date": inv.due_date.strftime("%Y-%m-%d") if inv.due_date else "",
            "grand_total": inv.grand_total,
            "paid_amount": inv.paid_amount,
            "status": inv.status,
            "items": [{"description": it.description, "amount": it.amount} for it in inv.items]
        })
    return results


@router.post("/invoices", status_code=status.HTTP_201_CREATED)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate a new tuition/fee invoice for a student."""
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Only admins can generate invoices.")

    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    subtotal = sum(item.amount for item in payload.items)
    grand_total = max(0.0, subtotal - payload.discount_total)
    inv_num = f"INV-{datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

    invoice = Invoice(
        student_id=student.id,
        academic_year=payload.academic_year,
        term_name=payload.term_name,
        invoice_number=inv_num,
        issue_date=datetime.utcnow(),
        due_date=payload.due_date,
        subtotal=subtotal,
        discount_total=payload.discount_total,
        grand_total=grand_total,
        paid_amount=0.0,
        status=InvoiceStatusEnum.unpaid
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    for it in payload.items:
        db.add(InvoiceItem(invoice_id=invoice.id, description=it.description, amount=it.amount))
    db.commit()

    return {"message": "Invoice created successfully", "invoice_number": inv_num, "id": invoice.id}


@router.post("/payments", status_code=status.HTTP_201_CREATED)
def record_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Record a payment (Cash, Bank, KHQR) against an invoice."""
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Only admins can record payments.")

    invoice = db.query(Invoice).filter(Invoice.id == payload.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    payment = Payment(
        invoice_id=invoice.id,
        student_id=invoice.student_id,
        amount=payload.amount,
        method=PaymentMethodEnum(payload.method) if payload.method in PaymentMethodEnum.__members__ else PaymentMethodEnum.cash,
        reference=payload.reference,
        notes=payload.notes,
        received_by=f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email
    )
    db.add(payment)

    # Update invoice paid status
    invoice.paid_amount += payload.amount
    if invoice.paid_amount >= invoice.grand_total:
        invoice.status = InvoiceStatusEnum.paid
    elif invoice.paid_amount > 0:
        invoice.status = InvoiceStatusEnum.partial

    db.commit()
    return {"message": "Payment recorded successfully", "payment_id": payment.id, "new_status": invoice.status}


@router.get("/fee-categories")
def list_fee_categories(db: Session = Depends(get_db)):
    return db.query(FeeCategory).all()


@router.post("/fee-categories")
def create_fee_category(payload: FeeCategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    cat = FeeCategory(name=payload.name, description=payload.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

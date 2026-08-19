from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.session import Base

class InvoiceStatusEnum(str, enum.Enum):
    unpaid = "unpaid"
    partial = "partial"
    paid = "paid"
    void = "void"

class PaymentMethodEnum(str, enum.Enum):
    cash = "cash"
    bank_transfer = "bank_transfer"
    khqr = "khqr"
    card = "card"
    other = "other"

class FeeCategory(Base):
    __tablename__ = "fee_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)  # e.g., "Tuition Fee", "Lab & Equipment", "Registration"
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    structures = relationship("FeeStructure", back_populates="category", cascade="all, delete-orphan")


class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(Integer, primary_key=True, index=True)
    fee_category_id = Column(Integer, ForeignKey("fee_categories.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(50), default="2025-2026")
    grade_name = Column(String(50), nullable=True)  # e.g., "Year 1", "Grade 10"
    amount = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    category = relationship("FeeCategory", back_populates="structures")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(50), default="2025-2026")
    term_name = Column(String(50), default="Semester 1")
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    issue_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    subtotal = Column(Float, default=0.0)
    discount_total = Column(Float, default=0.0)
    tax_total = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    status = Column(Enum(InvoiceStatusEnum), default=InvoiceStatusEnum.unpaid, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    invoice = relationship("Invoice", back_populates="items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    amount = Column(Float, nullable=False)
    method = Column(Enum(PaymentMethodEnum), default=PaymentMethodEnum.cash)
    reference = Column(String(100), nullable=True)  # e.g., Bank transaction ID / KHQR reference
    received_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
    student = relationship("Student")


class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(50), default="2025-2026")
    amount = Column(Float, nullable=False)
    scholarship_type = Column(String(50), default="percentage")  # percentage, fixed
    sponsor_name = Column(String(150), default="NPIT Institutional Merit")
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student")

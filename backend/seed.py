"""
School Management System — Database Seeder Script
Initializes default super admin, academic structure, subjects, sample teachers, and students.
"""
from datetime import date, datetime
from app.db.session import SessionLocal, engine, Base
from app.models.user import User, RoleEnum
from app.core.security import get_password_hash
from app.models.academic import AcademicYear, Semester, Grade, Section, Subject
from app.models.student import Student
from app.models.teacher import Teacher
import qrcode
import io
import base64


def generate_qr(text: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Super Admin User
        admin = db.query(User).filter(User.email == "admin@school.com").first()
        if not admin:
            admin = User(
                email="admin@school.com",
                hashed_password=get_password_hash("admin123"),
                first_name="Super",
                last_name="Admin",
                role=RoleEnum.super_admin,
                is_active=True,
                is_superuser=True,
            )
            db.add(admin)
            print("[OK] Created Super Admin: admin@school.com / admin123")

        # 2. Academic Year & Semester
        ay = db.query(AcademicYear).filter(AcademicYear.name == "2025-2026").first()
        if not ay:
            ay = AcademicYear(name="2025-2026", start_date=date(2025, 9, 1), end_date=date(2026, 6, 30), is_current=True)
            db.add(ay)
            db.commit()
            db.refresh(ay)

            sem1 = Semester(academic_year_id=ay.id, name="Semester 1", start_date=date(2025, 9, 1), end_date=date(2026, 1, 31), is_current=True)
            db.add(sem1)

        # 3. Grades & Sections
        for level in range(1, 13):
            g_name = f"Grade {level}"
            gr = db.query(Grade).filter(Grade.name == g_name).first()
            if not gr:
                gr = Grade(name=g_name, level=level)
                db.add(gr)
                db.commit()
                db.refresh(gr)
                sec = Section(grade_id=gr.id, name="Section A", room_number=f"Room {100 + level}")
                db.add(sec)

        # 4. Subjects
        subjects_data = [
            ("Mathematics", "MATH101", "Core"),
            ("Science", "SCI101", "Core"),
            ("English", "ENG101", "Core"),
            ("History", "HIS101", "Core"),
            ("Physics", "PHY101", "Elective"),
            ("Computer Science", "CS101", "Elective"),
        ]
        for sname, scode, stype in subjects_data:
            if not db.query(Subject).filter(Subject.code == scode).first():
                db.add(Subject(name=sname, code=scode, type=stype))

        # 5. Sample Teachers
        teachers_data = [
            ("TCH-2025-0001", "Sarah", "Jenkins", "sarah.jenkins@school.com", "Mathematics", "Ph.D. in Math", 4.9),
            ("TCH-2025-0002", "Robert", "Chen", "robert.chen@school.com", "Science", "M.Sc. Physics", 4.7),
            ("TCH-2025-0003", "Emma", "Watson", "emma.watson@school.com", "English", "M.A. English", 4.8),
        ]
        for tid, fn, ln, email, dept, qual, rating in teachers_data:
            if not db.query(Teacher).filter(Teacher.teacher_id == tid).first():
                t = Teacher(
                    teacher_id=tid, first_name=fn, last_name=ln, email=email,
                    department=dept, qualification=qual, performance_rating=rating,
                    qr_code=generate_qr(tid), status="Active"
                )
                db.add(t)
                # Create user login for teacher
                if not db.query(User).filter(User.email == email).first():
                    db.add(User(email=email, hashed_password=get_password_hash("teacher123"), first_name=fn, last_name=ln, role=RoleEnum.teacher))

        db.commit()
        print("[OK] Database successfully seeded with Academic Structure!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

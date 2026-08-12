from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.security_middleware import SecurityHeadersMiddleware

app = FastAPI(
    title="School Management System API",
    description="Production-Ready API for managing a school.",
    version="1.0.0"
)

import os

# CORS configuration
cors_env = os.getenv("CORS_ORIGINS", "").strip()
if cors_env and cors_env != "*":
    origins = [o.strip() for o in cors_env.split(",") if o.strip()]
    allow_credentials = True
else:
    origins = ["*"]
    allow_credentials = False

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

from app.db.session import engine, Base, SessionLocal
from app.models.user import User, RoleEnum
from app.core.security import verify_password, get_password_hash

@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
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
                db.commit()
                print("[STARTUP] Auto-created Super Admin: admin@school.com / admin123")
            else:
                # Auto-repair stale/incompatible password hash (e.g. passlib -> bcrypt migration)
                if not verify_password("admin123", admin.hashed_password):
                    admin.hashed_password = get_password_hash("admin123")
                    db.commit()
                    print("[STARTUP] Repaired Super Admin password hash (was stale/incompatible)")
        finally:
            db.close()
    except Exception as e:
        print(f"[STARTUP DB ERROR] {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to the School Management System API"}

import os
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router
from app.api import auth, users, students, teachers, attendance, teaching_reports, scores, academic, analytics, files, search, audit_log, reports

# Mount uploads static directory
uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Mount API V1 router
app.include_router(api_router, prefix="/api/v1")

# Mount legacy root routes for seamless compatibility
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(students.router, prefix="/students", tags=["Students"])
app.include_router(teachers.router, prefix="/teachers", tags=["Teachers"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(teaching_reports.router, prefix="/teaching-reports", tags=["Teaching Reports"])
app.include_router(scores.router, prefix="/scores", tags=["Scores"])
app.include_router(academic.router, prefix="/academic", tags=["Academic Management"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(files.router, prefix="/files", tags=["File Manager"])
app.include_router(search.router, prefix="/search", tags=["Global Search"])
app.include_router(audit_log.router, prefix="/system-logs", tags=["Audit Log"])
app.include_router(reports.router, prefix="/reports-center", tags=["Reports Center"])

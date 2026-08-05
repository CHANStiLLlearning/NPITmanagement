from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="School Management System API",
    description="Production-Ready API for managing a school.",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000",
]

from app.core.security_middleware import SecurityHeadersMiddleware, RateLimiterMiddleware

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimiterMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the School Management System API"}

import os
from fastapi.staticfiles import StaticFiles

from app.api import auth, users, students, teachers, attendance, teaching_reports, scores, academic, analytics, files, search, audit_log, reports
from app.models import student as student_model
from app.models import teacher as teacher_model
from app.models import attendance as attendance_model
from app.models import teaching_report as teaching_report_model
from app.models import score as score_model
from app.models import academic as academic_model
from app.models import audit_log as audit_log_model

# Mount uploads static directory
uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=uploads_dir), name="uploads")

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

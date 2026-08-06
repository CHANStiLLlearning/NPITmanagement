from fastapi import APIRouter
from app.api import auth, users, students, teachers, attendance, teaching_reports, scores, academic, analytics, files, search, audit_log, reports

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["Teachers"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(teaching_reports.router, prefix="/teaching-reports", tags=["Teaching Reports"])
api_router.include_router(scores.router, prefix="/scores", tags=["Scores"])
api_router.include_router(academic.router, prefix="/academic", tags=["Academic Management"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(files.router, prefix="/files", tags=["File Manager"])
api_router.include_router(search.router, prefix="/search", tags=["Global Search"])
api_router.include_router(audit_log.router, prefix="/system-logs", tags=["Audit Log"])
api_router.include_router(reports.router, prefix="/reports-center", tags=["Reports Center"])

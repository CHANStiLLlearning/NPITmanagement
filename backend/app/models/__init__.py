from app.models.user import User
from app.models.session import UserSession
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.attendance import AttendanceRecord
from app.models.teaching_report import TeachingReport
from app.models.score import ScoreCategory, StudentScore, ReportCard
from app.models.academic import (
    AcademicYear, Semester, Grade, Section, Subject,
    TeacherAssignment, TimetableEntry, Holiday
)
from app.models.audit_log import AuditLog

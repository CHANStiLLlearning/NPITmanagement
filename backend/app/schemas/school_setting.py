from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class CampusInfo(BaseModel):
    name: str
    location: str
    is_primary: bool = False

class SchoolSettingBase(BaseModel):
    # General
    school_name_en: str
    school_name_kh: str
    short_code: Optional[str] = "NPIT"
    motto_en: Optional[str] = None
    motto_kh: Optional[str] = None
    about_text: Optional[str] = None

    # Branding
    logo_url: Optional[str] = None
    stamp_url: Optional[str] = None
    signature_url: Optional[str] = None
    principal_name: Optional[str] = None
    principal_title: Optional[str] = None

    # Contacts & Social
    email: Optional[str] = None
    secondary_email: Optional[str] = None
    phone: Optional[str] = None
    secondary_phone: Optional[str] = None
    website: Optional[str] = None
    telegram_channel: Optional[str] = None
    facebook_page: Optional[str] = None
    youtube_channel: Optional[str] = None
    address: Optional[str] = None
    campuses: Optional[List[Dict[str, Any]]] = None

    # Academic & Regional
    academic_year: Optional[str] = "2025-2026"
    current_semester: Optional[str] = "Semester 1"
    admission_year: Optional[str] = "2025-2026"
    grading_scale: Optional[str] = "GPA (4.0 Scale)"
    timezone: Optional[str] = "Asia/Phnom_Penh (GMT+7)"
    default_language: Optional[str] = "km"
    date_format: Optional[str] = "DD/MM/YYYY"
    currency: Optional[str] = "USD ($)"
    departments: Optional[List[str]] = None
    grade_levels: Optional[List[str]] = None

    # Notifications
    notification_sender_email: Optional[str] = None
    admin_alert_email: Optional[str] = None
    enable_attendance_alerts: Optional[bool] = True
    enable_grade_alerts: Optional[bool] = True
    enable_security_alerts: Optional[bool] = True

class SchoolSettingUpdate(SchoolSettingBase):
    pass

class SchoolSettingOut(SchoolSettingBase):
    id: int

    class Config:
        from_attributes = True

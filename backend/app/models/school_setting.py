from sqlalchemy import Column, Integer, String, Text, Boolean, JSON
from app.db.session import Base

class SchoolSetting(Base):
    __tablename__ = "school_settings"

    id = Column(Integer, primary_key=True, index=True)
    
    # 1. General & Basic Info
    school_name_en = Column(String(255), default="National Polytechnic Institute Techo Sen")
    school_name_kh = Column(String(255), default="វិទ្យាស្ថានជាតិពហុបច្ចេកទេសតេជោសែន (NPIT)")
    short_code = Column(String(50), default="NPIT")
    motto_en = Column(String(255), default="Knowledge, Skill, Integrity, Innovation")
    motto_kh = Column(String(255), default="ចំណេះដឹង ជំនាញ សីលធម៌ នវានុវត្តន៍")
    about_text = Column(Text, default="National Polytechnic Institute Techo Sen provides high quality technical and vocational education and training in Cambodia.")
    
    # 2. Branding & Signatures
    logo_url = Column(String(500), default="/npit-logo.png")
    stamp_url = Column(String(500), nullable=True)
    signature_url = Column(String(500), nullable=True)
    principal_name = Column(String(100), default="H.E. Director General")
    principal_title = Column(String(100), default="Director of NPIT")

    # 3. Contacts & Social Media
    email = Column(String(150), default="info@npit.edu.kh")
    secondary_email = Column(String(150), default="support@npit.edu.kh")
    phone = Column(String(50), default="+855 23 888 999")
    secondary_phone = Column(String(50), default="+855 12 345 678")
    website = Column(String(255), default="https://www.npit.edu.kh")
    telegram_channel = Column(String(255), default="https://t.me/npit_official")
    facebook_page = Column(String(255), default="https://facebook.com/npitcambodia")
    youtube_channel = Column(String(255), default="https://youtube.com/@npitcambodia")
    address = Column(Text, default="Phnom Penh, Kingdom of Cambodia")
    campuses = Column(JSON, default=lambda: [
        {"name": "Main Campus", "location": "Phnom Penh", "is_primary": True},
        {"name": "Techo Sen Innovation Center", "location": "Sen Sok, Phnom Penh", "is_primary": False}
    ])

    # 4. Academic Structure & Regional Formats
    academic_year = Column(String(50), default="2025-2026")
    current_semester = Column(String(50), default="Semester 1")
    admission_year = Column(String(50), default="2025-2026")
    grading_scale = Column(String(50), default="GPA (4.0 Scale)")
    timezone = Column(String(50), default="Asia/Phnom_Penh (GMT+7)")
    default_language = Column(String(20), default="km")
    date_format = Column(String(30), default="DD/MM/YYYY")
    currency = Column(String(20), default="USD ($)")
    departments = Column(JSON, default=lambda: [
        "Information Technology",
        "Electronics & Automation",
        "Mechanical Engineering",
        "Civil & Construction",
        "Automotive Engineering",
        "Business & Management"
    ])
    grade_levels = Column(JSON, default=lambda: [
        "Year 1 (Foundation)",
        "Year 2 (Associate)",
        "Year 3 (Bachelor)",
        "Year 4 (Senior Bachelor)"
    ])

    # 5. Notifications & Alerts
    notification_sender_email = Column(String(150), default="no-reply@npit.edu.kh")
    admin_alert_email = Column(String(150), default="admin@school.com")
    enable_attendance_alerts = Column(Boolean, default=True)
    enable_grade_alerts = Column(Boolean, default=True)
    enable_security_alerts = Column(Boolean, default=True)

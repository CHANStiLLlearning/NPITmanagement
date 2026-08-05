-- ============================================================
-- School Management System — Normalized PostgreSQL SQL Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE role_enum AS ENUM ('super_admin', 'admin', 'principal', 'teacher', 'student', 'parent');
CREATE TYPE attendance_status_enum AS ENUM ('present', 'late', 'absent', 'excused');
CREATE TYPE report_status_enum AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE category_type_enum AS ENUM ('assignment', 'quiz', 'midterm', 'final', 'practical', 'project', 'attendance', 'behavior', 'custom');

-- 1. Users & Auth
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role role_enum NOT NULL DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Academic Structure
CREATE TABLE academic_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    academic_year_id INT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    level INT NOT NULL DEFAULT 1,
    description TEXT
);

CREATE TABLE sections (
    id SERIAL PRIMARY KEY,
    grade_id INT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    room_number VARCHAR(50),
    capacity INT DEFAULT 30
);

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'Core',
    description TEXT
);

-- 3. Profiles
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(200) UNIQUE,
    gender VARCHAR(20),
    date_of_birth DATE,
    class_name VARCHAR(50),
    section VARCHAR(10),
    guardian_name VARCHAR(200),
    guardian_phone VARCHAR(50),
    guardian_email VARCHAR(200),
    address TEXT,
    qr_code TEXT,
    photo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    phone VARCHAR(50),
    qualification VARCHAR(200),
    department VARCHAR(100),
    salary NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Active',
    performance_rating FLOAT DEFAULT 5.0,
    photo_url VARCHAR(500),
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Teacher Assignments & Timetable
CREATE TABLE teacher_assignments (
    id SERIAL PRIMARY KEY,
    teacher_email VARCHAR(200) NOT NULL,
    teacher_name VARCHAR(200) NOT NULL,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_id INT REFERENCES grades(id) ON DELETE SET NULL,
    section_id INT REFERENCES sections(id) ON DELETE SET NULL,
    academic_year VARCHAR(100)
);

CREATE TABLE timetable_entries (
    id SERIAL PRIMARY KEY,
    day_of_week VARCHAR(20) NOT NULL,
    period_number INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grade_id INT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    section_id INT REFERENCES sections(id) ON DELETE SET NULL,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_name VARCHAR(200),
    room_number VARCHAR(50)
);

-- 5. Attendance
CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_sid VARCHAR(20) NOT NULL,
    student_name VARCHAR(200) NOT NULL,
    class_name VARCHAR(50),
    section VARCHAR(10),
    date DATE NOT NULL,
    time_in TIME,
    status attendance_status_enum DEFAULT 'present',
    scanned_by VARCHAR(200),
    scan_method VARCHAR(20) DEFAULT 'qr',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Teaching Reports
CREATE TABLE teaching_reports (
    id SERIAL PRIMARY KEY,
    teacher_email VARCHAR(200) NOT NULL,
    teacher_name VARCHAR(200) NOT NULL,
    report_date DATE NOT NULL,
    class_name VARCHAR(50),
    subject VARCHAR(100),
    lesson_title VARCHAR(300),
    lesson_objective TEXT,
    teaching_method VARCHAR(200),
    activities TEXT,
    homework TEXT,
    student_participation TEXT,
    problems_faced TEXT,
    solutions_applied TEXT,
    next_lesson_plan TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    status report_status_enum DEFAULT 'draft',
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(200),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Scores & Report Cards
CREATE TABLE score_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_type category_type_enum NOT NULL,
    weight_percent FLOAT NOT NULL DEFAULT 0.0,
    max_score FLOAT NOT NULL DEFAULT 100.0,
    class_name VARCHAR(50),
    subject VARCHAR(100),
    term VARCHAR(50) DEFAULT 'Term 1',
    teacher_email VARCHAR(200),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_scores (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_sid VARCHAR(20) NOT NULL,
    student_name VARCHAR(200) NOT NULL,
    class_name VARCHAR(50),
    category_id INT NOT NULL REFERENCES score_categories(id) ON DELETE CASCADE,
    score FLOAT,
    teacher_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_category UNIQUE (student_sid, category_id)
);

CREATE TABLE report_cards (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_sid VARCHAR(20) NOT NULL,
    student_name VARCHAR(200) NOT NULL,
    class_name VARCHAR(50),
    subject VARCHAR(100),
    term VARCHAR(50),
    weighted_total FLOAT,
    letter_grade VARCHAR(5),
    gpa FLOAT,
    rank INT,
    teacher_comment TEXT,
    principal_comment TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_report_card UNIQUE (student_sid, class_name, subject, term)
);

-- 8. Audit Logs & System Activity
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(200) NOT NULL,
    user_name VARCHAR(200),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance Optimization
CREATE INDEX idx_students_sid ON students(student_id);
CREATE INDEX idx_students_class ON students(class_name);
CREATE INDEX idx_teachers_tid ON teachers(teacher_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_sid ON attendance_records(student_sid);
CREATE INDEX idx_teaching_reports_teacher ON teaching_reports(teacher_email);
CREATE INDEX idx_teaching_reports_date ON teaching_reports(report_date);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

# វិទ្យាស្ថានជាតិពហុបច្ចេកទេសតេជោសែន (NPIT)
## 🏫 School Management & QR Attendance System

![React](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-009688)
![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%20v4-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

A modern, full-stack, enterprise-grade School Management & Attendance System designed for **Techo Sen National Institute of Polytechnic (NPIT)**. Built with React (TypeScript), TailwindCSS, FastAPI, and SQLAlchemy.

---

## 🌟 Key Features

### 🔐 1. Role-Based Access Control (RBAC) & Privacy Isolation
- **Supported Roles**: `Super Admin`, `Admin`, `Teacher`, `Student`, `Parent`.
- **Student Privacy Protection**: Students only see their own attendance records, daily/weekly metrics, and individual analytics. Admin & Teachers retain full institutional access.

### 📷 2. Real-Time QR Code Student Attendance
- Instant QR code scanning for quick student check-in.
- Automatic duplicate scan detection & status handling (Present, Late, Absent, Excused).
- Automatic background marking for unscanned students on active school days.

### 📊 3. Attendance Analytics & Export Center
- **Rich Interactive Reports**: Daily Log Summary, Weekly Trends (Monday–Friday), Monthly Aggregates, Heatmap View, and Individual Student Directories.
- **CSV Exporting**: Instant CSV generation for all attendance views and institutional statistics.

### 🎓 4. Academic & Class Management
- Management of Subjects, Classes, and Teacher-Subject assignments.
- Weighted Gradebook, GPA calculations, and Student Ranking tables.

### 👨‍🏫 5. Student & Teacher Management
- Dynamic QR code generation for every student.
- Photo avatar uploads and profile management.
- Active/Inactive status toggle.

### 📁 6. System Audit Logs & File Manager
- Real-time event logger tracking user actions, IP addresses, and module changes.
- Integrated File Manager for document and media uploads.

### 📱 7. Full Mobile & Tablet Responsiveness
- Optimized for iPhone, iPad (iOS Safari dynamic viewport `100dvh`), and Android devices.
- Touch-friendly drawer navigation, responsive data tables with horizontal scroll wrappers, and dark/light theme switching.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS, Vanilla CSS Tokens
- **UI & Animation**: Lucide Icons, Framer Motion
- **Data Visualization**: Chart.js (`react-chartjs-2`)
- **State & Query Management**: React Query (`@tanstack/react-query`)
- **Typography**: Kantumruy Pro & Battambang (Khmer), Inter (Latin)

### **Backend**
- **Framework**: Python 3.10+ & FastAPI
- **ORM & Database**: SQLAlchemy & SQLite (`school.db`)
- **Security & Auth**: OAuth2 with JWT Tokens (Jose), Passlib (Bcrypt)
- **Server**: Uvicorn ASGI Server

---

## 📁 Directory Structure

```
schoolmanagement/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers (auth, attendance, students, teachers, reports)
│   │   ├── core/         # Security middleware & JWT configuration
│   │   ├── crud/         # Database operations & business logic
│   │   ├── db/           # SQLAlchemy database session setup
│   │   ├── models/       # Database models (User, Student, Teacher, Attendance, ReportCard)
│   │   └── schemas/      # Pydantic schemas for data validation
│   ├── main.py           # FastAPI application entry point
│   ├── requirements.txt  # Python dependencies
│   └── school.db         # SQLite database file
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components (Layout, Sidebar, Header, Breadcrumbs, Modals)
│   │   ├── contexts/     # Auth and Theme context providers
│   │   ├── pages/        # Page views (Dashboard, AttendanceReports, Students, Teachers, etc.)
│   │   ├── index.css     # Design tokens & Khmer font styling
│   │   └── main.tsx      # React root entry point
│   ├── index.html        # Main HTML & Google Font imports
│   └── package.json      # Node dependencies
└── README.md
```

---

## 🚀 Getting Started

### **Prerequisites**
- **Node.js** (v18.0 or higher)
- **Python** (v3.10 or higher)
- **Git**

---

### **1. Clone the Repository**
```bash
git clone https://github.com/CHANStiLLlearning/NPITmanagement.git
cd NPITmanagement
```

---

### **2. Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
> 📍 **API Documentation**: Open [http-[# 127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser to view the interactive Swagger API documentation.

---

### **3. Frontend Setup**
Open a new terminal tab/window:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
> 📍 **Frontend Application**: Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Default Credentials

| User Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@school.com` | `admin123` |
| **Student** | `student1@school.com` | `Student@123` |

---

## 📄 License
This project is developed for **Techo Sen National Institute of Polytechnic (NPIT)** and is licensed under the [MIT License](LICENSE).

# Security Policy & Deployment Guidelines

This document outlines the security architecture and deployment requirements for the **NPIT School Management System**.

---

## 1. HTTPS Requirement for Web Camera Access (QR Attendance)

- **Requirement**: The Web Camera API (`navigator.mediaDevices.getUserMedia`) used in the QR Code Attendance module ([QRAttendance.tsx](file:///c:/Users/Dell/Desktop/schoolmanament/frontend/src/pages/attendance/QRAttendance.tsx)) **requires an HTTPS connection** when deployed online to a production domain or remote server.
- **Browser Security Policy**: Modern web browsers (Chrome, Safari, Firefox, Edge) treat non-localhost `http://` origins as insecure contexts and will explicitly block camera stream requests.
- **Production Action**: Ensure an SSL/TLS certificate (e.g., Let's Encrypt, Cloudflare) is provisioned for your frontend domain and reverse proxy (e.g., NGINX / Caddy).

---

## 2. Access Control & Role-Based Access Control (RBAC)

- **Backend Enforcement**: All sensitive FastAPI routers (`/users`, `/students`, `/teachers`, `/scores`, `/system-logs`) must enforce explicit user authentication and role verification.
- **Role Dependencies**:
  - `get_current_active_user`: Enforces valid JWT token and active user account state.
  - `get_current_active_superuser`: Restricts administrative operations (user creation, deletion, audit log access) strictly to `super_admin` users.
- **Guidelines**:
  - Never rely solely on frontend UI hiding (e.g. hidden buttons) for access control; always enforce backend route protection via `Depends(...)` in FastAPI route signatures.

---

## 3. Production Database Security

- **Strong Passwords**: When deploying PostgreSQL in production, generate strong, unique passwords for `POSTGRES_USER` and `POSTGRES_PASSWORD` (do not use default development values like `adminpassword`).
- **Restricted Port Access**:
  - Do not expose port `5432` directly to public `0.0.0.0` interfaces in [docker-compose.yml](file:///c:/Users/Dell/Desktop/schoolmanament/docker-compose.yml).
  - Limit container port exposure to `127.0.0.1:5432:5432` or keep database networking strictly internal to the Docker network (`db:5432`).
- **Secrets Management**: Keep secret keys (`SECRET_KEY`, database credentials) in environment variables (`.env`) and never commit `.env` files to public version control.

---

## Summary Checklist for Deployment

- [x] Create [.gitignore](file:///c:/Users/Dell/Desktop/schoolmanament/.gitignore) to exclude `.env` secrets from Git tracking.
- [x] Restrict database port binding in [docker-compose.yml](file:///c:/Users/Dell/Desktop/schoolmanament/docker-compose.yml).
- [ ] Configure NGINX / Caddy reverse proxy with HTTPS (SSL/TLS certificate).
- [ ] Set unique `SECRET_KEY` and strong database passwords in production `.env`.

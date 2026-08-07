import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base, get_db
from app.models.user import User, RoleEnum
from app.core.security import get_password_hash

from sqlalchemy.pool import StaticPool

SQLALCHEMY_TEST_DATABASE_URL = "sqlite://"
test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)
auth_headers = {}

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    if not db.query(User).filter(User.email == "admin@school.com").first():
        db.add(User(
            email="admin@school.com",
            hashed_password=get_password_hash("admin123"),
            first_name="Admin",
            last_name="User",
            role=RoleEnum.super_admin,
            is_active=True,
            is_superuser=True
        ))
        db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_auth_login_failed():
    response = client.post(
        "/auth/login",
        data={"username": "wrong@school.com", "password": "wrongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 401


def test_auth_login_success():
    global auth_headers
    response = client.post(
        "/auth/login",
        data={"username": "admin@school.com", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    token = data["access_token"]
    auth_headers["Authorization"] = f"Bearer {token}"


def test_protected_routes_unauthorized():
    response = client.get("/students/")
    assert response.status_code == 401


def test_global_search():
    response = client.get("/search/?q=Admin", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert "total_results" in data


def test_system_logs():
    response = client.get("/system-logs/", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_reports_summary():
    response = client.get("/reports-center/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_students" in data
    assert "attendance_rate" in data


def test_public_register_and_login():
    import uuid
    unique_email = f"student_{uuid.uuid4().hex[:6]}@school.com"
    # Register new user with mixed case and leading/trailing spaces
    reg_response = client.post(
        "/auth/register",
        json={
            "email": f"  {unique_email.upper()}  ",
            "password": "studentpassword123",
            "first_name": "New",
            "last_name": "Student",
            "role": "student"
        }
    )
    assert reg_response.status_code == 201

    # Login with new user using lowercase email
    login_response = client.post(
        "/auth/login",
        data={"username": unique_email.lower(), "password": "studentpassword123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


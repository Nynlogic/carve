import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure test settings
os.environ["STORAGE_MODE"] = "local"
os.environ["SECRET_KEY"] = "test-secret-key-careflow-test-suite"

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.doctor import AvailabilitySlot, DoctorProfile
from app.models.patient import PatientProfile
from app.models.user import User, UserRole

# In-memory test sqlite engine
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for a test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Provide a TestClient with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_admin(db_session):
    user = User(
        email="admin.test@careflow.health",
        hashed_password="hashed_test_pass",
        full_name="Admin Test",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_doctor(db_session):
    user = User(
        email="doctor.test@careflow.health",
        hashed_password="hashed_test_pass",
        full_name="Dr. Test MD",
        role=UserRole.DOCTOR,
        is_active=True
    )
    db_session.add(user)
    db_session.flush()

    profile = DoctorProfile(
        user_id=user.id,
        specialization="Cardiology",
        license_number="LIC-TEST-001",
        consultation_fee=150.0,
        is_verified=True
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_patient(db_session):
    user = User(
        email="patient.test@careflow.health",
        hashed_password="hashed_test_pass",
        full_name="Patient Test",
        role=UserRole.PATIENT,
        is_active=True
    )
    db_session.add(user)
    db_session.flush()

    profile = PatientProfile(
        user_id=user.id,
        blood_group="O+",
        allergies="None"
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(test_admin):
    return create_access_token(
        subject=test_admin.id,
        role=test_admin.role.value,
        email=test_admin.email,
        full_name=test_admin.full_name
    )


@pytest.fixture
def doctor_token(test_doctor):
    return create_access_token(
        subject=test_doctor.id,
        role=test_doctor.role.value,
        email=test_doctor.email,
        full_name=test_doctor.full_name
    )


@pytest.fixture
def patient_token(test_patient):
    return create_access_token(
        subject=test_patient.id,
        role=test_patient.role.value,
        email=test_patient.email,
        full_name=test_patient.full_name
    )

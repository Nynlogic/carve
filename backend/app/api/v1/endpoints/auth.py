from datetime import datetime, time, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.audit_logger import extract_client_info, log_audit_event
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.doctor import AvailabilitySlot, DoctorProfile
from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse
from app.services.cognito_service import cognito_service

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new patient, doctor, or admin account with full clinical profile."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # AWS Cognito sync if configured
    cognito_sub = None
    if settings.USE_AWS_COGNITO:
        try:
            cognito_sub = cognito_service.register_user(
                email=user_in.email,
                password=user_in.password,
                full_name=user_in.full_name,
                role=user_in.role.value
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Identity provider registration failed: {str(e)}"
            )

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        phone=user_in.phone,
        cognito_sub=cognito_sub,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Automatically provision associated profile based on role
    if user_in.role == UserRole.DOCTOR:
        avatar = user_in.avatar_url or "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&q=80"
        doctor_profile = DoctorProfile(
            user_id=new_user.id,
            specialization=user_in.specialization or "General Medicine",
            license_number=user_in.license_number or f"MD-{new_user.id:05d}",
            consultation_fee=user_in.consultation_fee or 120.0,
            experience_years=user_in.experience_years or 5,
            hospital_affiliation=user_in.hospital_affiliation or "CareFlow Medical Center",
            avatar_url=avatar,
            bio=user_in.bio or f"Board-certified physician in {user_in.specialization or 'General Medicine'}.",
            rating=5.0,
            total_reviews=1,
            is_verified=True
        )
        db.add(doctor_profile)
        db.flush()

        # Provision Monday-Friday 9:00 - 17:00 availability slots automatically
        for day_idx in range(5):
            slot = AvailabilitySlot(
                doctor_id=doctor_profile.id,
                day_of_week=day_idx,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True
            )
            db.add(slot)

    elif user_in.role == UserRole.PATIENT:
        patient_profile = PatientProfile(
            user_id=new_user.id,
            date_of_birth=user_in.date_of_birth,
            gender=user_in.gender,
            blood_group=user_in.blood_group,
            emergency_contact=user_in.emergency_contact,
            allergies=user_in.allergies,
            chronic_conditions=user_in.chronic_conditions,
            insurance_provider=user_in.insurance_provider,
            insurance_policy_number=user_in.insurance_policy_number
        )
        db.add(patient_profile)

    db.commit()
    db.refresh(new_user)

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=new_user.id,
        actor_email=new_user.email,
        actor_role=new_user.role.value,
        action="USER_REGISTRATION",
        resource_type="User",
        resource_id=str(new_user.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"],
        details={"email": new_user.email, "role": new_user.role.value}
    )

    return new_user


@router.post("/login", response_model=Token)
def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Authenticate user and return JWT access token."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated. Contact clinic administrator."
        )

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        email=user.email,
        full_name=user.full_name,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=user.id,
        actor_email=user.email,
        actor_role=user.role.value,
        action="LOGIN_SUCCESS",
        resource_type="User",
        resource_id=str(user.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"]
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "name": user.full_name,
        "email": user.email
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Retrieve full profile details for the authenticated user."""
    return current_user

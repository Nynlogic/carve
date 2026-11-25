from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.PATIENT


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    
    # Doctor onboarding fields
    specialization: Optional[str] = "General Medicine"
    license_number: Optional[str] = None
    consultation_fee: Optional[float] = 100.0
    experience_years: Optional[int] = 5
    hospital_affiliation: Optional[str] = "CareFlow Medical Group"
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Patient onboarding fields
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    email: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


class PatientProfileResponse(BaseModel):
    id: int
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    patient_profile: Optional[PatientProfileResponse] = None

    class Config:
        from_attributes = True

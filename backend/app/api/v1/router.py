from fastapi import APIRouter

from app.api.v1.endpoints import (
    analytics,
    appointments,
    audit,
    auth,
    consultations,
    doctors,
    medical_records,
    notifications,
    prescriptions,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Access"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Profiles"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["Doctors & Schedules"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments & Telemedicine"])
api_router.include_router(consultations.router, prefix="/consultations", tags=["Clinical SOAP Notes"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["Electronic Prescriptions (e-Rx)"])
api_router.include_router(medical_records.router, prefix="/medical-records", tags=["Encrypted Medical Documents"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Clinic Analytics & KPIs"])
api_router.include_router(audit.router, prefix="/audit", tags=["HIPAA Audit Trail"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications & Alerts"])

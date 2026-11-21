"""
CareFlow Clean Canvas Reset Script.
Wipes all pre-seeded doctors, patients, appointments, consultation notes,
prescriptions, and medical records, keeping ONLY the Administrator account.
This provides a 100% clean slate for you to add your own real doctors and patients!
"""
from app.core.database import SessionLocal
from app.models.appointment import Appointment
from app.models.consultation import ConsultationNote
from app.models.doctor import AvailabilitySlot, DoctorProfile
from app.models.medical_record import MedicalRecord
from app.models.notification import Notification
from app.models.patient import PatientProfile
from app.models.prescription import Prescription
from app.models.user import User, UserRole


def reset_to_clean_canvas():
    print("[CareFlow] Resetting database to a clean canvas...")
    db = SessionLocal()
    try:
        # Delete dependent data
        db.query(ConsultationNote).delete()
        db.query(Prescription).delete()
        db.query(MedicalRecord).delete()
        db.query(Appointment).delete()
        db.query(AvailabilitySlot).delete()
        db.query(DoctorProfile).delete()
        db.query(PatientProfile).delete()
        db.query(Notification).delete()

        # Delete non-admin users
        db.query(User).filter(User.role != UserRole.ADMIN).delete()

        db.commit()
        print("[CareFlow] ✅ Clean Canvas Activated!")
        print("All mock doctors and patients have been removed.")
        print("Only the Administrator account remains (admin@careflow.health).")
        print("You can now add your own real doctors and patients from the UI or API!")
    except Exception as e:
        db.rollback()
        print(f"[CareFlow] Error resetting canvas: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset_to_clean_canvas()

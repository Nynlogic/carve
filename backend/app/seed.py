"""
CareFlow Database Seeding Script.
Populates production-grade sample data for immediate live demo, recruiter walkthrough, and automated testing.
"""
import json
from datetime import date, datetime, time, timedelta, timezone

from app.core.database import Base, SessionLocal, engine
from app.core.security import get_password_hash
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.audit_log import AuditLog
from app.models.consultation import ConsultationNote
from app.models.doctor import AvailabilitySlot, DoctorProfile
from app.models.medical_record import DocumentCategory, MedicalRecord
from app.models.notification import Notification, NotificationType
from app.models.patient import PatientProfile
from app.models.prescription import Prescription
from app.models.user import User, UserRole


def seed_database():
    print("[CareFlow Seeder] Creating database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@careflow.health").first():
            print("[CareFlow Seeder] Database already contains seed data. Skipping.")
            return

        print("[CareFlow Seeder] Seeding users and roles...")
        
        # 1. Admin
        admin_user = User(
            email="admin@careflow.health",
            hashed_password=get_password_hash("CareFlowAdmin123!"),
            full_name="Dr. Eleanor Vance",
            role=UserRole.ADMIN,
            phone="+1 (555) 019-2831",
            is_active=True
        )
        db.add(admin_user)
        db.flush()

        # 2. Doctors
        doctors_data = [
            {
                "email": "dr.smith@careflow.health",
                "name": "Dr. Sarah Smith, MD",
                "phone": "+1 (555) 102-3948",
                "specialization": "Cardiology",
                "license": "MD-NY-893021",
                "fee": 150.0,
                "exp": 12,
                "hospital": "Mount Sinai Medical Center",
                "avatar": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
                "bio": "Board-certified Cardiologist specializing in preventive cardiology, hypertension management, and heart health optimization.",
                "rating": 4.95,
                "reviews": 48
            },
            {
                "email": "dr.chen@careflow.health",
                "name": "Dr. David Chen, MD",
                "phone": "+1 (555) 203-4859",
                "specialization": "Dermatology",
                "license": "MD-CA-402910",
                "fee": 130.0,
                "exp": 9,
                "hospital": "UCSF Health",
                "avatar": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&q=80",
                "bio": "Dermatologist with expertise in teledermatology, complex acne regimens, eczema management, and skin cancer screening.",
                "rating": 4.88,
                "reviews": 36
            },
            {
                "email": "dr.patel@careflow.health",
                "name": "Dr. Anita Patel, MD",
                "phone": "+1 (555) 304-5960",
                "specialization": "Pediatrics & Family Medicine",
                "license": "MD-TX-781902",
                "fee": 110.0,
                "exp": 14,
                "hospital": "Texas Children's Hospital",
                "avatar": "https://images.unsplash.com/photo-1594824813589-a72eb565e347?w=300&q=80",
                "bio": "Compassionate pediatrician committed to family wellness, child developmental assessments, and adolescent health.",
                "rating": 4.98,
                "reviews": 64
            }
        ]

        created_doctors = []
        for d in doctors_data:
            doc_user = User(
                email=d["email"],
                hashed_password=get_password_hash("DoctorPass123!"),
                full_name=d["name"],
                role=UserRole.DOCTOR,
                phone=d["phone"],
                is_active=True
            )
            db.add(doc_user)
            db.flush()

            doc_profile = DoctorProfile(
                user_id=doc_user.id,
                specialization=d["specialization"],
                license_number=d["license"],
                consultation_fee=d["fee"],
                experience_years=d["exp"],
                hospital_affiliation=d["hospital"],
                avatar_url=d["avatar"],
                bio=d["bio"],
                rating=d["rating"],
                total_reviews=d["reviews"],
                is_verified=True
            )
            db.add(doc_profile)
            db.flush()
            created_doctors.append((doc_user, doc_profile))

            # Add availability slots (Monday through Friday, 9:00 - 17:00)
            for day_idx in range(5):  # 0=Mon, 4=Fri
                slot = AvailabilitySlot(
                    doctor_id=doc_profile.id,
                    day_of_week=day_idx,
                    start_time=time(9, 0),
                    end_time=time(17, 0),
                    slot_duration_minutes=30,
                    is_active=True
                )
                db.add(slot)

        # 3. Patients
        patients_data = [
            {
                "email": "patient.john@example.com",
                "name": "John Doe",
                "phone": "+1 (555) 405-6071",
                "dob": date(1988, 5, 14),
                "gender": "Male",
                "blood": "O+",
                "allergies": "Penicillin, Sulfa drugs",
                "conditions": "Mild Hypertension",
                "insurance_prov": "Blue Cross Blue Shield",
                "insurance_num": "BCBS-98234-A"
            },
            {
                "email": "patient.emma@example.com",
                "name": "Emma Watson",
                "phone": "+1 (555) 506-7182",
                "dob": date(1994, 9, 21),
                "gender": "Female",
                "blood": "A+",
                "allergies": "No known allergies",
                "conditions": "Seasonal allergic rhinitis",
                "insurance_prov": "Aetna Health",
                "insurance_num": "AET-56123-K"
            },
            {
                "email": "patient.marcus@example.com",
                "name": "Marcus Aurelius Green",
                "phone": "+1 (555) 607-8293",
                "dob": date(1975, 11, 3),
                "gender": "Male",
                "blood": "B+",
                "allergies": "Aspirin",
                "conditions": "Type 2 Diabetes Mellitus",
                "insurance_prov": "UnitedHealthcare",
                "insurance_num": "UHC-77412-M"
            }
        ]

        created_patients = []
        for p in patients_data:
            pat_user = User(
                email=p["email"],
                hashed_password=get_password_hash("PatientPass123!"),
                full_name=p["name"],
                role=UserRole.PATIENT,
                phone=p["phone"],
                is_active=True
            )
            db.add(pat_user)
            db.flush()

            pat_profile = PatientProfile(
                user_id=pat_user.id,
                date_of_birth=p["dob"],
                gender=p["gender"],
                blood_group=p["blood"],
                emergency_contact="Emergency Contact: +1 (555) 999-0000",
                allergies=p["allergies"],
                chronic_conditions=p["conditions"],
                insurance_provider=p["insurance_prov"],
                insurance_policy_number=p["insurance_num"]
            )
            db.add(pat_profile)
            db.flush()
            created_patients.append((pat_user, pat_profile))

        # 4. Appointments & Consultations
        today = date.today()
        doc1_user, doc1_prof = created_doctors[0]  # Dr. Sarah Smith (Cardiology)
        doc2_user, doc2_prof = created_doctors[1]  # Dr. David Chen (Dermatology)
        pat1_user, pat1_prof = created_patients[0]  # John Doe
        pat2_user, pat2_prof = created_patients[1]  # Emma Watson

        # Past Completed Appointment with SOAP Note & Prescription
        past_apt = Appointment(
            patient_id=pat1_prof.id,
            doctor_id=doc1_prof.id,
            appointment_date=today - timedelta(days=3),
            start_time=time(10, 0),
            end_time=time(10, 30),
            status=AppointmentStatus.COMPLETED,
            appointment_type=AppointmentType.TELEMEDICINE,
            reason="Routine hypertension quarterly follow-up and chest tightness evaluation.",
            telemedicine_room_id="cf-telemed-past-demo-01"
        )
        db.add(past_apt)
        db.flush()

        soap_note = ConsultationNote(
            appointment_id=past_apt.id,
            doctor_id=doc1_prof.id,
            patient_id=pat1_prof.id,
            subjective="Patient reports occasional mild dizziness in the mornings. Adherent to low-sodium diet. No chest pain on exertion.",
            objective="BP: 128/82 mmHg, HR: 68 bpm. Heart sounds regular S1/S2, no murmurs or gallops. Lungs clear to auscultation bilaterally.",
            assessment="Essential primary hypertension (ICD-10 I10), well-controlled. Medication dosage optimization indicated.",
            plan="1. Continue Lisinopril 10mg daily morning.\n2. Maintain ambulatory BP log for 2 weeks.\n3. Routine comprehensive metabolic panel in 6 months.",
            icd_codes="I10, R42",
            vitals_json=json.dumps({
                "blood_pressure": "128/82",
                "heart_rate_bpm": 68,
                "temperature_f": 98.4,
                "respiratory_rate": 16,
                "oxygen_saturation_pct": 99,
                "weight_kg": 78.5,
                "height_cm": 180.0
            })
        )
        db.add(soap_note)

        rx = Prescription(
            appointment_id=past_apt.id,
            doctor_id=doc1_prof.id,
            patient_id=pat1_prof.id,
            prescription_code="RX-2026-CARDIO-881",
            medications_json=json.dumps([
                {
                    "name": "Lisinopril",
                    "dosage": "10 mg oral tablet",
                    "frequency": "Once daily with breakfast",
                    "duration": "90 days",
                    "instructions": "Monitor for lightheadedness. Do not discontinue abruptly."
                },
                {
                    "name": "Coenzyme Q10",
                    "dosage": "100 mg capsule",
                    "frequency": "Once daily",
                    "duration": "90 days",
                    "instructions": "Dietary supplement for cardiac cellular support."
                }
            ]),
            general_instructions="Take medications with plenty of water. Keep home blood pressure record.",
            is_dispensed=False,
            signed_at=datetime.now(timezone.utc) - timedelta(days=3)
        )
        db.add(rx)

        # Upcoming Confirmed Telemedicine Consultation
        upcoming_apt = Appointment(
            patient_id=pat1_prof.id,
            doctor_id=doc2_prof.id,
            appointment_date=today + timedelta(days=2),
            start_time=time(14, 0),
            end_time=time(14, 30),
            status=AppointmentStatus.CONFIRMED,
            appointment_type=AppointmentType.TELEMEDICINE,
            reason="Teledermatology consultation for persistent eczema flare-up on forearm.",
            telemedicine_room_id="cf-telemed-room-active-live"
        )
        db.add(upcoming_apt)

        # Upcoming In-Person Consultation
        upcoming_apt2 = Appointment(
            patient_id=pat2_prof.id,
            doctor_id=doc1_prof.id,
            appointment_date=today + timedelta(days=4),
            start_time=time(11, 0),
            end_time=time(11, 30),
            status=AppointmentStatus.CONFIRMED,
            appointment_type=AppointmentType.IN_PERSON,
            reason="Annual cardiovascular risk screening.",
            telemedicine_room_id=None
        )
        db.add(upcoming_apt2)

        # 5. Medical Records / Encrypted Documents
        rec1 = MedicalRecord(
            patient_id=pat1_prof.id,
            uploaded_by_id=doc1_user.id,
            title="Complete Lipid & Metabolic Blood Panel",
            description="Fasting blood glucose, Total Cholesterol: 185 mg/dL, HDL: 52 mg/dL, LDL: 108 mg/dL.",
            category=DocumentCategory.LAB_REPORT,
            file_key=f"patients/{pat1_prof.id}/records/lab_lipid_panel_2026.pdf",
            file_name="Lab_Report_Lipid_Panel_2026.pdf",
            file_size_bytes=1024 * 342,
            mime_type="application/pdf",
            s3_bucket="careflow-medical-records-storage",
            checksum_sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            is_archived=False
        )
        db.add(rec1)

        rec2 = MedicalRecord(
            patient_id=pat1_prof.id,
            uploaded_by_id=pat1_user.id,
            title="Echocardiogram Diagnostic Imaging Report",
            description="Transthoracic echocardiogram: normal left ventricular ejection fraction (LVEF 62%).",
            category=DocumentCategory.IMAGING,
            file_key=f"patients/{pat1_prof.id}/records/echocardiogram_scan.pdf",
            file_name="Echocardiogram_Scan_Report.pdf",
            file_size_bytes=1024 * 1480,
            mime_type="application/pdf",
            s3_bucket="careflow-medical-records-storage",
            checksum_sha256="4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
            is_archived=False
        )
        db.add(rec2)

        # 6. Notifications
        db.add(Notification(
            user_id=pat1_user.id,
            title="Upcoming Telemedicine Consultation",
            message=f"Reminder: You have a scheduled teledermatology consultation with Dr. David Chen on {today + timedelta(days=2)} at 14:00.",
            notification_type=NotificationType.APPOINTMENT_REMINDER,
            is_read=False
        ))
        db.add(Notification(
            user_id=pat1_user.id,
            title="New Prescription Ready",
            message="Dr. Sarah Smith signed electronic prescription RX-2026-CARDIO-881.",
            notification_type=NotificationType.PRESCRIPTION_READY,
            is_read=True
        ))

        # 7. Regulatory Audit Logs
        db.add(AuditLog(
            actor_id=admin_user.id,
            actor_email=admin_user.email,
            actor_role="ADMIN",
            action="SYSTEM_INITIALIZATION",
            resource_type="System",
            resource_id="1",
            ip_address="10.0.1.42",
            user_agent="CareFlow-Bootstrap/1.0",
            details=json.dumps({"event": "Platform seeded and initialized"})
        ))
        db.add(AuditLog(
            actor_id=doc1_user.id,
            actor_email=doc1_user.email,
            actor_role="DOCTOR",
            action="ISSUE_PRESCRIPTION",
            resource_type="Prescription",
            resource_id="RX-2026-CARDIO-881",
            ip_address="192.168.1.105",
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            details=json.dumps({"patient": "John Doe", "meds_count": 2})
        ))

        db.commit()
        print("[CareFlow Seeder] Successfully seeded production demo data!")
        print("----------------------------------------------------------------------")
        print("Demo Credentials:")
        print("  Admin:   admin@careflow.health       / CareFlowAdmin123!")
        print("  Doctor:  dr.smith@careflow.health     / DoctorPass123!")
        print("  Patient: patient.john@example.com   / PatientPass123!")
        print("----------------------------------------------------------------------")

    except Exception as e:
        db.rollback()
        print(f"[CareFlow Seeder Error] {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

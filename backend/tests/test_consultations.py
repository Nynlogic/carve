from datetime import date, timedelta


def test_doctor_soap_note_and_prescription(client, doctor_token, patient_token, test_doctor, test_patient):
    # 1. Book appointment
    apt_resp = client.post(
        "/api/v1/appointments/",
        json={
            "doctor_id": test_doctor.doctor_profile.id,
            "appointment_date": str(date.today() + timedelta(days=1)),
            "start_time": "15:00:00",
            "end_time": "15:30:00",
            "reason": "Chest discomfort review",
            "appointment_type": "TELEMEDICINE"
        },
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    apt_id = apt_resp.json()["id"]

    # 2. Doctor records SOAP notes
    soap_payload = {
        "appointment_id": apt_id,
        "subjective": "Patient reports intermittent palpitations when drinking caffeine.",
        "objective": "Heart rate 74 bpm, BP 122/78 mmHg. Normal sinus rhythm.",
        "assessment": "Sinus tachycardia related to high caffeine consumption.",
        "plan": "Decrease caffeine intake. Follow-up if symptoms persist.",
        "icd_codes": "R00.0",
        "vitals": {
            "blood_pressure": "122/78",
            "heart_rate_bpm": 74,
            "temperature_f": 98.6,
            "oxygen_saturation_pct": 99
        }
    }
    soap_resp = client.post(
        "/api/v1/consultations/notes",
        json=soap_payload,
        headers={"Authorization": f"Bearer {doctor_token}"}
    )
    assert soap_resp.status_code == 201
    note_data = soap_resp.json()
    assert note_data["assessment"] == "Sinus tachycardia related to high caffeine consumption."

    # 3. Doctor issues prescription
    rx_payload = {
        "appointment_id": apt_id,
        "medications": [
            {
                "name": "Magnesium Glycinate",
                "dosage": "200 mg",
                "frequency": "Once daily before sleep",
                "duration": "30 days",
                "instructions": "Helps support healthy cardiac rhythm."
            }
        ],
        "general_instructions": "Hydrate adequately throughout the day."
    }
    rx_resp = client.post(
        "/api/v1/prescriptions/",
        json=rx_payload,
        headers={"Authorization": f"Bearer {doctor_token}"}
    )
    assert rx_resp.status_code == 201
    rx_data = rx_resp.json()
    assert rx_data["prescription_code"].startswith("RX-")

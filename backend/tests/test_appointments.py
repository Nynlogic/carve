from datetime import date, timedelta


def test_book_appointment_and_conflict_detection(client, patient_token, test_doctor):
    tomorrow = date.today() + timedelta(days=1)
    booking_payload = {
        "doctor_id": test_doctor.doctor_profile.id,
        "appointment_date": str(tomorrow),
        "start_time": "10:00:00",
        "end_time": "10:30:00",
        "reason": "Cardiac checkup and BP review",
        "appointment_type": "TELEMEDICINE"
    }

    # 1. Successful booking
    resp = client.post(
        "/api/v1/appointments/",
        json=booking_payload,
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert resp.status_code == 201
    apt = resp.json()
    assert apt["status"] == "CONFIRMED"
    assert apt["telemedicine_room_id"] is not None
    assert "cf-telemed-" in apt["telemedicine_room_id"]

    # 2. Attempt double-booking exact same slot -> Must return 409 Conflict
    conflict_resp = client.post(
        "/api/v1/appointments/",
        json=booking_payload,
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert conflict_resp.status_code == 409
    assert "already been booked" in conflict_resp.json()["detail"]


def test_list_appointments(client, patient_token):
    resp = client.get(
        "/api/v1/appointments/",
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


def test_cancel_appointment(client, patient_token, test_doctor):
    tomorrow = date.today() + timedelta(days=2)
    booking_payload = {
        "doctor_id": test_doctor.doctor_profile.id,
        "appointment_date": str(tomorrow),
        "start_time": "14:00:00",
        "end_time": "14:30:00",
        "reason": "Routine consult",
        "appointment_type": "TELEMEDICINE"
    }
    create_resp = client.post(
        "/api/v1/appointments/",
        json=booking_payload,
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    apt_id = create_resp.json()["id"]

    cancel_resp = client.post(
        f"/api/v1/appointments/{apt_id}/cancel",
        json={"cancellation_reason": "Schedule conflict"},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

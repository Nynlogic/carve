def test_presigned_upload_and_record_flow(client, patient_token):
    # 1. Request presigned upload URL
    req_payload = {
        "file_name": "Blood_Test_Panel.pdf",
        "mime_type": "application/pdf",
        "file_size_bytes": 1024 * 250,
        "category": "LAB_REPORT",
        "title": "Comprehensive Metabolic Panel"
    }
    upload_resp = client.post(
        "/api/v1/medical-records/upload-request",
        json=req_payload,
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert upload_resp.status_code == 200
    upload_info = upload_resp.json()
    assert "upload_url" in upload_info
    assert "file_key" in upload_info

    # 2. Confirm record metadata in database
    confirm_payload = {
        "patient_id": 1,
        "title": "Comprehensive Metabolic Panel",
        "description": "Routine annual blood work",
        "category": "LAB_REPORT",
        "file_key": upload_info["file_key"],
        "file_name": "Blood_Test_Panel.pdf",
        "file_size_bytes": 1024 * 250,
        "mime_type": "application/pdf",
        "checksum_sha256": "fakehash12345"
    }
    confirm_resp = client.post(
        "/api/v1/medical-records/confirm",
        json=confirm_payload,
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert confirm_resp.status_code == 201
    rec_id = confirm_resp.json()["id"]

    # 3. Request download URL (triggers HIPAA audit log)
    dl_resp = client.get(
        f"/api/v1/medical-records/{rec_id}/download-url",
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert dl_resp.status_code == 200
    assert "download_url" in dl_resp.json()

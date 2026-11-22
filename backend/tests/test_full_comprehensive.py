def test_invalid_inputs_and_error_handling(client):
    # Non-existent interview
    resp = client.get("/api/interviews/999999")
    assert resp.status_code == 404

    # Non-existent report
    resp = client.get("/api/interviews/999999/report")
    assert resp.status_code == 404

    # Start non-existent interview
    resp = client.post("/api/interviews/999999/start")
    assert resp.status_code == 404

    # Skip non-existent interview
    resp = client.post("/api/interviews/999999/skip")
    assert resp.status_code == 404


def test_empty_answer_handling(client):
    create_payload = {
        "role": "Backend Developer",
        "experience": "Entry-Level",
        "type": "Technical",
        "difficulty": "Easy",
        "length": 5,
        "skills": ["Python", "SQL"]
    }
    create_resp = client.post("/api/interviews", json=create_payload)
    interview_id = create_resp.json()["id"]
    question_id = create_resp.json()["questions"][0]["id"]

    # Submit empty answer
    empty_payload = {
        "question_id": question_id,
        "answer_text": "   ",
        "elapsed_seconds": 15
    }
    resp = client.post(f"/api/interviews/{interview_id}/answers", json=empty_payload)
    assert resp.status_code == 200
    interaction = resp.json()
    assert interaction["evaluation"]["overall_score"] == 0.0
    assert "skipped" in interaction["evaluation"]["summary"].lower() or "skipped" in interaction["evaluation"]["feedback"].lower()


def test_follow_up_generation(client):
    create_payload = {
        "role": "AI / ML Engineer",
        "experience": "Advanced",
        "type": "Technical",
        "difficulty": "Hard",
        "length": 5,
        "skills": ["Transformers", "PyTorch"]
    }
    create_resp = client.post("/api/interviews", json=create_payload)
    interview_id = create_resp.json()["id"]
    first_q_id = create_resp.json()["questions"][0]["id"]

    # Submit answer with explicit detail
    answer_payload = {
        "question_id": first_q_id,
        "answer_text": "We implemented FlashAttention-2 with kv-caching to reduce memory footprint by 4x during long context generation.",
        "elapsed_seconds": 60
    }
    resp = client.post(f"/api/interviews/{interview_id}/answers", json=answer_payload)
    assert resp.status_code == 200
    interaction = resp.json()
    assert interaction["evaluation"]["overall_score"] >= 70


def test_interview_history_filtering_and_sorting(client):
    # Retrieve all interviews
    resp = client.get("/api/interviews")
    assert resp.status_code == 200
    sessions = resp.json()
    assert isinstance(sessions, list)

    # Filter by role search
    resp_search = client.get("/api/interviews?search=Backend")
    assert resp_search.status_code == 200
    for s in resp_search.json():
        assert "backend" in s["role"].lower()

    # Sort tests
    resp_newest = client.get("/api/interviews?sort=Newest")
    assert resp_newest.status_code == 200
    resp_highest = client.get("/api/interviews?sort=Highest score")
    assert resp_highest.status_code == 200

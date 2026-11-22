def test_create_and_run_interview(client):
    # 1. Create interview
    create_payload = {
        "role": "Software Developer",
        "experience": "Intermediate",
        "type": "Technical",
        "difficulty": "Medium",
        "length": 5,
        "skills": ["Python", "Algorithms", "System Design"],
        "context": "Focus on high-scale systems."
    }
    create_resp = client.post("/api/interviews", json=create_payload)
    assert create_resp.status_code == 201
    interview = create_resp.json()
    assert interview["id"] is not None
    assert interview["role"] == "Software Developer"
    assert len(interview["questions"]) == 5
    interview_id = interview["id"]

    # 2. Start interview
    start_resp = client.post(f"/api/interviews/{interview_id}/start")
    assert start_resp.status_code == 200
    first_q = start_resp.json()
    assert first_q["id"] is not None
    assert first_q["question_order"] == 0
    question_id = first_q["id"]

    # 3. Get current question
    curr_resp = client.get(f"/api/interviews/{interview_id}/current-question")
    assert curr_resp.status_code == 200
    assert curr_resp.json()["id"] == question_id

    # 4. Submit Answer
    answer_payload = {
        "question_id": question_id,
        "answer_text": "A process has its own address space, while threads share memory. I use threads for lightweight concurrency and processes for fault isolation.",
        "elapsed_seconds": 45
    }
    answer_resp = client.post(f"/api/interviews/{interview_id}/answers", json=answer_payload)
    assert answer_resp.status_code == 200
    interaction = answer_resp.json()
    assert interaction["interview_id"] == interview_id
    assert interaction["evaluation"]["overall_score"] > 0
    assert "feedback" in interaction["evaluation"]
    assert interaction["next_question"] is not None

    # 5. Skip next question
    skip_resp = client.post(f"/api/interviews/{interview_id}/skip")
    assert skip_resp.status_code == 200
    skip_interaction = skip_resp.json()
    assert skip_interaction["interview_id"] == interview_id

    # 6. End interview early
    end_resp = client.post(f"/api/interviews/{interview_id}/end")
    assert end_resp.status_code == 200
    assert "report_id" in end_resp.json()

    # 7. Verify report was generated
    report_resp = client.get(f"/api/interviews/{interview_id}/report")
    assert report_resp.status_code == 200
    report = report_resp.json()
    assert report["overall_score"] >= 0
    assert "Technical Knowledge" in report["category_scores"]
    assert len(report["reviews"]) > 0

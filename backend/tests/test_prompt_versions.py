def test_prompt_comparison_and_testing(client):
    # Test Comparison metadata
    comp_resp = client.get("/api/prompts/comparison")
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    assert "pipeline" in comp_data
    assert "v1" in comp_data["versions"]
    assert "v2" in comp_data["versions"]
    assert "v3" in comp_data["versions"]

    # Test prompt execution on test input
    for v in ["v1", "v2", "v3"]:
        test_payload = {
            "version": v,
            "role": "Software Developer",
            "question_text": "What is the difference between a process and a thread?",
            "candidate_answer": "Processes have separate memory; threads share memory within a process."
        }
        test_resp = client.post("/api/prompts/test", json=test_payload)
        assert test_resp.status_code == 200
        data = test_resp.json()
        assert data["version"] == v
        assert "evaluation_result" in data

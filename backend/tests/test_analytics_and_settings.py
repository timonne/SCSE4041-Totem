def test_analytics_and_settings(client):
    # Test Overview when empty
    overview_resp = client.get("/api/analytics/overview")
    assert overview_resp.status_code == 200
    assert "average_score" in overview_resp.json()

    # Test Progression
    prog_resp = client.get("/api/analytics/progression")
    assert prog_resp.status_code == 200
    assert "scores" in prog_resp.json()

    # Test Categories
    cat_resp = client.get("/api/analytics/categories")
    assert cat_resp.status_code == 200
    assert "categories" in cat_resp.json()

    # Test Settings GET and PUT
    settings_resp = client.get("/api/settings")
    assert settings_resp.status_code == 200
    current_settings = settings_resp.json()
    assert current_settings["length"] == "10 questions"

    update_payload = {
        **current_settings,
        "difficulty": "Hard",
        "theme": "light"
    }
    put_resp = client.put("/api/settings", json=update_payload)
    assert put_resp.status_code == 200
    assert put_resp.json()["difficulty"] == "Hard"
    assert put_resp.json()["theme"] == "light"

    # Verify persistence
    verify_resp = client.get("/api/settings")
    assert verify_resp.json()["difficulty"] == "Hard"

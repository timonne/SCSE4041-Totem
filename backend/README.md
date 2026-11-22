# Mock Interview Assistant — Backend

FastAPI backend application for the Mock Interview Assistant.

## Quickstart

```bash
# 1. Install dependencies
python -m pip install -r requirements.txt

# 2. Configure environment
copy .env.example .env

# 3. Run automated tests
python -m pytest -v

# 4. Start local development server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints Summary

- `GET /api/health`: System health and AI provider status.
- `POST /api/interviews`: Create session and generate questions.
- `GET /api/interviews`: Retrieve session history with search, type filter, and sort.
- `GET /api/interviews/{id}`: Detailed session state.
- `POST /api/interviews/{id}/start`: Activate first question.
- `POST /api/interviews/{id}/skip`: Skip active question.
- `POST /api/interviews/{id}/answers`: Submit answer, score rubric, advance question.
- `POST /api/interviews/{id}/end`: End early and synthesize report.
- `GET /api/interviews/{id}/report`: Fetch evaluation report.
- `GET /api/analytics/overview`: Dashboard summary metrics.
- `GET /api/analytics/progression`: Score trajectory series.
- `GET /api/analytics/categories`: 6-dimension skill breakdown.
- `GET /api/analytics/interview-types`: Interview format distribution.
- `GET /api/settings`: Fetch user settings.
- `PUT /api/settings`: Save user settings.
- `GET /api/prompts/comparison`: Academic prompt metadata and benchmarks.
- `POST /api/prompts/test`: Run comparative prompt test on candidate input.

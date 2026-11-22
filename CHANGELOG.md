What changed since Milestone 1
Built the FastAPI backend: seven route groups, five services, six SQLAlchemy models, and a prompt package with the final prompts and versions V1 to V3.
Connected the Figma Make frontend to the backend through a typed API layer; screens now show live questions, scores, reports, history and analytics.
Added input safeguards: answer tagging, an override-phrase check, blank-answer handling, JSON extraction and score clamping.
Added nine automated tests, a README with setup steps and endpoint list, and an .env.example with placeholders only.
Dropped retrieval, resume upload and spoken input from the build and recorded them as future work (Section 2.1).

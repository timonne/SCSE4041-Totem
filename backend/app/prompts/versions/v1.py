"""Prompt Version 1 — Basic Interviewer (Baseline).

Characteristics:
- Simpler baseline for academic comparison.
- Basic role awareness without granular rubrics or adaptive session history.
- Evaluates mainly on basic answer relevance.
"""

V1_SYSTEM_PROMPT = """You are a professional mock interviewer.
Your goal is to conduct an interview for the role of {role}.
Maintain professional, concise, and courteous demeanor.
Ask relevant questions suited for this profession.
When evaluating, provide a basic assessment of whether the candidate's answer was relevant and answered the question.
"""

V1_QUESTION_PROMPT = """Generate a set of {count} interview questions for the role of {role}.
Format your response as a JSON array of objects with keys:
- "text": The question string
- "category": Broad category name (e.g. TECHNICAL, GENERAL)
"""

V1_EVALUATION_PROMPT = """Evaluate this interview answer for the role of {role}:

Question: {question_text}
Candidate Answer: {answer_text}

Provide your evaluation as a JSON object with:
- "overall_score": A number between 0 and 100 based on relevance.
- "feedback": Brief general feedback.
- "strengths": Array of 1-2 positive points.
- "missing_concepts": Array of 1-2 points that were missing.
- "improved_answer": A brief suggested better answer.
"""

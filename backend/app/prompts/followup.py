from app.utils.validation import wrap_user_input_safety


def build_followup_prompt(
    role: str,
    experience: str,
    question_text: str,
    candidate_answer: str,
    weakness_or_highlight: str
) -> str:
    wrapped = wrap_user_input_safety(candidate_answer)
    return f"""You are conducting an adaptive interview for a {experience} {role}.
The candidate just responded to: "{question_text}".

Candidate Response:
{wrapped}

Key observation from evaluation:
"{weakness_or_highlight}"

Generate a natural, targeted follow-up question (1-2 sentences maximum) that probes deeper into this specific point, tests the boundary of their understanding, or asks for a concrete example/trade-off.

Return strictly JSON:
{{
  "follow_up_question": "...",
  "category": "FOLLOW-UP",
  "reason": "..."
}}
"""

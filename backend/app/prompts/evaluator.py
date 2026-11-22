from typing import Optional
from app.prompts.versions.v1 import V1_EVALUATION_PROMPT
from app.prompts.versions.v2 import V2_EVALUATION_PROMPT
from app.prompts.versions.v3 import V3_EVALUATION_ADAPTATION_PROMPT
from app.utils.validation import wrap_user_input_safety


def build_evaluation_prompt(
    role: str,
    experience: str,
    interview_type: str,
    difficulty: str,
    question_text: str,
    category: str,
    candidate_answer: str,
    current_index: int = 1,
    total_questions: int = 10,
    prior_average_score: float = 75.0,
    version: str = "v3"
) -> str:
    wrapped_answer = wrap_user_input_safety(candidate_answer)

    if version == "v1":
        return V1_EVALUATION_PROMPT.format(
            role=role,
            question_text=question_text,
            answer_text=candidate_answer
        )
    elif version == "v2":
        return V2_EVALUATION_PROMPT.format(
            role=role,
            experience=experience,
            interview_type=interview_type,
            difficulty=difficulty,
            question_text=question_text,
            category=category,
            candidate_answer_wrapped=wrapped_answer
        )
    else:  # v3 default
        return V3_EVALUATION_ADAPTATION_PROMPT.format(
            role=role,
            experience=experience,
            interview_type=interview_type,
            current_index=current_index,
            total_questions=total_questions,
            question_text=question_text,
            category=category,
            current_difficulty=difficulty,
            prior_average_score=f"{prior_average_score:.1f}",
            candidate_answer_wrapped=wrapped_answer
        )

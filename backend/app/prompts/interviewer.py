from typing import List, Optional
from app.prompts.versions.v1 import V1_SYSTEM_PROMPT
from app.prompts.versions.v2 import V2_SYSTEM_PROMPT
from app.prompts.versions.v3 import V3_SYSTEM_PROMPT


def build_system_prompt(
    role: str,
    experience: str = "Intermediate",
    interview_type: str = "Mixed",
    difficulty: str = "Medium",
    skills: Optional[List[str]] = None,
    context: Optional[str] = "",
    current_index: int = 1,
    total_questions: int = 10,
    prior_average_score: float = 75.0,
    performance_trend: str = "Steady",
    questions_history_summary: str = "None yet",
    version: str = "v3"
) -> str:
    skills_str = ", ".join(skills) if skills else "General technical skills"

    if version == "v1":
        return V1_SYSTEM_PROMPT.format(role=role)
    elif version == "v2":
        return V2_SYSTEM_PROMPT.format(
            role=role,
            experience=experience,
            interview_type=interview_type,
            difficulty=difficulty
        )
    else:  # v3 default
        return V3_SYSTEM_PROMPT.format(
            role=role,
            experience=experience,
            interview_type=interview_type,
            difficulty=difficulty,
            skills=skills_str,
            context=context or "Standard interview context",
            current_index=current_index,
            total_questions=total_questions,
            performance_trend=performance_trend,
            questions_history_summary=questions_history_summary
        )

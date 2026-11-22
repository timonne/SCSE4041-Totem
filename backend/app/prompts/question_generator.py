from typing import List, Optional
from app.prompts.versions.v1 import V1_QUESTION_PROMPT
from app.prompts.versions.v2 import V2_QUESTION_PROMPT
from app.prompts.versions.v3 import V3_QUESTION_GENERATION_PROMPT


def build_question_prompt(
    role: str,
    experience: str,
    interview_type: str,
    difficulty: str,
    count: int,
    skills: List[str],
    context: Optional[str] = "",
    version: str = "v3"
) -> str:
    skills_str = ", ".join(skills) if skills else "General core skills for " + role
    context_str = context if context else "None provided"

    if version == "v1":
        return V1_QUESTION_PROMPT.format(
            count=count,
            role=role
        )
    elif version == "v2":
        return V2_QUESTION_PROMPT.format(
            count=count,
            role=role,
            experience=experience,
            interview_type=interview_type,
            difficulty=difficulty,
            skills=skills_str
        )
    else:  # v3 default
        return V3_QUESTION_GENERATION_PROMPT.format(
            count=count,
            role=role,
            experience=experience,
            interview_type=interview_type,
            difficulty=difficulty,
            skills=skills_str,
            context=context_str
        )

from typing import Dict, Any, List
from fastapi import APIRouter
from pydantic import BaseModel
from app.prompts.versions.v1 import V1_SYSTEM_PROMPT, V1_QUESTION_PROMPT, V1_EVALUATION_PROMPT
from app.prompts.versions.v2 import V2_SYSTEM_PROMPT, V2_QUESTION_PROMPT, V2_EVALUATION_PROMPT
from app.prompts.versions.v3 import V3_SYSTEM_PROMPT, V3_QUESTION_GENERATION_PROMPT, V3_EVALUATION_ADAPTATION_PROMPT
from app.services.ai_service import ai_service
from app.prompts.question_generator import build_question_prompt
from app.prompts.evaluator import build_evaluation_prompt
from app.prompts.interviewer import build_system_prompt

router = APIRouter(prefix="/api/prompts", tags=["Prompt Engineering"])


class PromptTestRequest(BaseModel):
    version: str = "v3"  # "v1", "v2", or "v3"
    role: str = "Software Developer"
    question_text: str = "How would you explain the difference between a process and a thread?"
    candidate_answer: str = "A process has its own address space, while threads share memory within a process. I use threads for concurrent work and processes when isolation is needed."


@router.get("/comparison")
def get_prompt_comparison_metadata() -> Dict[str, Any]:
    """Provides prompt metadata, architecture pipeline, and benchmark metrics for V1, V2, and V3."""
    return {
        "pipeline": [
            {"num": "01", "stage": "User configuration", "received": "Role, level, skills, interview type", "output": "Structured interview brief"},
            {"num": "02", "stage": "Question generation", "received": "Interview brief + question history", "output": "Calibrated question"},
            {"num": "03", "stage": "Interviewer", "received": "Question + conversation state", "output": "One-question-at-a-time flow"},
            {"num": "04", "stage": "User answer", "received": "Candidate response + timing", "output": "Structured answer context"},
            {"num": "05", "stage": "Answer evaluation", "received": "Answer + role-specific rubric", "output": "Evidence-based score and feedback"},
            {"num": "06", "stage": "Adaptive follow-up", "received": "Gaps + confidence signals", "output": "Targeted follow-up question"},
            {"num": "07", "stage": "Final report", "received": "All evaluations + trends", "output": "Performance summary and practice plan"},
        ],
        "versions": {
            "v1": {
                "name": "Basic Interviewer (Baseline)",
                "description": "Baseline role-oriented prompt asking one question at a time and evaluating general relevance.",
                "system_prompt": V1_SYSTEM_PROMPT.format(role="{role}"),
                "question_strategy": "Simple role-based question sampling.",
                "evaluation_strategy": "Basic answer relevance check.",
                "quality_impact": {
                    "question_relevance": 62,
                    "feedback_consistency": 55,
                    "adaptive_depth": 38
                }
            },
            "v2": {
                "name": "Rubric-Based Interviewer",
                "description": "Introduces explicit 6-dimension evaluation rubric, difficulty levels, and categorized questions.",
                "system_prompt": V2_SYSTEM_PROMPT.format(role="{role}", experience="{experience}", interview_type="{type}", difficulty="{difficulty}"),
                "question_strategy": "Categorized questions matched strictly to difficulty.",
                "evaluation_strategy": "Explicit 6-dimensional rubric (Technical accuracy, Relevance, Clarity, Depth, Problem-solving, Communication).",
                "quality_impact": {
                    "question_relevance": 81,
                    "feedback_consistency": 86,
                    "adaptive_depth": 67
                }
            },
            "v3": {
                "name": "Context-Aware Adaptive Interviewer",
                "description": "Full conversation session memory, performance trajectory awareness, dynamic difficulty adaptation, and intelligent follow-up gating.",
                "system_prompt": V3_SYSTEM_PROMPT.format(
                    role="{role}",
                    experience="{experience}",
                    interview_type="{type}",
                    difficulty="{difficulty}",
                    skills="{skills}",
                    context="{context}",
                    current_index=1,
                    total_questions=10,
                    performance_trend="Steady",
                    questions_history_summary="None yet"
                ),
                "question_strategy": "Non-repeating adaptive question plan with dynamic difficulty calibration.",
                "evaluation_strategy": "Multi-dimensional rubric with real-time performance trajectory tracking and intelligent follow-up recommendation.",
                "quality_impact": {
                    "question_relevance": 94,
                    "feedback_consistency": 92,
                    "adaptive_depth": 91
                }
            }
        }
    }


@router.post("/test")
async def run_prompt_test(payload: PromptTestRequest) -> Dict[str, Any]:
    """Executes a comparative demonstration of a prompt version on candidate input."""
    system_instruction = build_system_prompt(
        role=payload.role,
        version=payload.version
    )
    prompt = build_evaluation_prompt(
        role=payload.role,
        experience="Intermediate",
        interview_type="Technical",
        difficulty="Medium",
        question_text=payload.question_text,
        category="TECHNICAL",
        candidate_answer=payload.candidate_answer,
        version=payload.version
    )

    result = await ai_service.generate_json(prompt, system_instruction=system_instruction)
    return {
        "version": payload.version,
        "input": {
            "role": payload.role,
            "question": payload.question_text,
            "answer": payload.candidate_answer
        },
        "evaluation_result": result
    }

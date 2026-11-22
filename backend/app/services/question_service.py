from typing import List, Dict, Any, Optional
import logging
from sqlalchemy.orm import Session
from app.models.question import Question
from app.prompts.question_generator import build_question_prompt
from app.prompts.interviewer import build_system_prompt
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)


class QuestionService:
    @staticmethod
    async def generate_questions_for_interview(
        db: Session,
        interview_id: int,
        role: str,
        experience: str,
        interview_type: str,
        difficulty: str,
        count: int,
        skills: List[str],
        context: Optional[str] = "",
        version: str = "v3"
    ) -> List[Question]:
        """
        Uses AI to generate role-specific, experience-calibrated interview questions,
        persists them in the database, and returns the Question models.
        """
        system_instruction = build_system_prompt(
            role=role,
            experience=experience,
            interview_type=interview_type,
            difficulty=difficulty,
            skills=skills,
            context=context,
            version=version
        )
        prompt = build_question_prompt(
            role=role,
            experience=experience,
            interview_type=interview_type,
            difficulty=difficulty,
            count=count,
            skills=skills,
            context=context,
            version=version
        )

        try:
            questions_data = await ai_service.generate_json(prompt, system_instruction=system_instruction)
            if not isinstance(questions_data, list):
                # If wrapped in a dict key like "questions": [...]
                if isinstance(questions_data, dict):
                    questions_data = questions_data.get("questions", list(questions_data.values())[0] if questions_data else [])
                else:
                    questions_data = []
        except Exception as e:
            logger.error(f"Error generating questions via AI: {e}")
            questions_data = []

        # If empty or insufficient, ensure at least count questions using fallback
        if not questions_data or len(questions_data) < count:
            fallback = ai_service._fallback_json_for_prompt(f"generate questions for {role}")
            if isinstance(fallback, list):
                while len(questions_data) < count:
                    next_idx = len(questions_data) % len(fallback)
                    questions_data.append(fallback[next_idx])

        created_questions = []
        for i, q in enumerate(questions_data[:count]):
            question_obj = Question(
                interview_id=interview_id,
                question_text=q.get("text", f"Discuss core concepts and trade-offs in {role}."),
                category=q.get("category", "TECHNICAL"),
                difficulty=q.get("difficulty", difficulty),
                question_order=i,
                is_follow_up=bool(q.get("is_follow_up", False) or q.get("followUp", False)),
                status="active" if i == 0 else "pending"
            )
            db.add(question_obj)
            created_questions.append(question_obj)

        db.commit()
        for q in created_questions:
            db.refresh(q)

        return created_questions


question_service = QuestionService()

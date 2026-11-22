from typing import Optional, Dict, Any
import logging
from sqlalchemy.orm import Session
from app.models.evaluation import Evaluation
from app.models.answer import Answer
from app.models.question import Question
from app.models.interview import Interview
from app.prompts.evaluator import build_evaluation_prompt
from app.prompts.interviewer import build_system_prompt
from app.services.ai_service import ai_service
from app.utils.validation import check_prompt_injection

logger = logging.getLogger(__name__)


class EvaluationService:
    @staticmethod
    async def evaluate_answer(
        db: Session,
        answer: Answer,
        question: Question,
        interview: Interview,
        prior_average_score: float = 75.0,
        version: str = "v3"
    ) -> Evaluation:
        """
        Evaluates a submitted candidate answer against the configured rubric,
        persisting the evaluation record in the database.
        """
        # Security check: prompt injection
        is_injection, reason = check_prompt_injection(answer.answer_text)
        if is_injection:
            eval_record = Evaluation(
                answer_id=answer.id,
                overall_score=20.0,
                technical_accuracy=2.0,
                relevance=1.0,
                clarity=3.0,
                depth=1.0,
                problem_solving=1.0,
                communication=2.0,
                summary="The response attempted to override the evaluation system rather than answering the interview question.",
                strengths=[],
                missing_concepts=["Direct technical answer to the question asked"],
                feedback="Prompt injection attempts violate interview guidelines. Please provide an authentic, direct answer to the question.",
                improved_answer="Address the specific technical question directly with appropriate principles and examples.",
                follow_up_recommended=False,
                follow_up_question=None
            )
            db.add(eval_record)
            db.commit()
            db.refresh(eval_record)
            return eval_record

        # Check for skipped / empty answer
        if not answer.answer_text.strip() or answer.answer_text.strip() == "Question skipped":
            eval_record = Evaluation(
                answer_id=answer.id,
                overall_score=0.0,
                technical_accuracy=0.0,
                relevance=0.0,
                clarity=0.0,
                depth=0.0,
                problem_solving=0.0,
                communication=0.0,
                summary="Question was skipped without response.",
                strengths=[],
                missing_concepts=["Response to the question"],
                feedback="This question was skipped. Review the suggested answer to understand key points to cover in future interviews.",
                improved_answer="Provide an explanation outlining key definitions, pros/cons, and real-world considerations.",
                follow_up_recommended=False,
                follow_up_question=None
            )
            db.add(eval_record)
            db.commit()
            db.refresh(eval_record)
            return eval_record

        # Build prompts
        system_instruction = build_system_prompt(
            role=interview.role,
            experience=interview.experience,
            interview_type=interview.interview_type,
            difficulty=interview.difficulty,
            skills=interview.skills,
            context=interview.custom_instructions,
            current_index=question.question_order + 1,
            total_questions=interview.question_count,
            prior_average_score=prior_average_score,
            version=version
        )
        prompt = build_evaluation_prompt(
            role=interview.role,
            experience=interview.experience,
            interview_type=interview.interview_type,
            difficulty=question.difficulty,
            question_text=question.question_text,
            category=question.category,
            candidate_answer=answer.answer_text,
            current_index=question.question_order + 1,
            total_questions=interview.question_count,
            prior_average_score=prior_average_score,
            version=version
        )

        try:
            eval_data = await ai_service.generate_json(prompt, system_instruction=system_instruction)
            if not isinstance(eval_data, dict):
                eval_data = {}
        except Exception as e:
            logger.error(f"Error during AI evaluation: {e}")
            eval_data = {}

        # Validate and bound scores
        overall_score = float(eval_data.get("overall_score", 75.0))
        overall_score = max(0.0, min(100.0, overall_score))

        tech_acc = max(0.0, min(10.0, float(eval_data.get("technical_accuracy", overall_score / 10.0))))
        relevance = max(0.0, min(10.0, float(eval_data.get("relevance", overall_score / 10.0))))
        clarity = max(0.0, min(10.0, float(eval_data.get("clarity", overall_score / 10.0))))
        depth = max(0.0, min(10.0, float(eval_data.get("depth", overall_score / 10.0))))
        prob_solv = max(0.0, min(10.0, float(eval_data.get("problem_solving", overall_score / 10.0))))
        comm = max(0.0, min(10.0, float(eval_data.get("communication", overall_score / 10.0))))

        strengths = eval_data.get("strengths") or ["Clear focus on core concepts"]
        missing = eval_data.get("missing_concepts") or ["Concrete production edge cases"]
        feedback = eval_data.get("feedback") or "Good foundational explanation. Expand on real-world trade-offs."
        improved = eval_data.get("improved_answer") or "Structure your answer by defining core mechanics, followed by a concrete trade-off example."

        follow_up_rec = bool(eval_data.get("follow_up_recommended", False))
        follow_up_q = eval_data.get("follow_up_question")

        eval_record = Evaluation(
            answer_id=answer.id,
            overall_score=overall_score,
            technical_accuracy=tech_acc,
            relevance=relevance,
            clarity=clarity,
            depth=depth,
            problem_solving=prob_solv,
            communication=comm,
            summary=eval_data.get("summary", "Evaluated response against rubric."),
            strengths=strengths,
            missing_concepts=missing,
            feedback=feedback,
            improved_answer=improved,
            follow_up_recommended=follow_up_rec,
            follow_up_question=follow_up_q
        )

        db.add(eval_record)
        db.commit()
        db.refresh(eval_record)

        return eval_record


evaluation_service = EvaluationService()

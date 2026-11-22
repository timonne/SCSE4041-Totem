from typing import Optional, Tuple
import logging
from app.utils.dates import utc_now
from sqlalchemy.orm import Session
from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.schemas.answer import NextInteractionResponse, EvaluationResponse
from app.schemas.question import QuestionResponse
from app.services.evaluation_service import evaluation_service
from app.services.report_service import report_service

logger = logging.getLogger(__name__)


class AdaptiveInterviewService:
    MAX_FOLLOW_UPS_PER_SESSION = 2

    @staticmethod
    def get_session_stats(db: Session, interview_id: int) -> Tuple[float, int, int]:
        """Calculates running average score, answered count, and follow-up count."""
        answers = db.query(Answer).filter(Answer.interview_id == interview_id).all()
        evaluated_scores = []
        for ans in answers:
            if ans.evaluation and ans.answer_text.strip() and ans.answer_text != "Question skipped":
                evaluated_scores.append(ans.evaluation.overall_score)
        
        avg_score = sum(evaluated_scores) / len(evaluated_scores) if evaluated_scores else 75.0
        
        follow_up_count = db.query(Question).filter(
            Question.interview_id == interview_id,
            Question.is_follow_up == True
        ).count()

        return avg_score, len(evaluated_scores), follow_up_count

    @classmethod
    async def process_answer_submission(
        cls,
        db: Session,
        interview: Interview,
        question: Question,
        answer_text: str,
        elapsed_seconds: int = 0
    ) -> NextInteractionResponse:
        """
        Processes answer submission, evaluates it, checks follow-up criteria and difficulty adaptation,
        advances the question pointer, and returns the next interaction payload.
        """
        # 1. Save Answer
        answer_record = Answer(
            interview_id=interview.id,
            question_id=question.id,
            answer_text=answer_text.strip(),
            elapsed_seconds=elapsed_seconds,
            submitted_at=utc_now()
        )
        db.add(answer_record)
        question.status = "skipped" if (not answer_text.strip() or answer_text.strip() == "Question skipped") else "answered"
        db.commit()
        db.refresh(answer_record)

        # 2. Evaluate Answer
        avg_score, answered_count, follow_up_count = AdaptiveInterviewService.get_session_stats(db, interview.id)
        evaluation_record = await evaluation_service.evaluate_answer(
            db=db,
            answer=answer_record,
            question=question,
            interview=interview,
            prior_average_score=avg_score
        )

        # 3. Determine if follow-up question should be injected
        should_follow_up = (
            evaluation_record.follow_up_recommended
            and evaluation_record.follow_up_question
            and follow_up_count < AdaptiveInterviewService.MAX_FOLLOW_UPS_PER_SESSION
            and question.status != "skipped"
        )

        next_q_obj: Optional[Question] = None
        difficulty_adjustment: Optional[str] = None

        if should_follow_up:
            # Create follow-up question dynamically inserted right after this question
            next_order = question.question_order + 1
            # Shift remaining questions order up by 1
            remaining = db.query(Question).filter(
                Question.interview_id == interview.id,
                Question.question_order >= next_order
            ).all()
            for rem_q in remaining:
                rem_q.question_order += 1
            
            followup_q = Question(
                interview_id=interview.id,
                question_text=evaluation_record.follow_up_question,
                category="FOLLOW-UP",
                difficulty=question.difficulty,
                question_order=next_order,
                is_follow_up=True,
                parent_question_id=question.id,
                status="active"
            )
            db.add(followup_q)
            interview.question_count += 1
            db.commit()
            db.refresh(followup_q)
            next_q_obj = followup_q
            interview.current_question_index = next_order
        else:
            # Check difficulty adaptation
            recent_evals = db.query(Evaluation).join(Answer).filter(
                Answer.interview_id == interview.id,
                Answer.answer_text != "Question skipped"
            ).order_by(Evaluation.id.desc()).limit(2).all()
            
            if len(recent_evals) >= 2 and all(e.overall_score >= 85 for e in recent_evals):
                if interview.difficulty == "Easy":
                    difficulty_adjustment = "Medium"
                elif interview.difficulty == "Medium":
                    difficulty_adjustment = "Hard"
            
            # Find next question in sequence
            next_q_obj = db.query(Question).filter(
                Question.interview_id == interview.id,
                Question.question_order > question.question_order,
                Question.status == "pending"
            ).order_by(Question.question_order.asc()).first()

            if next_q_obj:
                next_q_obj.status = "active"
                if difficulty_adjustment:
                    next_q_obj.difficulty = difficulty_adjustment
                interview.current_question_index = next_q_obj.question_order

        # 4. Check if interview is completed
        is_completed = next_q_obj is None
        if is_completed:
            interview.status = "Completed"
            interview.end_time = utc_now()
            if interview.start_time:
                interview.duration_seconds = int((interview.end_time - interview.start_time).total_seconds())
            # Generate final report
            await report_service.generate_report_for_interview(db, interview.id)
        else:
            interview.status = "In Progress"

        db.commit()
        db.refresh(interview)

        # Build response
        eval_resp = EvaluationResponse.model_validate(evaluation_record)
        next_q_resp = QuestionResponse.model_validate(next_q_obj) if next_q_obj else None

        return NextInteractionResponse(
            interview_id=interview.id,
            completed=is_completed,
            status=interview.status,
            evaluation=eval_resp,
            next_question=next_q_resp,
            current_question_index=interview.current_question_index,
            total_questions=interview.question_count,
            difficulty_adjusted=difficulty_adjustment,
            is_follow_up=should_follow_up
        )


adaptive_interview_service = AdaptiveInterviewService()

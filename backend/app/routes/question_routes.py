from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.interview import Interview
from app.models.question import Question
from app.schemas.question import QuestionResponse
from app.schemas.answer import NextInteractionResponse
from app.services.adaptive_interview_service import adaptive_interview_service

router = APIRouter(prefix="/api/interviews", tags=["Questions"])


@router.get("/{interview_id}/current-question", response_model=QuestionResponse)
def get_current_question(interview_id: int, db: Session = Depends(get_db)):
    """Retrieve the currently active question for an ongoing interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    q = db.query(Question).filter(
        Question.interview_id == interview_id,
        Question.question_order == interview.current_question_index
    ).first()

    if not q:
        # Fallback: find first active or pending question
        q = db.query(Question).filter(
            Question.interview_id == interview_id,
            Question.status.in_(["active", "pending"])
        ).order_by(Question.question_order.asc()).first()

    if not q:
        raise HTTPException(status_code=404, detail="No more active questions in this session")

    return QuestionResponse.model_validate(q)


@router.post("/{interview_id}/skip", response_model=NextInteractionResponse)
async def skip_current_question(interview_id: int, db: Session = Depends(get_db)):
    """Skip the current question and advance interview progression."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    current_q = db.query(Question).filter(
        Question.interview_id == interview_id,
        Question.question_order == interview.current_question_index
    ).first()

    if not current_q:
        current_q = db.query(Question).filter(
            Question.interview_id == interview_id,
            Question.status.in_(["active", "pending"])
        ).order_by(Question.question_order.asc()).first()

    if not current_q:
        raise HTTPException(status_code=400, detail="No question available to skip")

    # Process as skipped answer
    return await adaptive_interview_service.process_answer_submission(
        db=db,
        interview=interview,
        question=current_q,
        answer_text="Question skipped",
        elapsed_seconds=0
    )

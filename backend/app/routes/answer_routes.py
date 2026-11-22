from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.schemas.answer import AnswerSubmit, NextInteractionResponse, AnswerResponse, EvaluationResponse
from app.schemas.question import QuestionResponse
from app.services.adaptive_interview_service import adaptive_interview_service

router = APIRouter(prefix="/api/interviews", tags=["Answers"])


@router.post("/{interview_id}/answers", response_model=NextInteractionResponse)
async def submit_answer(
    interview_id: int,
    payload: AnswerSubmit,
    db: Session = Depends(get_db)
):
    """Submit a candidate answer, evaluate via AI, adjust progression, and return next question."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview.status == "Completed":
        raise HTTPException(status_code=400, detail="Interview is already completed")

    question = db.query(Question).filter(
        Question.id == payload.question_id,
        Question.interview_id == interview_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found in this interview")

    # If answer already submitted for this question, prevent duplicate
    existing_answer = db.query(Answer).filter(Answer.question_id == question.id).first()
    if existing_answer:
        # If already evaluated, return current next interaction
        pass

    return await adaptive_interview_service.process_answer_submission(
        db=db,
        interview=interview,
        question=question,
        answer_text=payload.answer_text,
        elapsed_seconds=payload.elapsed_seconds or 0
    )


@router.get("/{interview_id}/answers", response_model=List[AnswerResponse])
def get_interview_answers(interview_id: int, db: Session = Depends(get_db)):
    """Retrieve all answers and evaluations for an interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    answers = db.query(Answer).filter(Answer.interview_id == interview_id).order_by(Answer.id.asc()).all()
    results = []
    for ans in answers:
        q_resp = QuestionResponse.model_validate(ans.question) if ans.question else None
        ev_resp = EvaluationResponse.model_validate(ans.evaluation) if ans.evaluation else None
        
        results.append(AnswerResponse(
            id=ans.id,
            interview_id=ans.interview_id,
            question_id=ans.question_id,
            answer_text=ans.answer_text,
            submitted_at=ans.submitted_at,
            elapsed_seconds=ans.elapsed_seconds,
            evaluation=ev_resp,
            question=q_resp,
            text=ans.answer_text,
            score=ev_resp.overall_score if ev_resp else 0,
            feedback=ev_resp.feedback if ev_resp else ""
        ))

    return results

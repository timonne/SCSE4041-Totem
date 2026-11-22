from typing import List, Optional
from datetime import datetime
from app.utils.dates import utc_now
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.interview import Interview
from app.models.question import Question
from app.schemas.interview import (
    InterviewCreateRequest,
    InterviewDetailResponse,
    InterviewSessionResponse
)
from app.schemas.question import QuestionResponse
from app.services.question_service import question_service
from app.services.report_service import report_service

router = APIRouter(prefix="/api/interviews", tags=["Interviews"])


@router.post("", response_model=InterviewDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(payload: InterviewCreateRequest, db: Session = Depends(get_db)):
    """Create a new interview session and generate AI-calibrated questions."""
    interview = Interview(
        role=payload.role,
        experience=payload.experience,
        interview_type=payload.type,
        difficulty=payload.difficulty,
        question_count=payload.length,
        skills=payload.skills,
        custom_instructions=payload.context,
        status="Created",
        start_time=utc_now()
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    # Generate questions via QuestionService
    await question_service.generate_questions_for_interview(
        db=db,
        interview_id=interview.id,
        role=payload.role,
        experience=payload.experience,
        interview_type=payload.type,
        difficulty=payload.difficulty,
        count=payload.length,
        skills=payload.skills,
        context=payload.context,
        version=payload.prompt_version or "v3"
    )

    db.refresh(interview)
    return format_interview_detail(interview)


@router.get("", response_model=List[InterviewSessionResponse])
def get_interviews(
    search: Optional[str] = Query(None, description="Search by role"),
    type: Optional[str] = Query(None, description="Filter by interview type"),
    sort: Optional[str] = Query("Newest", description="Newest, Oldest, or Highest score"),
    db: Session = Depends(get_db)
):
    """Retrieve all interview sessions for history and overview."""
    query = db.query(Interview)

    if search:
        query = query.filter(Interview.role.ilike(f"%{search}%"))
    if type and type != "All types":
        query = query.filter(Interview.interview_type == type)

    if sort == "Oldest":
        query = query.order_by(Interview.id.asc())
    elif sort == "Highest score":
        query = query.order_by(Interview.overall_score.desc().nullslast())
    else:  # Newest
        query = query.order_by(Interview.id.desc())

    interviews = query.all()
    results = []
    for item in interviews:
        mins = max(1, item.duration_seconds // 60)
        dur_str = f"{mins}m" if mins < 60 else f"{mins // 60}h {mins % 60}m"
        results.append(InterviewSessionResponse(
            id=item.id,
            role=item.role,
            date=item.start_time.strftime("%b %d, %Y") if item.start_time else "Nov 22, 2026",
            type=item.interview_type,
            difficulty=item.difficulty,
            score=int(round(item.overall_score)) if item.overall_score is not None else 0,
            questions=item.question_count,
            duration=dur_str,
            status=item.status
        ))
    return results


@router.get("/{interview_id}", response_model=InterviewDetailResponse)
def get_interview(interview_id: int, db: Session = Depends(get_db)):
    """Retrieve detailed state of a specific interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return format_interview_detail(interview)


@router.post("/{interview_id}/start", response_model=QuestionResponse)
def start_interview(interview_id: int, db: Session = Depends(get_db)):
    """Start an interview session and return the first question."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.status = "In Progress"
    first_q = db.query(Question).filter(
        Question.interview_id == interview_id,
        Question.question_order == 0
    ).first()

    if not first_q:
        raise HTTPException(status_code=400, detail="No questions generated for this interview")

    first_q.status = "active"
    db.commit()
    db.refresh(first_q)
    return QuestionResponse.model_validate(first_q)


@router.post("/{interview_id}/end")
async def end_interview(interview_id: int, db: Session = Depends(get_db)):
    """End an interview session early and generate a report from completed answers."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.status = "Completed"
    interview.completion_type = "early"
    interview.end_time = utc_now()
    if interview.start_time:
        interview.duration_seconds = int((interview.end_time - interview.start_time).total_seconds())

    # Mark remaining pending questions as skipped
    pending_questions = db.query(Question).filter(
        Question.interview_id == interview_id,
        Question.status.in_(["pending", "active"])
    ).all()
    for q in pending_questions:
        q.status = "skipped"

    db.commit()

    # Generate report
    report = await report_service.generate_report_for_interview(db, interview_id)
    return {"message": "Interview completed early", "report_id": report.id, "interview_id": interview_id}


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(interview_id: int, db: Session = Depends(get_db)):
    """Delete an interview session and all its associated data."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    db.delete(interview)
    db.commit()
    return None


def format_interview_detail(interview: Interview) -> InterviewDetailResponse:
    return InterviewDetailResponse(
        id=interview.id,
        role=interview.role,
        experience=interview.experience,
        type=interview.interview_type,
        difficulty=interview.difficulty,
        length=interview.question_count,
        skills=interview.skills or [],
        context=interview.custom_instructions or "",
        status=interview.status,
        current_question_index=interview.current_question_index,
        questions=[QuestionResponse.model_validate(q) for q in interview.questions],
        start_time=interview.start_time,
        end_time=interview.end_time,
        duration_seconds=interview.duration_seconds,
        overall_score=interview.overall_score,
        completion_type=interview.completion_type
    )

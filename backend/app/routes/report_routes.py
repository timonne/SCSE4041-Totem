from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.interview import Interview
from app.models.report import Report
from app.schemas.report import ReportResponse
from app.services.report_service import report_service

router = APIRouter(prefix="/api/interviews", tags=["Reports"])


@router.get("/{interview_id}/report", response_model=ReportResponse)
def get_report(interview_id: int, db: Session = Depends(get_db)):
    """Retrieve the generated assessment report for an interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    report = db.query(Report).filter(Report.interview_id == interview_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not generated yet for this interview")

    return report_service.format_report_response(db, report)


@router.post("/{interview_id}/report/generate", response_model=ReportResponse)
async def generate_report(interview_id: int, db: Session = Depends(get_db)):
    """Generate or regenerate the comprehensive report for an interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    report = await report_service.generate_report_for_interview(db, interview_id)
    return report_service.format_report_response(db, report)

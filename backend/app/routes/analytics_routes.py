from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.analytics import (
    OverviewStats,
    ProgressionData,
    CategoryPerformance,
    InterviewTypeBreakdown,
    PerformanceInsights
)
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview", response_model=OverviewStats)
def get_overview_analytics(db: Session = Depends(get_db)):
    """Retrieve top-level dashboard metrics based on real database records."""
    return analytics_service.get_overview_stats(db)


@router.get("/progression", response_model=ProgressionData)
def get_progression_analytics(
    range: str = Query("30 days", description="7 days, 30 days, 90 days, or All time"),
    db: Session = Depends(get_db)
):
    """Retrieve score progression across completed interview sessions."""
    return analytics_service.get_progression_data(db, range_filter=range)


@router.get("/categories", response_model=CategoryPerformance)
def get_category_analytics(db: Session = Depends(get_db)):
    """Retrieve performance scores across the 6 skill categories."""
    return analytics_service.get_category_performance(db)


@router.get("/interview-types", response_model=InterviewTypeBreakdown)
def get_interview_types_analytics(db: Session = Depends(get_db)):
    """Retrieve distribution breakdown of practiced interview types."""
    return analytics_service.get_interview_type_breakdown(db)


@router.get("/insights", response_model=PerformanceInsights)
def get_performance_insights(db: Session = Depends(get_db)):
    """Retrieve strongest category, focus areas, and recommended next practice."""
    return analytics_service.get_performance_insights(db)

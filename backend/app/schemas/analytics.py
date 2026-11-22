from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_interviews: int
    interviews_completed: int
    interviews_this_week: int
    average_score: int
    score_change_percent: str
    highest_score: int
    total_practice_time: str
    improvement_points: str
    recent_scores: List[int]
    recommended_practice: List[Dict[str, str]]


class ProgressionData(BaseModel):
    labels: List[str]
    scores: List[int]
    trend_description: str
    improvement_points: int


class CategoryPerformance(BaseModel):
    categories: Dict[str, int]
    radar_labels: List[str]


class InterviewTypeBreakdown(BaseModel):
    distribution: List[Dict[str, Any]]
    total_sessions: int


class PerformanceInsights(BaseModel):
    strongest_category: Dict[str, str]
    focus_area: Dict[str, str]
    most_improved: Dict[str, str]
    suggested_next: Dict[str, str]

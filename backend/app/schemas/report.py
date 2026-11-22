from typing import List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class QuestionReviewItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    q: str
    score: int
    answer: str
    feedback: str
    good: List[str] = Field(default_factory=list)
    missing: List[str] = Field(default_factory=list)
    improved: str


class NextStepItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    num: str
    title: str
    priority: str
    desc: str


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    interview_id: int
    overall_score: int
    category_scores: Dict[str, int]
    summary: str
    strengths: List[List[str]]  # [title, desc] pairs
    areas_for_improvement: List[List[str]]
    study_topics: List[str]
    next_steps: List[NextStepItem]
    reviews: List[QuestionReviewItem]
    completion_stats: Dict[str, Any]
    generated_at: datetime

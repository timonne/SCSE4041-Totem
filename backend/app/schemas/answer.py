from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.question import QuestionResponse


class EvaluationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    overall_score: float
    technical_accuracy: float = 0.0
    relevance: float = 0.0
    clarity: float = 0.0
    depth: float = 0.0
    problem_solving: float = 0.0
    communication: float = 0.0
    summary: Optional[str] = None
    strengths: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    feedback: str
    improved_answer: Optional[str] = None
    follow_up_recommended: bool = False
    follow_up_question: Optional[str] = None


class AnswerSubmit(BaseModel):
    question_id: int
    answer_text: str
    elapsed_seconds: Optional[int] = 0


class AnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    interview_id: int
    question_id: int
    answer_text: str
    submitted_at: datetime
    elapsed_seconds: int
    evaluation: Optional[EvaluationResponse] = None

    # Convenience properties for frontend compatibility
    question: Optional[QuestionResponse] = None
    text: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None


class NextInteractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    interview_id: int
    completed: bool
    status: str
    evaluation: EvaluationResponse
    next_question: Optional[QuestionResponse] = None
    current_question_index: int
    total_questions: int
    difficulty_adjusted: Optional[str] = None
    is_follow_up: bool = False

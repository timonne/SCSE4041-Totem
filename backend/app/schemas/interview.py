from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.question import QuestionResponse


class InterviewConfigSchema(BaseModel):
    role: str
    experience: str = "Intermediate"
    type: str = "Mixed"
    difficulty: str = "Medium"
    length: int = 10
    skills: List[str] = Field(default_factory=list)
    context: Optional[str] = ""
    prompt_version: Optional[str] = "v3"  # v1, v2, or v3


class InterviewCreateRequest(InterviewConfigSchema):
    pass


class InterviewSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    date: str
    type: str
    difficulty: str
    score: int
    questions: int
    duration: str
    status: str


class InterviewDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    experience: str
    type: str
    difficulty: str
    length: int
    skills: List[str]
    context: Optional[str]
    status: str
    current_question_index: int
    questions: List[QuestionResponse] = Field(default_factory=list)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: int = 0
    overall_score: Optional[float] = None
    completion_type: str = "normal"

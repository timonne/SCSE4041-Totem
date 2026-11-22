from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class QuestionBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    text: str = Field(..., validation_alias="question_text", serialization_alias="text", description="The interview question text")
    category: str = Field(..., description="Category: TECHNICAL, BEHAVIORAL, etc.")
    difficulty: str = Field(default="Medium", description="Question difficulty: Easy, Medium, Hard")
    followUp: bool = Field(default=False, validation_alias="is_follow_up", serialization_alias="followUp", description="Whether this is an adaptive follow-up")


class QuestionCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    text: str
    category: str
    difficulty: str = "Medium"
    followUp: bool = False
    question_order: int = 0
    parent_question_id: Optional[int] = None


class QuestionResponse(QuestionBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    interview_id: int
    question_order: int
    status: str
    parent_question_id: Optional[int] = None

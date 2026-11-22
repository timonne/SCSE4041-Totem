from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.dates import utc_now


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role = Column(String(100), nullable=False)
    experience = Column(String(50), nullable=False)
    interview_type = Column(String(50), nullable=False)
    difficulty = Column(String(50), nullable=False)
    question_count = Column(Integer, default=10)
    skills = Column(JSON, default=list)
    custom_instructions = Column(Text, nullable=True)
    
    # Statuses: Created, In Progress, Evaluating, Completed, Abandoned
    status = Column(String(50), default="Created", index=True)
    
    start_time = Column(DateTime, default=utc_now)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    
    overall_score = Column(Float, nullable=True)
    # Completion type: normal, early, abandoned
    completion_type = Column(String(50), default="normal")
    current_question_index = Column(Integer, default=0)
    
    # Relationships
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan", order_by="Question.question_order")
    answers = relationship("Answer", back_populates="interview", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="interview", uselist=False, cascade="all, delete-orphan")

    @property
    def type(self) -> str:
        return self.interview_type

    @property
    def length(self) -> int:
        return self.question_count

    @property
    def context(self) -> str:
        return self.custom_instructions or ""

    @property
    def date(self) -> str:
        if self.start_time:
            return self.start_time.strftime("%b %d, %Y")
        return "Nov 22, 2026"

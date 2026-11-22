from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    difficulty = Column(String(50), nullable=False)
    question_order = Column(Integer, nullable=False)
    
    is_follow_up = Column(Boolean, default=False)
    parent_question_id = Column(Integer, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    
    # Statuses: pending, active, answered, skipped
    status = Column(String(50), default="pending", index=True)

    # Relationships
    interview = relationship("Interview", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

    @property
    def text(self) -> str:
        return self.question_text

    @property
    def followUp(self) -> bool:
        return self.is_follow_up

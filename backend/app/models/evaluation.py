from sqlalchemy import Column, Integer, Float, Text, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    answer_id = Column(Integer, ForeignKey("answers.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # Overall score out of 100
    overall_score = Column(Float, nullable=False)
    
    # Individual rubric criteria (0 - 10)
    technical_accuracy = Column(Float, default=0.0)
    relevance = Column(Float, default=0.0)
    clarity = Column(Float, default=0.0)
    depth = Column(Float, default=0.0)
    problem_solving = Column(Float, default=0.0)
    communication = Column(Float, default=0.0)
    
    summary = Column(Text, nullable=True)
    strengths = Column(JSON, default=list)
    missing_concepts = Column(JSON, default=list)
    feedback = Column(Text, nullable=False)
    improved_answer = Column(Text, nullable=True)
    
    follow_up_recommended = Column(Boolean, default=False)
    follow_up_question = Column(Text, nullable=True)

    # Relationships
    answer = relationship("Answer", back_populates="evaluation")

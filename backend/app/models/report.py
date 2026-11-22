from datetime import datetime
from sqlalchemy import Column, Integer, Float, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.dates import utc_now


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    overall_score = Column(Float, nullable=False)
    category_scores = Column(JSON, default=dict)  # e.g. {"Technical Knowledge": 86, "Communication": 82, ...}
    summary = Column(Text, nullable=False)
    strengths = Column(JSON, default=list)
    areas_for_improvement = Column(JSON, default=list)
    study_topics = Column(JSON, default=list)
    next_steps = Column(JSON, default=list)  # list of {num, title, priority, desc}
    completion_stats = Column(JSON, default=dict)  # {total_questions, answered, skipped, duration_str}
    
    generated_at = Column(DateTime, default=utc_now)

    # Relationships
    interview = relationship("Interview", back_populates="report")

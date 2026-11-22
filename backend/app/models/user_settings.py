from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database import Base
from app.utils.dates import utc_now


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, default=1)
    default_length = Column(String(50), default="10 questions")
    default_difficulty = Column(String(50), default="Medium")
    preferred_type = Column(String(50), default="Mixed")
    experience_level = Column(String(50), default="Intermediate")
    
    detailed_feedback = Column(Boolean, default=True)
    include_sample_answers = Column(Boolean, default=True)
    study_recommendations = Column(Boolean, default=True)
    
    theme = Column(String(20), default="dark")
    reduce_motion = Column(Boolean, default=False)
    high_contrast = Column(Boolean, default=False)
    text_size = Column(String(20), default="Default")
    
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

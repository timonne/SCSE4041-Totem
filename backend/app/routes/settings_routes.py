from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user_settings import UserSettings
from app.schemas.settings import UserSettingsSchema, UserSettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("", response_model=UserSettingsSchema)
def get_user_settings(db: Session = Depends(get_db)):
    """Retrieve current user settings from persistent database storage."""
    settings_obj = db.query(UserSettings).filter(UserSettings.id == 1).first()
    if not settings_obj:
        settings_obj = UserSettings(id=1)
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)

    return UserSettingsSchema(
        length=settings_obj.default_length,
        difficulty=settings_obj.default_difficulty,
        type=settings_obj.preferred_type,
        experience=settings_obj.experience_level,
        detail=settings_obj.detailed_feedback,
        samples=settings_obj.include_sample_answers,
        study=settings_obj.study_recommendations,
        reduce=settings_obj.reduce_motion,
        contrast=settings_obj.high_contrast,
        size=settings_obj.text_size,
        theme=settings_obj.theme
    )


@router.put("", response_model=UserSettingsSchema)
def update_user_settings(payload: UserSettingsUpdate, db: Session = Depends(get_db)):
    """Update user settings and persist changes in SQLite."""
    settings_obj = db.query(UserSettings).filter(UserSettings.id == 1).first()
    if not settings_obj:
        settings_obj = UserSettings(id=1)
        db.add(settings_obj)

    settings_obj.default_length = payload.length
    settings_obj.default_difficulty = payload.difficulty
    settings_obj.preferred_type = payload.type
    settings_obj.experience_level = payload.experience
    settings_obj.detailed_feedback = payload.detail
    settings_obj.include_sample_answers = payload.samples
    settings_obj.study_recommendations = payload.study
    settings_obj.reduce_motion = payload.reduce
    settings_obj.high_contrast = payload.contrast
    settings_obj.text_size = payload.size
    settings_obj.theme = payload.theme

    db.commit()
    db.refresh(settings_obj)

    return UserSettingsSchema(
        length=settings_obj.default_length,
        difficulty=settings_obj.default_difficulty,
        type=settings_obj.preferred_type,
        experience=settings_obj.experience_level,
        detail=settings_obj.detailed_feedback,
        samples=settings_obj.include_sample_answers,
        study=settings_obj.study_recommendations,
        reduce=settings_obj.reduce_motion,
        contrast=settings_obj.high_contrast,
        size=settings_obj.text_size,
        theme=settings_obj.theme
    )

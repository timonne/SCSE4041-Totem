from typing import Optional
from pydantic import BaseModel, ConfigDict


class UserSettingsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    length: str = "10 questions"
    difficulty: str = "Medium"
    type: str = "Mixed"
    experience: str = "Intermediate"
    detail: bool = True
    samples: bool = True
    study: bool = True
    reduce: bool = False
    contrast: bool = False
    size: str = "Default"
    theme: str = "dark"


class UserSettingsUpdate(UserSettingsSchema):
    pass

from app.routes.interview_routes import router as interview_router
from app.routes.question_routes import router as question_router
from app.routes.answer_routes import router as answer_router
from app.routes.report_routes import router as report_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.settings_routes import router as settings_router
from app.routes.prompt_routes import router as prompt_router

__all__ = [
    "interview_router",
    "question_router",
    "answer_router",
    "report_router",
    "analytics_router",
    "settings_router",
    "prompt_router",
]

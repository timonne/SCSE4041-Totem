from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.config import settings
from app.database import init_db, SessionLocal
from app.services.ai_service import ai_service
from app.routes import (
    interview_router,
    question_router,
    answer_router,
    report_router,
    analytics_router,
    settings_router,
    prompt_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for AI-Powered Mock Interview Assistant",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "type": type(exc).__name__}
    )

# Health endpoint
@app.get("/api/health", tags=["Health"])
def health_check():
    db_connected = False
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "version": settings.APP_VERSION,
        "database_connected": db_connected,
        "ai_provider": settings.AI_PROVIDER,
        "ai_model": settings.AI_MODEL,
        "ai_provider_configured": ai_service.is_provider_configured()
    }


# Register Routers
app.include_router(interview_router)
app.include_router(question_router)
app.include_router(answer_router)
app.include_router(report_router)
app.include_router(analytics_router)
app.include_router(settings_router)
app.include_router(prompt_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router
from backend.db.database import create_tables
from backend.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="AI Research Agent",
    description="Multi-agent research assistant",
    version="1.0.0"
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes under /api
app.include_router(router, prefix="/api")

# Create tables on startup
@app.on_event("startup")
def startup():
    create_tables()


@app.get("/")
def root():
    return {"message": "AI Research Agent API is running"}
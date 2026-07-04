from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.db.database import get_db
from backend.db.models import ResearchSession, AgentStep, ResearchSource
from backend.agents.orchestrator import run_research_pipeline
import threading

router = APIRouter()


# --- Request / Response Models ---

class ResearchRequest(BaseModel):
    query: str
    language: str = "English"


class ResearchResponse(BaseModel):
    session_id: str
    query: str
    status: str
    message: str


# --- Routes ---

@router.post("/research", response_model=ResearchResponse)
def start_research(request: ResearchRequest, db: Session = Depends(get_db)):
    """
    Starts a new research job in the background.
    Returns session_id immediately so frontend can poll for status.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    if len(request.query) > 500:
        raise HTTPException(status_code=400, detail="Query too long, max 500 characters")

    # Run pipeline in background thread so API returns immediately
    thread = threading.Thread(
    target=run_research_pipeline,
    args=(request.query, None, request.language)
)
    thread.daemon = True
    thread.start()

    return ResearchResponse(
        session_id="pending",
        query=request.query,
        status="started",
        message="Research started. Use /sessions to track progress."
    )


@router.get("/sessions")
def get_all_sessions(db: Session = Depends(get_db)):
    """
    Returns all research sessions, newest first.
    """
    sessions = db.query(ResearchSession).order_by(
        ResearchSession.created_at.desc()
    ).limit(20).all()

    return [
        {
            "id":         str(s.id),
            "query":      s.query,
            "status":     s.status,
            "summary":    s.summary,
            "created_at": str(s.created_at)
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    """
    Returns full details of a single research session.
    """
    session = db.query(ResearchSession).filter(
        ResearchSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    steps = db.query(AgentStep).filter(
        AgentStep.session_id == session_id
    ).order_by(AgentStep.created_at.asc()).all()

    sources = db.query(ResearchSource).filter(
        ResearchSource.session_id == session_id
    ).order_by(ResearchSource.relevance.desc()).all()

    return {
        "id":         str(session.id),
        "query":      session.query,
        "status":     session.status,
        "report":     session.report,
        "summary":    session.summary,
        "created_at": str(session.created_at),
        "steps": [
            {
                "agent_name":  s.agent_name,
                "action":      s.action,
                "status":      s.status,
                "created_at":  str(s.created_at)
            }
            for s in steps
        ],
        "sources": [
            {
                "title":     s.title,
                "url":       s.url,
                "relevance": s.relevance
            }
            for s in sources
        ]
    }


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    """
    Deletes a research session and all its data.
    """
    session = db.query(ResearchSession).filter(
        ResearchSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)
    db.commit()

    return {"message": "Session deleted successfully"}

class TranslateRequest(BaseModel):
    report: str
    language: str

@router.post("/translate")
def translate_report(request: TranslateRequest):
    """
    Translates an existing report to a different language.
    """
    from langchain_groq import ChatGroq
    from langchain_core.messages import HumanMessage, SystemMessage
    from backend.core.config import get_settings

    settings = get_settings()
    llm = ChatGroq(
        model="qwen-qwq-32b",
        api_key=settings.groq_api_key,
        temperature=0.3
    )

    messages = [
        SystemMessage(content=f"""You are a professional translator. 
        Translate the following research report to {request.language} language.
        Keep all markdown formatting (##, ###, -, *) exactly the same.
        Only translate the text content, not the markdown symbols.
        Return only the translated report, nothing else."""),
        HumanMessage(content=request.report)
    ]

    response = llm.invoke(messages)
    return {"translated_report": response.content.strip()}


@router.get("/health")
def health_check():
    """
    Simple health check endpoint.
    """
    return {"status": "ok", "message": "AI Research Agent is running"}
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Enum as SAEnum, JSON
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid
import enum

Base = declarative_base()


class ResearchStatus(str, enum.Enum):
    PENDING   = "pending"
    RUNNING   = "running"
    COMPLETED = "completed"
    FAILED    = "failed"


class ResearchSession(Base):
    __tablename__ = "research_sessions"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query      = Column(Text, nullable=False)
    status     = Column(SAEnum(ResearchStatus), default=ResearchStatus.PENDING)
    report     = Column(Text, nullable=True)
    summary    = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    steps   = relationship("AgentStep",      back_populates="session", cascade="all, delete-orphan")
    sources = relationship("ResearchSource", back_populates="session", cascade="all, delete-orphan")


class AgentStep(Base):
    __tablename__ = "agent_steps"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id  = Column(UUID(as_uuid=True), ForeignKey("research_sessions.id"), nullable=False)
    agent_name  = Column(String(64),  nullable=False)
    action      = Column(String(128), nullable=False)
    input_data  = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    status      = Column(String(32), default="success")
    error       = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session = relationship("ResearchSession", back_populates="steps")


class ResearchSource(Base):
    __tablename__ = "research_sources"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("research_sessions.id"), nullable=False)
    title      = Column(Text, nullable=True)
    url        = Column(Text, nullable=True)
    content    = Column(Text, nullable=True)
    relevance  = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session = relationship("ResearchSession", back_populates="sources")
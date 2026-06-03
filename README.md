# AI Research Agent 🤖

A production-ready multi-agent AI system that autonomously researches any topic and generates structured reports with citations.

## How It Works

User Query → Planner Agent → Researcher Agent(s) → Writer Agent → Structured Report

## Features

- Multi-agent pipeline (Planner, Researcher, Writer)
- Real-time web search via Tavily API
- Wikipedia integration
- Structured report generation with citations
- FastAPI REST backend
- React dashboard with live session tracking
- PostgreSQL database for session history

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI |
| Agents | LangChain, LangGraph |
| LLM | Groq (Llama 3.3 70B) |
| Search | Tavily API, Wikipedia |
| Database | PostgreSQL, SQLAlchemy |
| Frontend | React, Axios |

## Quick Start

### Backend
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Environment Variables

Create a `.env` file in the root folder:

GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/research_agent
OPENAI_API_KEY=your_openai_key
SECRET_KEY=your_secret_key

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/research | Start a research job |
| GET | /api/sessions | Get all sessions |
| GET | /api/sessions/{id} | Get session details |
| DELETE | /api/sessions/{id} | Delete a session |
| GET | /api/health | Health check |

## Project Structure

ai-research-agent/
├── backend/
│   ├── agents/
│   │   ├── planner.py
│   │   ├── researcher.py
│   │   ├── writer.py
│   │   └── orchestrator.py
│   ├── api/
│   │   └── routes.py
│   ├── core/
│   │   └── config.py
│   ├── db/
│   │   ├── models.py
│   │   └── database.py
│   └── tools/
│       └── search_tools.py
├── frontend/
├── main.py
└── requirements.txt

## License

MIT





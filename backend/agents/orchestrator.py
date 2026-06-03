from backend.agents.planner import run_planner
from backend.agents.researcher import run_researcher
from backend.agents.writer import run_writer
from backend.db.database import SessionLocal
from backend.db.models import ResearchSession, AgentStep, ResearchSource, ResearchStatus
import uuid


def run_research_pipeline(query: str, session_id: str = None) -> dict:
    """
    Main pipeline that connects all agents.
    Planner → Researcher (x N) → Writer → Save to DB
    """
    db = SessionLocal()

    try:
        # --- Create session in DB ---
        if session_id is None:
            session_id = str(uuid.uuid4())

        session = ResearchSession(
            id=session_id,
            query=query,
            status=ResearchStatus.RUNNING
        )
        db.add(session)
        db.commit()

        # --- Step 1: Planner Agent ---
        print(f"[Planner] Breaking down query: {query}")
        sub_questions = run_planner(query)

        db.add(AgentStep(
            session_id=session_id,
            agent_name="planner",
            action="generate_sub_questions",
            input_data={"query": query},
            output_data={"sub_questions": sub_questions},
            status="success"
        ))
        db.commit()

        # --- Step 2: Researcher Agent (runs for each sub-question) ---
        all_research = []
        for i, question in enumerate(sub_questions, 1):
            print(f"[Researcher] Researching ({i}/{len(sub_questions)}): {question}")

            try:
                result = run_researcher(question)
                all_research.append(result)

                db.add(AgentStep(
                    session_id=session_id,
                    agent_name="researcher",
                    action="web_search_and_summarize",
                    input_data={"question": question},
                    output_data={"summary": result["summary"]},
                    status="success"
                ))

                # Save sources to DB
                for source in result.get("sources", []):
                    db.add(ResearchSource(
                        session_id=session_id,
                        title=source.get("title", ""),
                        url=source.get("url", ""),
                        content=source.get("content", "")[:1000],
                        relevance=source.get("relevance", 0)
                    ))

                db.commit()

            except Exception as e:
                print(f"[Researcher] Error: {e}")
                db.add(AgentStep(
                    session_id=session_id,
                    agent_name="researcher",
                    action="web_search_and_summarize",
                    input_data={"question": question},
                    output_data={},
                    status="failed",
                    error=str(e)
                ))
                db.commit()

        # --- Step 3: Writer Agent ---
        print(f"[Writer] Compiling final report...")
        writer_result = run_writer(query, all_research)

        db.add(AgentStep(
            session_id=session_id,
            agent_name="writer",
            action="compile_report",
            input_data={"research_count": len(all_research)},
            output_data={"summary": writer_result["summary"]},
            status="success"
        ))

        # --- Update session with final report ---
        session.report = writer_result["report"]
        session.summary = writer_result["summary"]
        session.status = ResearchStatus.COMPLETED
        db.commit()

        print(f"[Orchestrator] Done! Session: {session_id}")

        return {
            "session_id":   session_id,
            "query":        query,
            "status":       "completed",
            "report":       writer_result["report"],
            "summary":      writer_result["summary"],
            "sources_count": len([s for r in all_research for s in r.get("sources", [])]),
            "steps_count":  len(sub_questions) + 2
        }

    except Exception as e:
        if session:
            session.status = ResearchStatus.FAILED
            db.commit()
        print(f"[Orchestrator] Pipeline failed: {e}")
        raise e

    finally:
        db.close()
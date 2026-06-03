from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from backend.core.config import get_settings
import json

settings = get_settings()

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=settings.groq_api_key,
    temperature=0.3
)
PLANNER_SYSTEM_PROMPT = """
You are a Research Planner Agent. Your job is to break down a research query 
into clear, focused sub-questions that can be searched individually.

Rules:
- Generate exactly 3 to 5 sub-questions
- Each sub-question must be specific and searchable
- Cover different angles: overview, recent developments, applications, challenges
- Return ONLY a valid JSON array of strings, nothing else

Example output:
["What is quantum computing?", "Recent breakthroughs in quantum computing 2024", 
"Real world applications of quantum computing", "Challenges in quantum computing"]
"""


def run_planner(query: str) -> list[str]:
    """
    Takes a user query and returns a list of sub-questions to research.
    """
    messages = [
        SystemMessage(content=PLANNER_SYSTEM_PROMPT),
        HumanMessage(content=f"Research query: {query}")
    ]

    response = llm.invoke(messages)
    raw = response.content.strip()

    # Clean markdown code blocks if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        sub_questions = json.loads(raw)
        return sub_questions
    except json.JSONDecodeError:
        # Fallback: return original query as single item
        return [query]
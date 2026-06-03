from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from backend.core.config import get_settings
from backend.tools.search_tools import web_search, wikipedia_search

settings = get_settings()

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=settings.groq_api_key,
    temperature=0.3
)

RESEARCHER_SYSTEM_PROMPT = """
You are a Research Agent. You receive a question and raw search results.
Your job is to extract the most relevant and accurate information.

Rules:
- Write a clear, factual summary of the findings
- Include key facts, numbers, and insights
- Keep it between 150-250 words
- Do not add opinions or assumptions
- Only use information from the provided search results
"""


def run_researcher(question: str) -> dict:
    """
    Takes a single sub-question, searches the web,
    and returns a summary with sources.
    """
    # Step 1: Search the web
    web_results = web_search(question, max_results=3)

    # Step 2: Search Wikipedia
    wiki_result = wikipedia_search(question)

    # Step 3: Combine all content
    combined_content = ""
    sources = []

    for r in web_results:
        if r.get("content") and not r.get("error"):
            combined_content += f"\nSource: {r['title']}\n{r['content']}\n"
            sources.append({
                "title":     r.get("title", ""),
                "url":       r.get("url", ""),
                "content":   r.get("content", ""),
                "relevance": int(r.get("score", 0) * 100)
            })

    if wiki_result.get("content"):
        combined_content += f"\nWikipedia: {wiki_result['title']}\n{wiki_result['content']}\n"
        sources.append({
            "title":     wiki_result.get("title", ""),
            "url":       wiki_result.get("url", ""),
            "content":   wiki_result.get("content", ""),
            "relevance": 80
        })

    # Step 4: Ask LLM to summarize
    messages = [
        SystemMessage(content=RESEARCHER_SYSTEM_PROMPT),
        HumanMessage(content=f"Question: {question}\n\nSearch Results:\n{combined_content}")
    ]

    response = llm.invoke(messages)

    return {
        "question": question,
        "summary":  response.content.strip(),
        "sources":  sources
    }
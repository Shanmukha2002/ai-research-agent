from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from backend.core.config import get_settings

settings = get_settings()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=settings.groq_api_key,
    temperature=0.4
)


def run_writer(query: str, research_results: list[dict], language: str = "English") -> dict:
    """
    Takes the original query and all research results,
    compiles them into a final report in the specified language.
    """

    WRITER_SYSTEM_PROMPT = f"""
You are a Professional Research Writer Agent. You receive a research query 
and multiple research summaries. Your job is to compile them into a 
well-structured, professional research report.

IMPORTANT: Write the ENTIRE report in {language} language only.

Report Format:
# [Report Title]

## Executive Summary
2-3 sentence overview of the entire report.

## Key Findings
- Finding 1
- Finding 2
- Finding 3
- Finding 4
- Finding 5

## Detailed Analysis

### [Section 1 Title]
Detailed paragraph based on research summary 1.

### [Section 2 Title]
Detailed paragraph based on research summary 2.

### [Section 3 Title]
Detailed paragraph based on research summary 3.

## Conclusion
2-3 sentences summarizing insights and future outlook.

Rules:
- Write everything in {language} language
- Be factual and professional
- Use the research summaries provided
- Keep total length between 500-800 words
"""

    research_content = ""
    for i, result in enumerate(research_results, 1):
        research_content += f"\n--- Research {i} ---\n"
        research_content += f"Question: {result['question']}\n"
        research_content += f"Summary: {result['summary']}\n"

    messages = [
        SystemMessage(content=WRITER_SYSTEM_PROMPT),
        HumanMessage(content=f"Original Query: {query}\n\nResearch Summaries:\n{research_content}")
    ]

    response = llm.invoke(messages)
    report = response.content.strip()

    lines = report.split("\n")
    short_summary = ""
    for line in lines:
        if line.strip() and not line.startswith("#") and not line.startswith("-"):
            short_summary = line.strip()
            break

    return {
        "report":  report,
        "summary": short_summary
    }
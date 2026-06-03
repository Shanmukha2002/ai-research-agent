import wikipedia
from tavily import TavilyClient
from backend.core.config import get_settings

settings = get_settings()
tavily = TavilyClient(api_key=settings.tavily_api_key)


def web_search(query: str, max_results: int = 5) -> list[dict]:
    """
    Searches the web using Tavily.
    Returns a list of results with title, url, and content.
    """
    try:
        response = tavily.search(
            query=query,
            max_results=max_results,
            search_depth="advanced"
        )
        results = []
        for r in response.get("results", []):
            results.append({
                "title":   r.get("title", ""),
                "url":     r.get("url", ""),
                "content": r.get("content", ""),
                "score":   r.get("score", 0)
            })
        return results

    except Exception as e:
        return [{"error": str(e), "title": "", "url": "", "content": ""}]


def wikipedia_search(query: str, sentences: int = 5) -> dict:
    """
    Searches Wikipedia and returns a summary.
    """
    try:
        wiki = wikipedia.summary(query, sentences=sentences, auto_suggest=True)
        page = wikipedia.page(query, auto_suggest=True)
        return {
            "title":   page.title,
            "url":     page.url,
            "content": wiki
        }
    except wikipedia.exceptions.DisambiguationError as e:
        try:
            wiki = wikipedia.summary(e.options[0], sentences=sentences)
            page = wikipedia.page(e.options[0])
            return {
                "title":   page.title,
                "url":     page.url,
                "content": wiki
            }
        except Exception:
            return {"title": "", "url": "", "content": ""}
    except Exception as e:
        return {"title": "", "url": "", "content": str(e)}
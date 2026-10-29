from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.indexing.inverted_index import load_documents
from src.ranking.hybrid_search import HybridSearch

PROJECT_ROOT = Path(__file__).resolve().parent.parent

app = FastAPI(
    title = "AI Semantic Search Engine",
    description = "API for keyword and semantic document search",
    version = "1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["http://localhost:5173"],
    allow_credentials = False,
    allow_methods = ["GET", "POST"],
    allow_headers = ["*"]
)

class SearchRequest(BaseModel):
    query: str = Field(min_length = 1, max_length = 500)
    top_k: int = Field(default = 5, ge=1, le=20)

@lru_cache(maxsize=1)
def get_search_engine():
    data_path = PROJECT_ROOT / "data" / "sample"
    documents = load_documents(str(data_path))

    if not documents:
        raise RuntineError("No documents found in data/sample.")

    engine = HybridSearch(alpha = 0.5)
    engine.fit(documents)

    return engine

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/documents")
def list_documents():
    engine = get_search_engine()
    return {"documents": list(engine.documents.keys())}

@app.post("/search")
def search_documents(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(
            status_code = 400,
            detail = "Search query cannot be empty.",
        )

    engine = get_search_engine()
    results = engine.search(
        request.query.strip(),
        top_k = request.top_k,  #trialing comma
    )

    return {
        "query": request.query,
        "total_results": len(results),
        "results": results,
    }


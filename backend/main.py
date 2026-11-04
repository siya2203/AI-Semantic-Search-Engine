from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.indexing.inverted_index import load_documents
from src.ranking.hybrid_search import HybridSearch

from fastapi import UploadFile, File
from uuid import uuid4

PROJECT_ROOT = Path(__file__).resolve().parent.parent

app = FastAPI(
    title = "AI Semantic Search Engine",
    description = "API for keyword and semantic document search",
    version = "1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str = Field(min_length = 1, max_length = 500)
    top_k: int = Field(default = 5, ge=1, le=20)

@lru_cache(maxsize=1)
def get_search_engine():
    sample_path = PROJECT_ROOT / "data" / "sample"
    upload_path = PROJECT_ROOT / "data" / "uploads"

    upload_path.mkdir(parents = True, exist_ok = True)

    documents = {}

    documents.update(load_documents(str(sample_path)))
    documents.update(load_documents(str(upload_path)))

    if not documents:
        raise RuntimeError("No documents found.")

    engine = HybridSearch(alpha = 0.5)
    engine.fit(documents)

    return engine

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/documents")
def list_documents():
    upload_path = PROJECT_ROOT / "data" / "uploads"
    upload_path.mkdir(parents = True, exist_ok = True)

    documents = []

    for file_path in upload_path.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in {".txt", ".pdf"}:
            stored_name = file_path.name

            # Extract original filename from UUID-prefixed filenames
            if len(stored_name) > 33 and stored_name[32] == "_":
                original_name = stored_name[33:]
            else:
                original_name = stored_name

            documents.append({
                "id": stored_name,
                "name": original_name,
                "file_type": file_path.suffix.lower().replace(".", "").upper(),
                "size": file_path.stat().st_size
            })

    return {"documents": documents}

@app.post("/upload")
async def upload_documents(file: UploadFile = File(...)):
    allowed_extensions = {".txt", ".pdf"}

    if not file.filename:
        raise HTTPException(
            status_code = 400,
            detail = "No filename provided."
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code = 400,
            detail = "Only PDF and TXT files are supported."
        )

    upload_path = PROJECT_ROOT / "data" / "uploads"
    upload_path.mkdir(parents = True, exist_ok = True)

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code = 400,
            detail = "Uploaded file is empty."
        )

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code = 413,
            detail = "File size must not exceed 10 MB."
        )

    original_name = Path(file.filename.replace("\\", "/")).name
    filename = f"{uuid4().hex}_{original_name}"
    file_path = upload_path / filename

    file_path.write_bytes(content)

    get_search_engine.cache_clear()

    return {
        "message": "Document uploaded successfully.",
        "filename": filename,
        "size": len(content),
    }

@app.delete("/documents/{document_id}")
def delete_document(document_id: str):
    upload_path = PROJECT_ROOT / "data" / "uploads"

    # Find the requested uploaded document
    file_path = upload_path / document_id

    # Ensure the file exists and is inside uploads
    if not file_path.is_file() or file_path.parent != upload_path:
        raise HTTPException(
            status_code = 404,
            detail = "Uploaded document not found."
        )

    # Delete only the selected document
    file_path.unlink()

    # Rebuild the search engine on the next search request
    get_search_engine.cache_clear()

    return {
        "message": "Document deleted successfully.",
        "deleted_document": document_id
    }

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

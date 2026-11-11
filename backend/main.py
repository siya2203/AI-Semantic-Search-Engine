import random
import csv
from functools import lru_cache
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.indexing.inverted_index import load_documents
from src.ranking.hybrid_search import HybridSearch


PROJECT_ROOT = Path(__file__).resolve().parent.parent

app = FastAPI(
    title="AI Semantic Search Engine",
    description="API for keyword and semantic document search",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    top_k: int = Field(default=5, ge=1, le=20)



def load_training_documents():
    """Load a balanced subset of the 20 Newsgroups training dataset."""

    dataset_path = (
        PROJECT_ROOT
        / "data"
        / "dataset"
        / "20_newsgroups"
    )

    train_path = dataset_path / "documents" / "train"
    metadata_path = dataset_path / "metadata.csv"

    if not train_path.exists():
        raise RuntimeError("Training dataset folder not found.")

    if not metadata_path.exists():
        raise RuntimeError("Dataset metadata.csv not found.")

    documents = {}
    document_categories = {}

    # Read training metadata
    with open(
        metadata_path,
        "r",
        encoding="utf-8",
        newline=""
    ) as csv_file:

        reader = csv.DictReader(csv_file)

        training_rows = [
            row for row in reader
            if row["split"] == "train"
        ]

    # Group documents by category
    categories = {}

    for row in training_rows:
        category = row["category"]
        categories.setdefault(category, []).append(row)

    # Select up to 100 documents from each category
    rng = random.Random(42)

    for category, rows in categories.items():

        selected_rows = rng.sample(
            rows,
            min(100, len(rows))
        )

        for row in selected_rows:

            file_path = train_path / row["file_name"]

            if not file_path.is_file():
                continue

            text = file_path.read_text(
                encoding="utf-8",
                errors="replace"
            )

            if text.strip():
                document_id = row["document_id"]

                documents[document_id] = text
                document_categories[document_id] = category

    print(f"Training documents selected: {len(documents)}")
    print(f"Categories selected: {len(categories)}")

    return documents, document_categories


@lru_cache(maxsize=1)
def get_search_engine():
    """Build and cache the search engine."""

    sample_path = PROJECT_ROOT / "data" / "sample"
    upload_path = PROJECT_ROOT / "data" / "uploads"

    upload_path.mkdir(parents=True, exist_ok=True)

    # Load the main training dataset
    documents, document_categories = load_training_documents()

    # Preserve sample documents
    documents.update(load_documents(str(sample_path)))

    # Preserve uploaded documents
    documents.update(load_documents(str(upload_path)))

    if not documents:
        raise RuntimeError("No documents found.")

    print(f"Total documents loaded: {len(documents)}")
    print("Generating TF-IDF and semantic representations...")

    engine = HybridSearch(alpha=0.5)
    engine.fit(documents)

    # Retain category information for future use
    engine.document_categories = document_categories

    print("Search engine is ready!")

    return engine


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/documents")
def list_documents():

    upload_path = PROJECT_ROOT / "data" / "uploads"
    upload_path.mkdir(parents=True, exist_ok=True)

    documents = []

    for file_path in upload_path.iterdir():

        if file_path.is_file() and file_path.suffix.lower() in {".txt", ".pdf"}:

            stored_name = file_path.name

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
            status_code=400,
            detail="No filename provided."
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and TXT files are supported."
        )

    upload_path = PROJECT_ROOT / "data" / "uploads"
    upload_path.mkdir(parents=True, exist_ok=True)

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File size must not exceed 10 MB."
        )

    original_name = Path(file.filename.replace("\\", "/")).name
    filename = f"{uuid4().hex}_{original_name}"

    file_path = upload_path / filename
    file_path.write_bytes(content)

    # Rebuild the search engine on the next search
    get_search_engine.cache_clear()

    return {
        "message": "Document uploaded successfully.",
        "filename": filename,
        "size": len(content)
    }


@app.delete("/documents/{document_id}")
def delete_document(document_id: str):

    upload_path = PROJECT_ROOT / "data" / "uploads"
    file_path = upload_path / document_id

    if not file_path.is_file() or file_path.parent != upload_path:
        raise HTTPException(
            status_code=404,
            detail="Uploaded document not found."
        )

    file_path.unlink()

    # Rebuild the search engine on the next search
    get_search_engine.cache_clear()

    return {
        "message": "Document deleted successfully.",
        "deleted_document": document_id
    }



@app.post("/search")
def search_documents(request: SearchRequest):

    if not request.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty."
        )

    engine = get_search_engine()

    results = engine.search(
        request.query.strip(),
        top_k=request.top_k
    )

    # Add category information to each result
    for result in results:
        document_id = result["document"]

        result["category"] = engine.document_categories.get(
            document_id,
            "sample/uploaded document"
        )

    # Add a short document preview
    for result in results:
        document_id = result["document"]

        if document_id in engine.documents:
            result["preview"] = engine.documents[document_id][:250]

    return {
        "query": request.query,
        "total_results": len(results),
        "results": results
    }

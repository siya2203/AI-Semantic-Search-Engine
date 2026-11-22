
import json
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    PROJECT_ROOT
    / "frontend"
    / "public"
    / "data"
    / "documents.json"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "frontend"
    / "public"
    / "data"
    / "embeddings.bin"
)

MODEL_NAME = "all-MiniLM-L6-v2"
BATCH_SIZE = 16

print("Loading documents...")

with open(INPUT_FILE, "r", encoding="utf-8") as file:
    documents = json.load(file)

print(f"Loaded {len(documents)} documents.")

print(f"Loading model: {MODEL_NAME}")

model = SentenceTransformer(MODEL_NAME)

texts = [document["text"] for document in documents]

print("Generating document embeddings...")

embeddings = model.encode(
    texts,
    batch_size=BATCH_SIZE,
    show_progress_bar=True,
    convert_to_numpy=True,
    normalize_embeddings=True
)

embeddings = np.asarray(embeddings, dtype=np.float32)

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

embeddings.tofile(OUTPUT_FILE)

print("\nEmbedding generation complete!")
print(f"Documents: {len(documents)}")
print(f"Embedding shape: {embeddings.shape}")
print(f"Embedding dimensions: {embeddings.shape[1]}")
print(f"Output size: {OUTPUT_FILE.stat().st_size / (1024 * 1024):.2f} MB")
print(f"Saved to: {OUTPUT_FILE}")

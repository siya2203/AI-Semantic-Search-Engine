
import csv
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_DIR = PROJECT_ROOT / "data/dataset/20_newsgroups"
DOCUMENTS_DIR = DATASET_DIR / "documents/train"
METADATA_FILE = DATASET_DIR / "metadata.csv"

OUTPUT_DIR = PROJECT_ROOT / "frontend/public/data"
OUTPUT_FILE = OUTPUT_DIR / "documents.json"

documents = []
missing = 0
processed = 0

with open(METADATA_FILE, "r", encoding="utf-8", newline="") as file:
    reader = csv.DictReader(file)

    for row in reader:
        if row["split"] != "train":
            continue

        document_path = DOCUMENTS_DIR / row["file_name"]

        try:
            text = document_path.read_text(
                encoding="utf-8",
                errors="replace"
            ).strip()
        except OSError:
            missing += 1
            continue

        if not text:
            continue

        documents.append({
            "id": row["document_id"],
            "document": row["file_name"],
            "category": row["category"],
            "text": text
        })

        processed += 1

        if processed % 500 == 0:
            print(f"Processed {processed} documents...")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
    json.dump(documents, file, ensure_ascii=False)

print("\nDataset preparation complete!")
print(f"Documents processed: {processed}")
print(f"Missing files: {missing}")
print(f"Output size: {OUTPUT_FILE.stat().st_size / (1024 * 1024):.2f} MB")
print(f"Saved to: {OUTPUT_FILE}")

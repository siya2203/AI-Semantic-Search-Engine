
import csv
import re
import hashlib
from pathlib import Path
from collections import Counter
from sklearn.datasets import fetch_20newsgroups

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "data" / "dataset" / "20_newsgroups"
DOCUMENTS_DIR = OUTPUT_DIR / "documents"

TRAIN_DIR = DOCUMENTS_DIR / "train"
TEST_DIR = DOCUMENTS_DIR / "test"

METADATA_FILE = OUTPUT_DIR / "metadata.csv"

# Create directories
TRAIN_DIR.mkdir(parents=True, exist_ok=True)
TEST_DIR.mkdir(parents=True, exist_ok=True)


def normalize_text(text):
    """Normalize text for duplicate detection."""
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def prepare_split(split_name):
    """Download, clean and save one dataset split."""

    print(f"\nProcessing {split_name} dataset...")

    dataset = fetch_20newsgroups(
        subset=split_name,
        remove=("headers", "footers", "quotes")
    )

    output_folder = TRAIN_DIR if split_name == "train" else TEST_DIR

    seen_documents = set()
    records = []

    empty_count = 0
    duplicate_count = 0

    for index, (text, category_id) in enumerate(
        zip(dataset.data, dataset.target)
    ):
        text = text.strip()

        # Remove empty documents
        if not text:
            empty_count += 1
            continue

        normalized = normalize_text(text)

        # Remove duplicate documents within this split
        if normalized in seen_documents:
            duplicate_count += 1
            continue

        seen_documents.add(normalized)

        # Generate a stable document ID
        document_id = f"{split_name}_{index:05d}"

        file_name = f"{document_id}.txt"
        file_path = output_folder / file_name

        file_path.write_text(text, encoding="utf-8")

        records.append({
            "document_id": document_id,
            "file_name": file_name,
            "split": split_name,
            "category_id": int(category_id),
            "category": dataset.target_names[category_id],
            "word_count": len(text.split()),
            "text_hash": hashlib.sha256(
                normalized.encode("utf-8")
            ).hexdigest()
        })

    print(f"Original documents: {len(dataset.data)}")
    print(f"Empty documents removed: {empty_count}")
    print(f"Duplicates removed: {duplicate_count}")
    print(f"Saved documents: {len(records)}")

    return records, dataset.target_names


# Process training and testing separately
train_records, categories = prepare_split("train")
test_records, _ = prepare_split("test")

# Save metadata
all_records = train_records + test_records

with open(METADATA_FILE, "w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(
        file,
        fieldnames=[
            "document_id",
            "file_name",
            "split",
            "category_id",
            "category",
            "word_count",
            "text_hash"
        ]
    )

    writer.writeheader()
    writer.writerows(all_records)

# Dataset summary
print("\n========== FINAL DATASET SUMMARY ==========")
print("Training documents:", len(train_records))
print("Testing documents:", len(test_records))
print("Total saved documents:", len(all_records))
print("Total categories:", len(categories))
print("Metadata saved at:", METADATA_FILE)

print("\nDocuments per category:")

category_counts = Counter(
    record["category"] for record in all_records
)

for category, count in sorted(category_counts.items()):
    print(f"{category}: {count}")

print("\nDataset preparation completed successfully!")

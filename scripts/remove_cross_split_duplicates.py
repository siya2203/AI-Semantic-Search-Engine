
import csv
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = PROJECT_ROOT / "data" / "dataset" / "20_newsgroups"
TEST_DIR = DATA_DIR / "documents" / "test"
METADATA_FILE = DATA_DIR / "metadata.csv"

# Read metadata
with open(METADATA_FILE, "r", newline="", encoding="utf-8") as file:
    reader = csv.DictReader(file)
    fieldnames = reader.fieldnames
    records = list(reader)

# Collect hashes from training documents
train_hashes = {
    row["text_hash"]
    for row in records
    if row["split"] == "train"
}

# Identify test documents duplicated in training
duplicate_test_records = [
    row for row in records
    if row["split"] == "test"
    and row["text_hash"] in train_hashes
]

duplicate_ids = {
    row["document_id"]
    for row in duplicate_test_records
}

print("Cross-split duplicates found:", len(duplicate_ids))

# Remove duplicate test files
removed_files = 0

for document_id in duplicate_ids:
    file_path = TEST_DIR / f"{document_id}.txt"

    if file_path.exists():
        file_path.unlink()
        removed_files += 1

# Update metadata
updated_records = [
    row for row in records
    if row["document_id"] not in duplicate_ids
]

with open(METADATA_FILE, "w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(updated_records)

print("Duplicate test files removed:", removed_files)
print("Updated metadata records:", len(updated_records))
print("Remaining training documents:", sum(
    row["split"] == "train" for row in updated_records
))
print("Remaining testing documents:", sum(
    row["split"] == "test" for row in updated_records
))
print("Cross-split cleanup completed!")


import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

target_ids = {
    "train_07545",
    "train_06707",
    "train_01450",
    "train_03707",
    "train_09154"
}

metadata_path = ROOT / "data/dataset/20_newsgroups/metadata.csv"

with open(metadata_path, "r", encoding="utf-8", newline="") as file:
    reader = csv.DictReader(file)

    for row in reader:
        document_id = row["document_id"]
        file_name = row["file_name"]

        if document_id in target_ids or Path(file_name).stem in target_ids:
            document_path = (
                ROOT / "data/dataset/20_newsgroups/documents"
                / row["split"] / file_name
            )

            print("\n" + "=" * 60)
            print("DOCUMENT:", document_id)
            print("CATEGORY:", row["category"])
            print("WORD COUNT:", row["word_count"])

            text = document_path.read_text(
                encoding="utf-8",
                errors="ignore"
            )

            print("\nCONTENT PREVIEW:")
            print(text[:600])
            print("=" * 60)

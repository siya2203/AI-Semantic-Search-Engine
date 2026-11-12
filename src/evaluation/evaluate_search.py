
import csv
import random
from collections import defaultdict
from pathlib import Path

from backend.main import PROJECT_ROOT, load_training_documents
from src.ranking.hybrid_search import HybridSearch


TOP_K = 5
QUERIES_PER_CATEGORY = 2
RANDOM_SEED = 42

DATASET_PATH = (
    PROJECT_ROOT / "data" / "dataset" / "20_newsgroups"
)


def load_test_queries():
    """Select test documents as queries, balanced by category."""

    metadata_path = DATASET_PATH / "metadata.csv"
    test_documents_path = DATASET_PATH / "documents" / "test"

    categories = defaultdict(list)

    with open(metadata_path, "r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            if row["split"] == "test":
                categories[row["category"]].append(row)

    rng = random.Random(RANDOM_SEED)
    queries = []

    for category, rows in sorted(categories.items()):
        selected = rng.sample(
            rows,
            min(QUERIES_PER_CATEGORY, len(rows))
        )

        for row in selected:
            path = test_documents_path / row["file_name"]
            text = path.read_text(
                encoding="utf-8",
                errors="ignore"
            )

            if text.strip():
                queries.append({
                    "text": text,
                    "category": category
                })

    return queries


def calculate_metrics(results, relevant_documents):
    """Calculate Precision@K, Recall@K and Reciprocal Rank."""

    retrieved = [
        result["document"] for result in results[:TOP_K]
    ]

    relevant_count = sum(
        1 for document in retrieved
        if document in relevant_documents
    )

    precision = relevant_count / TOP_K

    recall = (
        relevant_count / len(relevant_documents)
        if relevant_documents else 0
    )

    reciprocal_rank = 0

    for rank, document in enumerate(retrieved, start=1):
        if document in relevant_documents:
            reciprocal_rank = 1 / rank
            break

    return precision, recall, reciprocal_rank


def main():
    print("Loading training documents...")

    documents, document_categories = load_training_documents()

    print(f"Training documents: {len(documents)}")

    print("\nBuilding search engine...")

    engine = HybridSearch(alpha=0.5)
    engine.fit(documents)

    queries = load_test_queries()

    print(f"\nEvaluation queries: {len(queries)}")
    print("Starting evaluation...\n")

    methods = {
        "TF-IDF": [],
        "Semantic": [],
        "Hybrid": []
    }

    relevant_by_category = defaultdict(set)

    for document_id, category in document_categories.items():
        relevant_by_category[category].add(document_id)

    for index, query in enumerate(queries, start=1):
        category = query["category"]
        relevant_documents = relevant_by_category[category]

        tfidf_results = engine.tfidf_ranker.search(
            query["text"], TOP_K
        )

        semantic_results = engine.semantic_search.search(
            query["text"], TOP_K
        )

        hybrid_results = engine.search(
            query["text"], TOP_K
        )

        methods["TF-IDF"].append(
            calculate_metrics(tfidf_results, relevant_documents)
        )

        methods["Semantic"].append(
            calculate_metrics(semantic_results, relevant_documents)
        )

        methods["Hybrid"].append(
            calculate_metrics(hybrid_results, relevant_documents)
        )

        print(
            f"Evaluated query {index}/{len(queries)}: {category}"
        )

    print("\n" + "=" * 65)
    print("             SEARCH ENGINE EVALUATION")
    print("=" * 65)

    print(
        f"{'Method':<15}"
        f"{'Precision@5':<17}"
        f"{'Recall@5':<17}"
        f"{'MRR':<12}"
    )

    print("-" * 65)

    for method, scores in methods.items():
        if not scores:
            continue

        averages = [
            sum(metric) / len(scores)
            for metric in zip(*scores)
        ]

        print(
            f"{method:<15}"
            f"{averages[0]:<17.4f}"
            f"{averages[1]:<17.4f}"
            f"{averages[2]:<12.4f}"
        )

    print("=" * 65)
    print("\nEvaluation completed!")


if __name__ == "__main__":
    main()

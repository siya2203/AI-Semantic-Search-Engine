from src.indexing.inverted_index import load_documents
from src.ranking.tfidf import TFIDFRanker
from src.ranking.top_k import get_top_k

documents = load_documents("data/sample")

ranker = TFIDFRanker()

ranker.fit(documents)

query = input("Enter your query: ")

results = ranker.search(
        query,
        top_k = len(documents)
    )

top_results = get_top_k(
    results,
    k=2
)

print("\nTop Results:")

for score, document in top_results:
    print(
        document, 
        "->",
        round(score, 4)
    )

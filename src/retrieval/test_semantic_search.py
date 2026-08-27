from src.indexing.inverted_index import load_documents
from src.retrieval.semantic_search import SemanticSearch

documents = load_documents("data/sample")

search_engine = SemanticSearch()

print("Creating document embeddings...")

search_engine.fit(documents)

query = input("\nSemantic Search Results:")

for result in results:

    print(
        result["document"],
        "->",
        round(result["score"], 4)
    )
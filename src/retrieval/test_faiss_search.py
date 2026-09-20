from src.indexing.inverted_index import load_documents
from src.retrieval.faiss_search import FAISSSearch

documents = load_documents("data/sample")

search_engine = FAISSSearch()

print("Creating FAISS index...")

search_engine.fit(documents)

query = input("\nEnter your search query: ")

results = search_engine.search(query)

print("\nFAISS Search Results:")

for result in results:
    print(
        result["document"],
        "->",
        round(result["score"], 4)
    )
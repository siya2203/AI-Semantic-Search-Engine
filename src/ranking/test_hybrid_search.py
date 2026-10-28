from src.indexing.inverted_index import load_documents
from src.ranking.hybrid_search import HybridSearch

# Load the existing sample documents
documents = load_documents("data/sample")

# Create and prepare the hybrid search engine 
search_engine = HybridSearch(alpha = 0.5)

print("Preparing hybrid search...")
search_engine.fit(documents)

print("\nHybrid Search is ready!")
print("enter 'exit' to quit.")

while True:
    # Accept a query from the user
    query = input("\nEnter your search query: ").strip()

    if query.lower() == "exit":
        print("closing Search Engine...")
        break

    if not query:
        print("Please enter a valid query.")
        continue

    # Search and display results
    results = search_engine.search(query)

    print("\nHybrid Search Results: ")

    if not results:
        print("No results found.")
        continue

    for result in results:
        print(
            f"{result['document']} -> "
            f"Hybrid: {result['score']:.4f}, "
            f"TF-IDF: {result['tfidf_score']:.4f}, "
            f"Semantic: {result['semantic_score']:.4f}"
        )
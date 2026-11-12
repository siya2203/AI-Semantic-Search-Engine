from src.indexing.inverted_index import load_documents
from src.retrieval.semantic_search import SemanticSearch

documents = load_documents("data/sample")

search_engine = SemanticSearch()

print("\nCreating document embeddings...")
search_engine.fit(documents)

print("\nSemantic Search Engine is ready!")
print("Enter 'exit' to stop searching.\n")

while True:
    query = input("Enter your search query: ").strip()

    if query.lower() == "exit":
        print("Exiting Semantic Search Engine...")
        break

    if not query:
        print("Please enter a valid query.\n")
        continue

    results = search_engine.search(query, top_k=5)

    print("\nSemantic Search Results:")

    if not results:
        print("No results found.")
    else:
        for result in results:
            print(
                f"{result['document']} -> "
                f"{result['score']:.4f}"
            )

    print("\n" + "-" * 50 + "\n")
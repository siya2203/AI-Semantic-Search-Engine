from sklearn.datasets import fetch_20newsgroups

print("Downloading 20 Newsgroups dataset...")

dataset = fetch_20newsgroups(
    subset = "all",
    remove = ("headers", "footers", "quotes")
)

print("\n Dataset downloaded successfully!")

print("Total documents: ", len(dataset.data))
print("Total categories: ", len(dataset.target_names))

print("\ncategories:")
for category in dataset.target_names:
    print("-", category)

print("\nFirst document preview:")
print(dataset.data[0][:1000])


from collections import Counter

# 1. Documents in each category
category_counts = Counter(dataset.target)

print("\nDOCUMENTS PER CATEGORY")
for category_id, count in sorted(category_counts.items()):
    print(f"{dataset.target_names[category_id]}: {count}")

# 2. Document length analysis
document_lengths = [
    len(document.split()) for document in dataset.data
]

print("\nDOCUMENT LENGTH STATISTICS")
print("Average words:", sum(document_lengths) / len(document_lengths))
print("Minimum words:", min(document_lengths))
print("Maximum words:", max(document_lengths))

# 3. Empty documents
empty_documents = sum(
    1 for document in dataset.data if not document.strip()
)

print("\nEMPTY DOCUMENTS:", empty_documents)

# 4. Duplicate documents
normalized_documents = [
    " ".join(document.lower().split())
    for document in dataset.data
]

unique_documents = len(set(normalized_documents))

print("UNIQUE DOCUMENTS:", unique_documents)
print("DUPLICATE DOCUMENTS:", len(dataset.data) - unique_documents)

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity 

class TFIDFRanker:

    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.document_vectors = None
        self.documents = {}

    def fit(self, documents):
        self.documents = documents
        texts = list(documents.values())
        self.document_vectors = self.vectorizer.fit_transform(texts)

    def search(self, query, top_k = 5):
        query_vector = self.vectorizer.transform([query])

        scores = cosine_similarity(
            query_vector,
            self.document_vectors
        )[0]

        ranked_indices = scores.argsort()[::-1]

        results = []

        document_ids = list(self.documents.keys())

        for index in ranked_indices[:top_k]:
            if scores[index] > 0:
                results.append({
                    "document": document_ids[index],
                    "score": float(scores[index])
                })

        return results
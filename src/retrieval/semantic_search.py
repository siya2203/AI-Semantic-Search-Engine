import numpy as np

from src.embeddings.embedding_model import EmbeddingModel

class SemanticSearch:

    def __init__(self):
        self.embedding_model = EmbeddingModel()
        self.documents = {}
        self.document_embeddings = None

    def fit(self, documents):

        self.documents = documents

        self.document_embeddings = (
            self.embedding_model.encode_documents(documents)
        )

    def search(self, query, top_k = 5):
        query_embedding = self.embedding_model.encode(query)

        query_embedding = query_embedding / np.linalg.norm(
            query_embedding
        )

        document_embeddings = (
            self.document_embeddings / 
            np.linalg.norm (
                self.document_embeddings,
                axis = 1,
                keepdims = True
            )
        )

        scores = np.dot(
            document_embeddings, 
            query_embedding
        )

        ranked_indices = np.argsort(scores)[::-1]

        document_ids = list(self.documents.keys())

        results = []

        for index in ranked_indices[:top_k]:

            results.append({
                "document": document_ids[index],
                "score": float(scores[index])
            })

        return results
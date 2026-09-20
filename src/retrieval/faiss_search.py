import faiss
import numpy as np

from src.embeddings.embedding_model import EmbeddingModel

class FAISSSearch:

    def __init__(self):
        self.embedding_model = EmbeddingModel()
        self.documents = {}
        self.index = None

    def fit(self, documents):
        self.documents = documents
        embeddings = self.embedding_model.encode_documents(documents)

        # Convert embeddings into float32
        embeddings = np.asarray(
            embeddings, 
            dtype = "float32"
        )

        # Normalize embeddings
        faiss.normalize_L2(embeddings)

        # Create FAISS index
        dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatIP(dimension)

        #Add document vectors
        self.index.add(embeddings)


    def search(self, query, top_k=5):
        query_embedding = self.embedding_model.encode(query)
        query_embedding = np.asarray(
            [query_embedding],
            dtype = "float32"
        )

        # Normalize query vector
        faiss.normalize_L2(query_embedding)

        scores, indices = self.index.search(
            query_embedding,
            top_k
        )

        document_ids = list(self.documents.keys())

        results = []

        for score, index in zip(scores[0], indices[0]):

            if index == -1:
                continue

            results.append({
                "document": document_ids[index],
                "score": float(score)
            })

        return results
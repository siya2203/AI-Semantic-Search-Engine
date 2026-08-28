from sentence_transformers import SentenceTransformer


class EmbeddingModel:
    """Converts text into semantic embedding vectors."""

    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def encode(self, text):
        """Generate an embedding for a single text."""
        return self.model.encode(text)

    def encode_documents(self, documents):
        """Generate embeddings for all documents."""
        texts = list(documents.values())

        embeddings = self.model.encode(
            texts,
            show_progress_bar=True
        )

        return embeddings
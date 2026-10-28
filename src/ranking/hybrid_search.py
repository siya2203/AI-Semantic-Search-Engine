import numpy as np

from src.ranking.tfidf import TFIDFRanker
from src.retrieval.semantic_search import SemanticSearch

class HybridSearch:

    def __init__(self, alpha = 0.5):
        self.alpha = alpha

        self.tfidf_ranker = TFIDFRanker()
        self.semantic_search = SemanticSearch()

        self.documents = {}

    def fit(self, documents):
        self.documents = documents

        # Preparing both the search systems using the same documents
        self.tfidf_ranker.fit(documents)
        self.semantic_search.fit(documents)

    def _normalize_scores(self, scores):
        values = np.array(list(scores.values()), dtype = float)

        if len(values) == 0:
            return {}

        min_score = values.min()
        max_score = values.max()

        if max_score == min_score:
            return {
                doc:(score / max_score if max_score > 0 else 0.0)
                for doc, score in scores.items()
            }

        return {
            doc: (
                (score - min_score) / (max_score - min_score)
                if score > 0
                else 0.0
            )
            for doc, score in scores.items()
        }

    def search(self, query, top_k = 5):
        if not self.documents or not query.strip():
            return[]

        # Getting keyword based results
        tfidf_results = self.tfidf_ranker.search(
            query, top_k = len(self.documents)
        )

        # Getting meaning-based results for all documents
        semantic_results = self.semantic_search.search(
            query, top_k = len(self.documents)
        )

        # Include zero scores for documents not matched by TF_IDF
        tfidf_scores = {doc: 0.0 for doc in self.documents}

        for result in tfidf_results:
            tfidf_scores[result["document"]] = result["score"]

        semantic_scores = {
            result["document"] : result["score"]
            for result in semantic_results
        }

        # Normalize scores before combining them
        tfidf_scores = self._normalize_scores(tfidf_scores)
        semantic_scores = self._normalize_scores(semantic_scores)

        # Combine keywords and semantic relevance
        results = []

        for doc in self.documents:
            keyword_score = tfidf_scores.get(doc, 0.0)
            meaning_score = semantic_scores.get(doc, 0.0)

            hybrid_score = (
                (1 - self.alpha) * keyword_score
                + self.alpha * meaning_score
            )

            results.append({
                "document": doc,
                "score": float(hybrid_score),
                "tfidf_score": float(keyword_score),
                "semantic_score": float(meaning_score)
            })

        results.sort(
            key = lambda result: result["score"],
            reverse = True
        )

        return results[:top_k]
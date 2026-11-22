
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were",
  "to", "of", "in", "on", "for", "and", "or",
  "but", "with", "by", "as", "at", "from",
  "this", "that", "it", "be", "been", "being",
  "have", "has", "had", "do", "does", "did",
  "i", "you", "he", "she", "we", "they",
  "my", "your", "our", "their", "me", "him",
  "her", "them", "what", "which", "who",
  "when", "where", "why", "how"
]);

// Convert text into normalized tokens.
export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOPWORDS.has(word));
}

// Calculate term frequencies for a document.
function getTermFrequency(tokens) {
  const frequencies = new Map();

  for (const token of tokens) {
    frequencies.set(
      token,
      (frequencies.get(token) || 0) + 1
    );
  }

  const total = tokens.length || 1;

  for (const [word, count] of frequencies) {
    frequencies.set(word, count / total);
  }

  return frequencies;
}

// Calculate inverse document frequency.
function getIDF(documents) {
  const documentFrequency = new Map();

  for (const document of documents) {
    const uniqueWords = new Set(tokenize(document.text));

    for (const word of uniqueWords) {
      documentFrequency.set(
        word,
        (documentFrequency.get(word) || 0) + 1
      );
    }
  }

  const totalDocuments = documents.length;
  const idf = new Map();

  for (const [word, count] of documentFrequency) {
    idf.set(
      word,
      Math.log((totalDocuments + 1) / (count + 1)) + 1
    );
  }

  return idf;
}

// Calculate cosine similarity between two sparse vectors.
function cosineSimilarity(vectorA, vectorB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [word, value] of vectorA) {
    normA += value * value;

    if (vectorB.has(word)) {
      dotProduct += value * vectorB.get(word);
    }
  }

  for (const value of vectorB.values()) {
    normB += value * value;
  }

  if (!normA || !normB) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Prepare document vectors once.
export function createTFIDFIndex(rawDocuments) {
  const documents = rawDocuments.map(document => ({
    ...document,
    text: document.text || ""
  }));

  const idf = getIDF(documents);

  const indexedDocuments = documents.map(document => {
    const tokens = tokenize(document.text);
    const frequencies = getTermFrequency(tokens);
    const vector = new Map();

    for (const [word, frequency] of frequencies) {
      vector.set(word, frequency * (idf.get(word) || 0));
    }

    return { ...document, vector };
  });

  return { indexedDocuments, idf };
}

// Search the prepared index.
export function searchTFIDF(index, query, topK = 5) {
  const queryTokens = tokenize(query);

  if (!queryTokens.length) return [];

  const queryFrequencies = getTermFrequency(queryTokens);
  const queryVector = new Map();

  for (const [word, frequency] of queryFrequencies) {
    if (index.idf.has(word)) {
      queryVector.set(
        word,
        frequency * index.idf.get(word)
      );
    }
  }

  return index.indexedDocuments
    .map(document => {
      const score = cosineSimilarity(
        queryVector,
        document.vector
      );

      return {
        id: document.id,
        document: document.document,
        category: document.category,
        preview: document.text.slice(0, 250),
        tfidf_score: score,
        semantic_score: 0,
        score
      };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

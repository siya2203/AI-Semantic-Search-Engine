
import { useState, useEffect } from "react";
import "./App.css";

import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  searchDocuments,
} from "./services/api";

const evaluationResults = [
  { method: "TF-IDF", precision: 0.2550, recall: 0.0128, mrr: 0.4333 },
  { method: "Semantic Search", precision: 0.4950, recall: 0.0248, mrr: 0.6933 },
  { method: "Hybrid Search", precision: 0.5300, recall: 0.0265, mrr: 0.6842 },
];

const preprocessingSteps = [
  {
    number: "01",
    title: "Lowercasing",
    description:
      "Converts all text into lowercase to maintain consistent word representation.",
    example: "Machine Learning → machine learning",
  },
  {
    number: "02",
    title: "Tokenization",
    description:
      "Uses regular expressions to split text into individual alphabetic tokens.",
    example: '["machine", "learning", "is", "useful"]',
  },
  {
    number: "03",
    title: "Stopword Removal",
    description:
      "Removes common words using a predefined stopword set.",
    example: '["machine", "learning", "useful"]',
  },
];

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Document management states
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [managementError, setManagementError] = useState("");
  const [managementMessage, setManagementMessage] = useState("");

  // Load uploaded documents
  async function loadDocuments() {
    try {
      setRefreshing(true);
      setManagementError("");

      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err) {
      setManagementError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  // Upload document
  async function handleUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    setUploading(true);
    setManagementError("");
    setManagementMessage("");

    try {
      await uploadDocument(file);

      setManagementMessage(
        `${file.name} uploaded successfully.`
      );

      await loadDocuments();

      // Clear previous search results because the collection changed
      setResults([]);
      setSearched(false);
    } catch (err) {
      setManagementError(err.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  // Delete document
  async function handleDelete(documentId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmed) return;

    setDeletingId(documentId);
    setManagementError("");
    setManagementMessage("");

    try {
      await deleteDocument(documentId);

      setManagementMessage("Document deleted successfully.");

      await loadDocuments();

      setResults([]);
      setSearched(false);
    } catch (err) {
      setManagementError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  // Search documents
  async function handleSearch(event) {
    event.preventDefault();

    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);
    setResults([]);

    try {
      const data = await searchDocuments(query.trim(), 5);
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);

      setError(
        err.message || "Could not search the document collection."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      {/* Header */}
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon">S</span>
          <span>Semantic Search</span>
        </a>

        <span className="status">
          <span className="status-dot" />
          AI Search Engine
        </span>
      </header>

      {/* Hero and Search */}
      <section className="hero">
        <p className="eyebrow">
          INTELLIGENT DOCUMENT DISCOVERY
        </p>

        <h1>
          Find the meaning.
          <br />
          <span>Not just the keywords.</span>
        </h1>

        <p className="subtitle">
          Search your documents using keyword matching and
          intelligent document retrieval, powered by your
          document search engine.
        </p>

        <form className="search-form" onSubmit={handleSearch}>
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>

          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try 'artificial intelligence' or 'machine learning'"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <p className="upload-message">
          Search your document collection using the AI search engine.
        </p>
      </section>

      {/* Document Management Dashboard */}
      <section
        className="document-dashboard"
        style={{
          maxWidth: "1100px",
          margin: "40px auto",
          padding: "24px",
          borderRadius: "14px",
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e5e7eb)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <div>
            <p className="eyebrow">DOCUMENT MANAGEMENT</p>
            <h2>Manage Your Documents</h2>
            <p>
              Upload, view and delete documents from your collection.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDocuments}
            disabled={refreshing}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {/* Upload Area */}
        <div
          style={{
            padding: "22px",
            border: "2px dashed #a1a1aa",
            borderRadius: "12px",
            textAlign: "center",
            marginBottom: "22px",
          }}
        >
          <h3>Upload Documents</h3>

          <p>
            Select a TXT or PDF file. Maximum file size: 10 MB.
          </p>

          <label
            style={{
              display: "inline-block",
              padding: "12px 22px",
              marginTop: "10px",
              background: "#2563eb",
              color: "#ffffff",
              borderRadius: "8px",
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? "Uploading..." : "Choose Document"}

            <input
              type="file"
              accept=".txt,.pdf"
              onChange={handleUpload}
              disabled={uploading}
              hidden
            />
          </label>
        </div>

        {/* Status messages */}
        {managementMessage && (
          <p
            role="status"
            style={{ color: "green", marginBottom: "15px" }}
          >
            {managementMessage}
          </p>
        )}

        {managementError && (
          <p
            role="alert"
            style={{ color: "red", marginBottom: "15px" }}
          >
            {managementError}
          </p>
        )}

        {/* Document List */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h3>Uploaded Documents</h3>

            <span>
              {documents.length} document
              {documents.length !== 1 ? "s" : ""}
            </span>
          </div>

          {documents.length === 0 ? (
            <div
              style={{
                padding: "25px",
                textAlign: "center",
                background: "#f8fafc",
                borderRadius: "10px",
              }}
            >
              <p>No uploaded documents found.</p>
              <p>Upload a TXT or PDF file to get started.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {documents.map((document) => (
                <div
                  key={document.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    padding: "15px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <strong>{document.name}</strong>

                    <p
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        marginTop: "5px",
                      }}
                    >
                      {document.file_type} ·{" "}
                      {(document.size / 1024).toFixed(2)} KB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(document.id)}
                    disabled={deletingId === document.id}
                    style={{
                      padding: "9px 15px",
                      borderRadius: "7px",
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      opacity:
                        deletingId === document.id ? 0.6 : 1,
                    }}
                  >
                    {deletingId === document.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Search Results */}
      <section className="results-section">
        <div className="results-heading">
          <div>
            <p className="eyebrow">YOUR DOCUMENTS</p>
            <h2>
              {loading ? "Searching documents..." : "Search results"}
            </h2>
          </div>

          {searched && !loading && !error && (
            <span className="result-count">
              {results.length} result
              {results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {error && (
          <p className="error-message">{error}</p>
        )}

        {!searched && (
          <div className="empty-state">
            <div className="empty-symbol">⌕</div>
            <h3>Your next discovery starts here</h3>
            <p>
              Enter a question or topic above to find relevant documents.
            </p>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <h3>Searching your collection...</h3>
            <p>Finding the most relevant documents.</p>
          </div>
        )}

        {searched && !loading && !error && results.length === 0 && (
          <div className="empty-state">
            <h3>No results found</h3>
            <p>Try a different query to explore your documents.</p>
          </div>
        )}

        <div className="results-list">
          {results.map((result, index) => (
            <article
              className="result-card"
              key={result.id || result.document || index}
            >
              <div className="result-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="result-content">
                <h3>{result.document}</h3>

                <span className="category-tag">
                  {result.category || "Uncategorized"}
                </span>

                <p className="result-preview">
                  {result.preview || "No preview available."}
                </p>

                <div className="score-details">
                  <span>
                    TF-IDF{" "}
                    {(Number(result.tfidf_score || 0) * 100).toFixed(1)}%
                  </span>

                  <span>
                    Semantic{" "}
                    {(Number(result.semantic_score || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="score">
                <strong>
                  {(Number(result.score || 0) * 100).toFixed(1)}%
                </strong>
                <span>Relevance</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* NLP Pipeline */}
      <section className="nlp-section">
        <div className="nlp-heading">
          <p className="eyebrow">HOW THE ENGINE WORKS</p>
          <h2>Natural Language Processing Pipeline</h2>

          <p>
            From raw text to intelligent document retrieval,
            understand the NLP techniques used in this search engine.
          </p>
        </div>

        {/* Preprocessing */}
        <div className="pipeline-block">
          <div className="pipeline-title">
            <span className="pipeline-number">01</span>

            <div>
              <h3>Text Preprocessing</h3>
              <p>
                Implemented in src/preprocessing/text_processor.py
              </p>
            </div>
          </div>

          <div className="preprocessing-grid">
            {preprocessingSteps.map((step) => (
              <article
                className="preprocessing-card"
                key={step.number}
              >
                <span className="step-number">{step.number}</span>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
                <div className="step-example">{step.example}</div>
              </article>
            ))}
          </div>

          <div className="preprocessing-note">
            These operations are used by the inverted index.
            TF-IDF and the Sentence Transformer use their own
            text tokenization paths.
          </div>
        </div>

        {/* Retrieval branches */}
        <div className="pipeline-branches">
          <article className="pipeline-branch">
            <span className="branch-label">
              02A · LEXICAL RETRIEVAL
            </span>
            <h3>TF-IDF Vectorization</h3>

            <p>
              Converts documents and queries into numerical vectors
              based on term frequency and inverse document frequency.
            </p>

            <div className="technique-tag">
              Cosine Similarity
            </div>

            <div className="branch-result">
              Identifies documents with important matching terms.
            </div>
          </article>

          <article className="pipeline-branch">
            <span className="branch-label">
              02B · SEMANTIC RETRIEVAL
            </span>
            <h3>Sentence Transformers</h3>

            <p>
              Uses all-MiniLM-L6-v2 to generate dense vector
              representations that capture semantic meaning.
            </p>

            <div className="technique-tag">
              Embedding Similarity
            </div>

            <div className="branch-result">
              Finds documents with related meanings, even when
              their wording differs.
            </div>
          </article>
        </div>

        {/* Hybrid ranking */}
        <div className="hybrid-block">
          <span className="branch-label">
            03 · COMBINED RANKING
          </span>
          <h3>Hybrid Search</h3>

          <p>
            Combines lexical relevance and semantic similarity
            to produce the final document ranking.
          </p>

          <div className="formula">
            Score = 0.5 × TF-IDF + 0.5 × Semantic
          </div>

          <p className="formula-note">
            Both retrieval methods receive equal weight
            (alpha = 0.5).
          </p>
        </div>

        <div className="pipeline-output">
          <span className="pipeline-number">04</span>

          <div>
            <h3>Ranked Document Results</h3>
            <p>
              Documents are sorted by their relevance scores
              and the top 5 results are displayed with
              content previews.
            </p>
          </div>
        </div>
      </section>

      {/* NLP Evaluation Dashboard */}
      <section className="evaluation-section">
        <div className="evaluation-heading">
          <p className="eyebrow">PERFORMANCE ANALYSIS</p>
          <h2>Search Algorithm Evaluation</h2>

          <p>
            Comparing keyword-based, semantic and hybrid retrieval
            using 40 held-out test queries.
          </p>
        </div>

        <div className="evaluation-cards">
          {evaluationResults.map((item) => (
            <article
              className="evaluation-card"
              key={item.method}
            >
              <h3>{item.method}</h3>

              <div className="metric">
                <span>Precision@5</span>
                <strong>
                  {(item.precision * 100).toFixed(2)}%
                </strong>

                <div className="metric-bar">
                  <div
                    style={{
                      width: `${item.precision * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="metric">
                <span>Recall@5</span>
                <strong>
                  {(item.recall * 100).toFixed(2)}%
                </strong>

                <div className="metric-bar">
                  <div
                    style={{
                      width: `${item.recall * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="metric">
                <span>Mean Reciprocal Rank (MRR)</span>
                <strong>{item.mrr.toFixed(4)}</strong>

                <div className="metric-bar">
                  <div
                    style={{
                      width: `${item.mrr * 100}%`,
                    }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="evaluation-note">
          Evaluation uses category-based relevance judgments on
          40 held-out queries from the 20 Newsgroups dataset.
          These are topic-level relevance measurements, not
          human-judged semantic relevance.
        </p>
      </section>

      {/* Footer */}
      <footer>
        <span>AI Semantic Search Engine</span>
        <span>TF-IDF + Sentence Transformers</span>
      </footer>
    </main>
  );
}

export default App;

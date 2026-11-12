
import { useState } from "react";
import "./App.css";

const evaluationResults = [
  {
    method: "TF-IDF",
    precision: 0.2550,
    recall: 0.0128,
    mrr: 0.4333,
  },
  {
    method: "Semantic Search",
    precision: 0.4950,
    recall: 0.0248,
    mrr: 0.6933,
  },
  {
    method: "Hybrid Search",
    precision: 0.5300,
    recall: 0.0265,
    mrr: 0.6842,
  },
];

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

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
      const response = await fetch("http://127.0.0.1:8000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          top_k: 5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Search failed.");
      }

      setResults(data.results || []);
    } catch (err) {
      setError(
        err.message || "Could not connect to the search API."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setUploadMessage("Please select a file first.");
      return;
    }

    setUploading(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed.");
      }

      setUploadMessage(`Successfully uploaded: ${selectedFile.name}`);
      setSelectedFile(null);
      event.target.reset();
    } catch (err) {
      setUploadMessage(err.message || "Could not upload the file.");
    } finally {
      setUploading(false);
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
        <p className="eyebrow">INTELLIGENT DOCUMENT DISCOVERY</p>

        <h1>
          Find the meaning.
          <br />
          <span>Not just the keywords.</span>
        </h1>

        <p className="subtitle">
          Search your documents using keyword matching and semantic
          understanding, powered by your hybrid search engine.
        </p>

        <form className="search-form" onSubmit={handleSearch}>
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>

          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “artificial intelligence”"
            aria-label="Search documents"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <p className="hint">
          Try:
          <button
            type="button"
            onClick={() => setQuery("machine learning")}
          >
            machine learning
          </button>

          <span>·</span>

          <button
            type="button"
            onClick={() => setQuery("natural language processing")}
          >
            natural language processing
          </button>
        </p>
      </section>

      {/* Document Upload */}
      <section className="upload-section">
        <div className="upload-heading">
          <div>
            <p className="eyebrow">EXPAND YOUR SEARCH</p>
            <h2>Upload your documents</h2>
            <p>Bring your own knowledge into the search engine.</p>
          </div>
        </div>

        <form className="upload-form" onSubmit={handleUpload}>
          <input
            type="file"
            accept=".txt,.pdf"
            onChange={(event) => {
              setSelectedFile(event.target.files[0] || null);
              setUploadMessage("");
            }}
          />

          <button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload document"}
          </button>
        </form>

        {selectedFile && (
          <p className="upload-info">
            Selected: {selectedFile.name}
          </p>
        )}

        {uploadMessage && (
          <p className="upload-message">
            {uploadMessage}
          </p>
        )}
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
              {results.length} result{results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        {!searched && (
          <div className="empty-state">
            <div className="empty-symbol">⌕</div>
            <h3>Your next discovery starts here</h3>
            <p>
              Enter a question or topic above to find relevant documents.
            </p>
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
            <article className="result-card" key={result.document}>
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
            <article className="evaluation-card" key={item.method}>
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

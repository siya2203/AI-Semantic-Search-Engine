
import { useState } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

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
        "Could not connect to the search API. Make sure your FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
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
          <span className="search-icon" aria-hidden="true">⌕</span>
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
          Try: <button onClick={() => setQuery("machine learning")}>machine learning</button>
          <span>·</span>
          <button onClick={() => setQuery("natural language processing")}>natural language processing</button>
        </p>
      </section>

      <section className="results-section">
        <div className="results-heading">
          <div>
            <p className="eyebrow">YOUR DOCUMENTS</p>
            <h2>{loading ? "Searching documents..." : "Search results"}</h2>
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
            <p>Enter a question or topic above to find relevant documents.</p>
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
                <p>
                  Ranked using keyword relevance and semantic similarity.
                </p>
                <div className="score-details">
                  <span>TF-IDF {(result.tfidf_score * 100).toFixed(1)}%</span>
                  <span>Semantic {(result.semantic_score * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="score">
                <strong>{(result.score * 100).toFixed(1)}%</strong>
                <span>Relevance</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <span>AI Semantic Search Engine</span>
        <span>TF-IDF + Sentence Transformers</span>
      </footer>
    </main>
  );
}

export default App;


import { useState } from "react";
import "./App.css";

const evaluationResults = [
  { method: "TF-IDF", precision: 0.2550, recall: 0.0128, mrr: 0.4333 },
  { method: "Semantic Search", precision: 0.4950, recall: 0.0248, mrr: 0.6933 },
  { method: "Hybrid Search", precision: 0.5300, recall: 0.0265, mrr: 0.6842 },
];

const preprocessingSteps = [
  {
    number: "01",
    title: "Lowercasing",
    description: "Converts all text into lowercase to maintain consistent word representation.",
    example: "Machine Learning → machine learning",
  },
  {
    number: "02",
    title: "Tokenization",
    description: "Uses regular expressions to split text into individual alphabetic tokens.",
    example: '["machine", "learning", "is", "useful"]',
  },
  {
    number: "03",
    title: "Stopword Removal",
    description: "Removes common words using a predefined stopword set.",
    example: '["machine", "learning", "useful"]',
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
        headers: { "Content-Type": "application/json" },
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
      setError(err.message || "Could not connect to the search API.");
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
            placeholder="Try 'artificial intelligence' or 'machine learning'"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Upload */}
        <form className="upload-form" onSubmit={handleUpload}>
          <input
            type="file"
            accept=".txt,.pdf"
            onChange={(event) =>
              setSelectedFile(event.target.files[0] || null)
            }
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
          <p className="upload-message">{uploadMessage}</p>
        )}
      </section>

      {/* Search Results */}
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
            From raw text to intelligent document retrieval, understand
            the NLP techniques used in this search engine.
          </p>
        </div>

        {/* Preprocessing */}
        <div className="pipeline-block">
          <div className="pipeline-title">
            <span className="pipeline-number">01</span>
            <div>
              <h3>Text Preprocessing</h3>
              <p>Implemented in src/preprocessing/text_processor.py</p>
            </div>
          </div>

          <div className="preprocessing-grid">
            {preprocessingSteps.map((step) => (
              <article className="preprocessing-card" key={step.number}>
                <span className="step-number">{step.number}</span>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
                <div className="step-example">{step.example}</div>
              </article>
            ))}
          </div>

          <div className="preprocessing-note">
            These operations are used by the inverted index. TF-IDF
            and the Sentence Transformer use their own text
            tokenization paths.
          </div>
        </div>

        {/* Retrieval branches */}
        <div className="pipeline-branches">
          <article className="pipeline-branch">
            <span className="branch-label">02A · LEXICAL RETRIEVAL</span>
            <h3>TF-IDF Vectorization</h3>
            <p>
              Converts documents and queries into numerical vectors
              based on term frequency and inverse document frequency.
            </p>
            <div className="technique-tag">Cosine Similarity</div>
            <div className="branch-result">
              Identifies documents with important matching terms.
            </div>
          </article>

          <article className="pipeline-branch">
            <span className="branch-label">02B · SEMANTIC RETRIEVAL</span>
            <h3>Sentence Transformers</h3>
            <p>
              Uses all-MiniLM-L6-v2 to generate dense vector
              representations that capture semantic meaning.
            </p>
            <div className="technique-tag">Embedding Similarity</div>
            <div className="branch-result">
              Finds documents with related meanings, even when
              their wording differs.
            </div>
          </article>
        </div>

        {/* Hybrid ranking */}
        <div className="hybrid-block">
          <span className="branch-label">03 · COMBINED RANKING</span>
          <h3>Hybrid Search</h3>
          <p>
            Combines lexical relevance and semantic similarity
            to produce the final document ranking.
          </p>

          <div className="formula">
            Score = 0.5 × TF-IDF + 0.5 × Semantic
          </div>

          <p className="formula-note">
            Both retrieval methods receive equal weight (alpha = 0.5).
          </p>
        </div>

        <div className="pipeline-output">
          <span className="pipeline-number">04</span>
          <div>
            <h3>Ranked Document Results</h3>
            <p>
              Documents are sorted by their hybrid scores and the
              top 5 results are displayed with relevance scores
              and content previews.
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
            <article className="evaluation-card" key={item.method}>
              <h3>{item.method}</h3>

              <div className="metric">
                <span>Precision@5</span>
                <strong>{(item.precision * 100).toFixed(2)}%</strong>
                <div className="metric-bar">
                  <div style={{ width: `${item.precision * 100}%` }} />
                </div>
              </div>

              <div className="metric">
                <span>Recall@5</span>
                <strong>{(item.recall * 100).toFixed(2)}%</strong>
                <div className="metric-bar">
                  <div style={{ width: `${item.recall * 100}%` }} />
                </div>
              </div>

              <div className="metric">
                <span>Mean Reciprocal Rank (MRR)</span>
                <strong>{item.mrr.toFixed(4)}</strong>
                <div className="metric-bar">
                  <div style={{ width: `${item.mrr * 100}%` }} />
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

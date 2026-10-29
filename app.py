import streamlit as st

from src.indexing.inverted_index import load_documents
from src.ranking.hybrid_search import HybridSearch

st.set_page_config(
    page_title = "AI Semantic Search Engine",
    page_icon = "🔎",
    layout = "wide"
)

@st.cache_resource
def load_search_engine():
    documents = load_documents("data/sample")

    engine = HybridSearch(alpha=0.5)
    engine.fit(documents)

    return engine, len(documents)

st.title("🔎 AI Semantic Search Engine")
st.write(
    "Search your documents using keywords and semantic meaning."
)

with st.spinner("Loading search engine..."):
    search_engine, document_count = load_search_engine()

st.caption(f"Indexed documents: {document_count}")

query = st.text_input(
    "Enter your search query",
    placeholder = "e.g. artificial intelligence"
)

search_clicked = st.button(
    "Search",
    type = "primary"
)

if search_clicked:
    if not query.strip():
        st.warning("Please enter a search query.")
    else:
        with st.spinner("Searching documents..."):
            results = search_engine.search(query.strip())

        st.subheader("Search Results")

        if not results:
            st.info("No results found.")
        else:
            for rank, result in enumerate(results, start = 1):
                with st.container(border = True):
                    st.subheader(
                        f"{rank}. {result['document']}"
                    )

                    col1, col2, col3 = st.columns(3)

                    col1.metric(
                        "Hybrid Score",
                        f"{result['score']:.4f}"
                    )

                    col2.metric(
                        'Semantic Score',
                        f"{result['semantic_score']:.4f}"
                    )
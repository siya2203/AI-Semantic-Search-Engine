
import { createTFIDFIndex, searchTFIDF } from "./tfidf";

let searchIndex = null;
let loadingPromise = null;

export async function initializeSearch() {
  if (searchIndex) return searchIndex;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const response = await fetch(
      `${import.meta.env.BASE_URL}data/documents.json.gz`
    );

    if (!response.ok) {
      throw new Error("Could not load the document dataset.");
    }

    const decompressed = response.body.pipeThrough(
      new DecompressionStream("gzip")
    );

    const documents = await new Response(decompressed).json();

    searchIndex = createTFIDFIndex(documents);
    console.log(`TF-IDF index ready: ${documents.length} documents`);

    return searchIndex;
  })();

  try {
    return await loadingPromise;
  } catch (error) {
    loadingPromise = null;
    throw error;
  }
}

export async function browserSearch(query, topK = 5) {
  const index = await initializeSearch();
  return searchTFIDF(index, query, topK);
}

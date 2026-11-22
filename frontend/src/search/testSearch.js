
import { initializeSearch, browserSearch } from "./browserSearch";

async function test() {
  try {
    console.time("Index initialization");

    const index = await initializeSearch();

    console.timeEnd("Index initialization");

    console.log(
      "Indexed documents:",
      index.indexedDocuments.length
    );

    const queries = [
      "machine learning",
      "computer graphics",
      "space exploration"
    ];

    for (const query of queries) {
      console.log(`\nQuery: ${query}`);

      const results = await browserSearch(query, 5);

      console.table(
        results.map(result => ({
          document: result.document,
          category: result.category,
          score: result.score.toFixed(4)
        }))
      );
    }
  } catch (error) {
    console.error("Search test failed:", error);
  }
}

test();

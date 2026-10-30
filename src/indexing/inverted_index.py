from src.preprocessing.text_processor import TextProcessor
import re                 # Regular Expression module(Regex) -> we use it here to find words inside the text
from pathlib import Path  # Path makes it easier to work with files and folders -> We'll use it to find all .txt files inside our data folder
from pypdf import PdfReader
class InvertedIndex:      
    def __init__(self):
        self.index = {}
        self.processor = TextProcessor()

    # def tokenize(self, text):
    #     return re.findall(r"\b[a-zA-Z]+\b", text.lower())

    def add_document(self, doc_id, text):
        words = self.processor.process(text)

        for word in words:
            if word not in self.index:
                self.index[word] = set()

            self.index[word].add(doc_id)

    # def search(self, word):       # for single word search
    #     word = word.lower()
    #     return self.index.get(word, set())

    def search(self, query):
        words = self.processor.process(query)

        if not words:
            return set()

        results = self.index.get(words[0], set()).copy()

        for word in words[1:]:
            results &= self.index.get(word, set())

        return results
def load_documents(data_path):
    documents = {}

    supported_extensions = {".pdf", ".txt"}

    for file in Path(data_path).iterdir():

        if file.is_file() and file.suffix.lower() in supported_extensions:

            try:
                if file.suffix.lower() == ".txt":
                    text = file.read_text(encoding = "utf-8")

                elif file.suffix.lower() ==".pdf":
                    reader = PdfReader(str(file))

                    text = "\n".join(
                        page.extract_text() or ""
                        for page in reader.pages
                    ) 

                if text.strip():
                    documents[file.name] = text
                else:
                    print(f"Warning: No extractable text in {file.name}")

            except Exception as e:
                print(f"Could not read {file.name}: {e}")

    return documents

if __name__=="__main__":

    data_path = "data/sample"

    documents = load_documents(data_path)

    index = InvertedIndex()

    for doc_id, text in documents.items():
        index.add_document(doc_id, text)

    print("\nDocuments Loaded:")
    for doc in documents:
        print("-", doc)

    print("\n========== DOCUMENT SEARCH ENGINE ==========")
    print("Type 'exit' to stop searching.")

    while True:

    # query = input("\nEnter a word to search: ") # for single word
        query = input("\nEnter your search query: ").strip()

        if query.lower() == "exit":
            print("Search engine stopped.")
            break

        if not query:
            print("Please enter a valid search query.")
            continue

        results = index.search(query)

        if results:
            print("\nFound in:")
            for document in results:
                print("-", document)
        else:
            print("\nNo documents found.")

        
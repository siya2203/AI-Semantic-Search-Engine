import re                 # Regular Expression module(Regex) -> we use it here to find words inside the text
from pathlib import Path  # Path makes it easier to work with files and folders -> We'll use it to find all .txt files inside our data folder

class InvertedIndex:      
    def __init__(self):
        self.index = {}

    def tokenize(self, text):
        return re.findall(r"\b[a-zA-Z]+\b", text.lower())

    def add_document(self, doc_id, text):
        words = self.tokenize(text)

        for word in words:
            if word not in self.index:
                self.index[word] = set()

            self.index[word].add(doc_id)

    def search(self, word):
        word = word.lower()
        return self.index.get(word, set())

def load_documents(data_path):
    documents = {}

    for file in Path(data_path).glob("*.txt"):
        documents[file.name] = file.read_text(encoding="utf-8")

    return documents 

if __name__=="__main__":

    data_path = "data/sample"

    documents = load_documents(data_path)

    index = InvertedIndex()

    for doc_id, text in documents.items():
        index.add_document(doc_id, text)

    print("\nDocuments:")
    for doc in documents:
        print("-", doc)

    print("\nSearch Results:")

    query = input("\nEnter a word to search: ")

    results = index.search(query)

    if results:
        print("\nFound in:")
        for document in results:
            print("-", document)
    else:
        print("\nNo documents found.")

        
import re

class TextProcessor:
    def __init__(self):
        self.stopwords = {
             "a", "an", "the", "is", "are", "was", "were",
            "in", "on", "at", "to", "of", "for", "and",
            "or", "but", "this", "that", "with", "from",
            "by", "as", "it"
        }

    def tokenize(self, text):
        return re.findall(r"\b[a-zA-Z]+\b", text.lower())

    def remove_stopwords(self, words):
        return [
            word for word in words
            if word not in self.stopwords
        ]

    def process(self, text):
        words = self.tokenize(text)
        words = self.remove_stopwords(words)

        return words

if __name__ == "__main__":
    processor = TextProcessor()
    text = "Machine learning is a branch of artificial intelligence."
    print(processor.process(text))
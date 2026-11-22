
const API_BASE_URL = "http://127.0.0.1:8000";

export async function fetchDocuments() {
  const response = await fetch(`${API_BASE_URL}/documents`);

  if (!response.ok) {
    throw new Error("Failed to fetch documents.");
  }

  const data = await response.json();
  return data.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Document upload failed.");
  }

  return data;
}

export async function deleteDocument(documentId) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE" }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Document deletion failed.");
  }

  return data;
}

export async function searchDocuments(query, topK = 5) {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      top_k: topK,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Search failed.");
  }

  return data.results;
}

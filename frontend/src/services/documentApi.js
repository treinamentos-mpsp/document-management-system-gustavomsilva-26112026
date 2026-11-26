const API_BASE = '/api';

async function ensureOk(response) {
  if (response.ok) {
    return response;
  }

  const body = await response.json().catch(() => ({}));
  throw new Error(body.error || 'Falha na comunicação com o servidor.');
}

export async function uploadDocument(file, owner) {
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });

  return (await ensureOk(response)).json();
}

export async function listDocuments(owner) {
  const response = await fetch(`${API_BASE}/documents?owner=${encodeURIComponent(owner)}`);
  return (await ensureOk(response)).json();
}

export async function downloadDocument(id) {
  const response = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}/download`);
  return (await ensureOk(response)).blob();
}

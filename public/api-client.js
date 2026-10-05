import { state } from './state.js';

async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.password) {
    headers['x-app-password'] = state.password;
  }

  if (state.spaceId && state.memberId) {
    headers['x-space-id'] = state.spaceId;
    headers['x-member-id'] = state.memberId;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = data?.error || 'İstek başarısız oldu.';
    if (response.status === 401 || error === 'unauthorized') {
      throw new Error('unauthorized');
    }
    if (response.status === 429 || data?.error === 'rate_limited') {
      throw new Error('rate_limited');
    }
    throw new Error(error);
  }

  return data;
}

export async function fetchItems() {
  const result = await apiFetch('/api/items');
  return result.items || [];
}

export async function createItem(item) {
  return apiFetch('/api/items', { method: 'POST', body: JSON.stringify(item) });
}

export async function updateItem(id, item) {
  return apiFetch(`/api/items?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(item) });
}

export async function deleteItem(id) {
  return apiFetch(`/api/items?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// Netlify'da senkron fonksiyonlar 10 saniyede kesiliyor; analiz arka plan
// işinde çalışıp sonucu /api/photo-status üzerinden dönüyor.
export async function analyzePhoto(room, style, existingNames, images) {
  const jobId = crypto.randomUUID();
  await apiFetch('/api/photo-background', {
    method: 'POST',
    body: JSON.stringify({ jobId, room, style, existingItemNames: existingNames, images })
  });

  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const status = await apiFetch(`/api/photo-status?jobId=${encodeURIComponent(jobId)}`);
    if (status.status === 'done') return status.result;
  }

  throw new Error('Analiz çok uzun sürdü, tekrar dener misin?');
}

export async function requestImageLookup(id, name) {
  return apiFetch('/api/image', {
    method: 'POST',
    body: JSON.stringify({ id, name })
  });
}

export async function uploadUserImage(itemId, dataURL) {
  return apiFetch('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ itemId, dataURL })
  });
}

export async function createSpace(spaceName, memberName) {
  return apiFetch('/api/spaces', {
    method: 'POST',
    body: JSON.stringify({ action: 'create', spaceName, memberName })
  });
}

export async function joinSpace(code, memberName) {
  return apiFetch('/api/spaces', {
    method: 'POST',
    body: JSON.stringify({ action: 'join', code, memberName })
  });
}

export async function recoverSpace(code) {
  return apiFetch('/api/spaces', {
    method: 'POST',
    body: JSON.stringify({ action: 'recover', code })
  });
}

export async function rotateInvite() {
  return apiFetch('/api/spaces', {
    method: 'PATCH',
    body: JSON.stringify({ action: 'rotate-invite' })
  });
}

export async function fetchSpace() {
  return apiFetch('/api/spaces', { method: 'GET' });
}

export async function renameSpace(name) {
  return apiFetch('/api/spaces', {
    method: 'PATCH',
    body: JSON.stringify({ name })
  });
}

export async function removeSpaceMember(memberId, confirmName) {
  const query = confirmName
    ? `?memberId=${encodeURIComponent(memberId)}&confirmName=${encodeURIComponent(confirmName)}`
    : `?memberId=${encodeURIComponent(memberId)}`;
  return apiFetch(`/api/spaces${query}`, { method: 'DELETE' });
}

export async function importSheet(fileName, base64) {
  return apiFetch('/api/import', {
    method: 'POST',
    body: JSON.stringify({ fileName, file: base64 })
  });
}

export async function fetchComments() {
  return apiFetch('/api/comments');
}

export async function createComment(itemId, text) {
  return apiFetch('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ itemId, text })
  });
}

export async function deleteComment(id) {
  return apiFetch(`/api/comments?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

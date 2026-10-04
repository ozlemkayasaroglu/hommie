import { state } from './state.js';

async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.password) {
    headers['x-app-password'] = state.password;
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

export async function bulkEstimatePrice(ids) {
  return apiFetch('/api/ai', {
    method: 'POST',
    body: JSON.stringify({ task: 'price', ids })
  });
}

export async function analyzePhoto(room, existingNames, images) {
  return apiFetch('/api/ai', {
    method: 'POST',
    body: JSON.stringify({ task: 'photo', room, existingItemNames: existingNames, images })
  });
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

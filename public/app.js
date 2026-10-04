import {
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  analyzePhoto,
  requestImageLookup,
  uploadUserImage
} from './api-client.js';
import { state } from './state.js';
import {
  renderHero,
  renderRoomFilters,
  renderFilters,
  renderCards,
  renderPhotoPanel,
  renderPhotoSuggestions,
  showToast
} from './ui.js';
import { renderBilge } from './bilge.js';

const itemModal = document.getElementById('itemModal');
const passwordDialog = document.getElementById('passwordDialog');
const itemForm = document.getElementById('itemForm');
const passwordForm = document.getElementById('passwordForm');
const passwordInput = document.getElementById('passwordInput');
const photoInput = document.getElementById('photoInput');
const addSuggestedButton = document.getElementById('addSuggestedButton');

let editingItemId = null;

function renderAll() {
  renderHero();
  renderRoomFilters();
  renderFilters();
  renderCards();
  renderPhotoPanel();
  renderPhotoSuggestions();
}

function openItemModal(item = null) {
  editingItemId = item ? item.id : null;
  const title = document.getElementById('modalTitle');
  const formData = new FormData(itemForm);
  itemForm.reset();
  if (item) {
    title.textContent = 'Öğe düzenle';
    itemForm.elements.name.value = item.name || '';
    itemForm.elements.room.value = item.room || 'Genel';
    itemForm.elements.type.value = item.type || 'Alınacak';
    itemForm.elements.priority.value = String(item.priority || 1);
    itemForm.elements.status.value = item.status || 'Yapılmadı';
    itemForm.elements.note.value = item.note || '';
  } else {
    title.textContent = 'Yeni öğe';
    itemForm.elements.room.value = 'Genel';
    itemForm.elements.type.value = 'Alınacak';
    itemForm.elements.priority.value = '2';
    itemForm.elements.status.value = 'Yapılmadı';
  }
  itemModal.showModal();
  state.isModalOpen = true;
}

function closeItemModal() {
  itemModal.close();
  state.isModalOpen = false;
}

function openPasswordDialog() {
  passwordDialog.showModal();
  state.isModalOpen = true;
}

function closePasswordDialog() {
  passwordDialog.close();
  state.isModalOpen = false;
}

async function loadItems({ silent = false } = {}) {
  state.isLoading = true;
  try {
    const items = await fetchItems();
    state.items = items;
    if (!silent) {
      renderAll();
    }

    const pending = state.items.filter((item) => !item.image_url && !item.image_tried && item.type !== 'Resmi iş').slice(0, 3);
    for (const item of pending) {
      try {
        await requestImageLookup(item.id, item.name);
      } catch {
        // best effort
      }
    }

    const refreshed = await fetchItems();
    state.items = refreshed;
    renderAll();
  } catch (error) {
    if (error?.message === 'unauthorized') {
      openPasswordDialog();
      return;
    }
    showToast(error?.message || 'Liste yüklenemedi.');
  } finally {
    state.isLoading = false;
  }
}

async function createOrUpdateItem(event) {
  event.preventDefault();
  const formData = new FormData(itemForm);
  const payload = Object.fromEntries(formData.entries());
  payload.priority = Number(payload.priority);

  try {
    state.isMutating = true;
    if (editingItemId) {
      await updateItem(editingItemId, payload);
      showToast('Öğe güncellendi.');
    } else {
      await createItem(payload);
      showToast('Öğe eklendi.');
    }
    closeItemModal();
    itemForm.reset();
    await loadItems();
  } catch (error) {
    showToast(error?.message || 'İşlem başarısız.');
  } finally {
    state.isMutating = false;
  }
}

async function handleDelete(id) {
  if (!window.confirm('Bu öğeyi silmek istediğine emin misin?')) return;
  try {
    state.isMutating = true;
    await deleteItem(id);
    await loadItems();
    showToast('Öğe silindi.');
  } catch (error) {
    showToast(error?.message || 'Silme işlemi başarısız.');
  } finally {
    state.isMutating = false;
  }
}

async function handleStatusChange(id, value) {
  try {
    state.isMutating = true;
    await updateItem(id, { status: value });
    await loadItems();
  } catch (error) {
    showToast(error?.message || 'Durum güncellenemedi.');
  } finally {
    state.isMutating = false;
  }
}

async function handleNoteChange(id, value) {
  try {
    await updateItem(id, { note: value });
    const item = state.items.find((entry) => entry.id === id);
    if (item) item.note = value;
  } catch (error) {
    showToast(error?.message || 'Not kaydedilemedi.');
  }
}

function attachPhotoSelectionHandlers() {
  const checks = document.querySelectorAll('[data-photo-check]');
  checks.forEach((input) => {
    input.addEventListener('change', () => {
      const selected = [...document.querySelectorAll('[data-photo-check]:checked')].map((el) => Number(el.value));
      state.selectedPhotoSuggestions = new Set(selected);
      addSuggestedButton.hidden = selected.length === 0;
    });
  });
}

async function compressImage(file) {
  const imageBitmap = await createImageBitmap(file);
  const maxSize = 768;
  const scale = Math.min(1, maxSize / Math.max(imageBitmap.width, imageBitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(imageBitmap.width * scale));
  canvas.height = Math.max(1, Math.round(imageBitmap.height * scale));
  const context = canvas.getContext('2d');
  context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

async function handlePhotoAnalyze() {
  const files = Array.from(photoInput.files || []).slice(0, 3);
  if (!files.length) {
    showToast('En az bir fotoğraf seç.');
    return;
  }

  state.isPhotoAnalyzing = true;
  try {
    const converted = await Promise.all(files.map((file) => compressImage(file)));
    const result = await analyzePhoto(state.photoRoom || 'Salon', state.items.map((item) => item.name), converted);
    state.photoSuggestions = Array.isArray(result?.suggestions) ? result.suggestions : [];
    addSuggestedButton.hidden = state.photoSuggestions.length === 0;
    renderPhotoSuggestions();
    attachPhotoSelectionHandlers();
    showToast(`${state.photoSuggestions.length} öneri hazır.`);
  } catch (error) {
    if (error?.message === 'rate_limited') {
      showToast('Bir dakika sonra tekrar dene.');
      return;
    }
    showToast('Foto analizi başarısız oldu.');
  } finally {
    state.isPhotoAnalyzing = false;
  }
}

async function handleAddSuggested() {
  const indexes = [...document.querySelectorAll('[data-photo-check]:checked')].map((el) => Number(el.value));
  if (!indexes.length) {
    showToast('Önce önerilerden en az biri seç.');
    return;
  }

  const selected = indexes.map((idx) => state.photoSuggestions[idx]).filter(Boolean);
  if (!selected.length) return;

  try {
    state.isMutating = true;
    for (const suggestion of selected) {
      await createItem({
        name: suggestion.name,
        room: suggestion.room || state.photoRoom || 'Genel',
        type: suggestion.type || 'Alınacak',
        priority: Number(suggestion.priority || 3),
        status: 'Yapılmadı',
        note: suggestion.reason || ''
      });
    }
    await loadItems();
    showToast('Seçilen öneriler eklendi.');
    state.photoSuggestions = [];
    renderPhotoSuggestions();
    addSuggestedButton.hidden = true;
    photoInput.value = '';
  } catch (error) {
    showToast(error?.message || 'Öneri ekleme başarısız.');
  } finally {
    state.isMutating = false;
  }
}

async function handleUserImageUpload(itemId, file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const result = await uploadUserImage(itemId, reader.result);
      showToast('Fotoğraf yüklendi.');
      await loadItems();
    } catch (error) {
      showToast(error?.message || 'Fotoğraf yüklenemedi.');
    }
  };
  reader.readAsDataURL(file);
}

function setupEvents() {
  document.querySelectorAll('.close-button, [data-close-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialogId = button.getAttribute('data-close-modal');
      const dialog = dialogId ? document.getElementById(dialogId) : null;
      if (dialog) dialog.close();
      state.isModalOpen = false;
    });
  });

  document.getElementById('photoTabButton').addEventListener('click', () => {
    state.activeView = state.activeView === 'photo' ? 'list' : 'photo';
    renderPhotoPanel();
  });
  document.getElementById('addItemButton').addEventListener('click', () => openItemModal());
  document.getElementById('photoAnalyzeButton').addEventListener('click', handlePhotoAnalyze);
  document.getElementById('addSuggestedButton').addEventListener('click', handleAddSuggested);
  document.getElementById('photoRoom').addEventListener('change', (event) => {
    state.photoRoom = event.target.value;
  });

  document.getElementById('roomFilters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-room]');
    if (!button) return;
    state.activeRoom = button.dataset.room;
    renderAll();
  });

  document.getElementById('statusFilter').addEventListener('change', (event) => {
    state.statusFilter = event.target.value;
    renderAll();
  });

  document.getElementById('priorityFilter').addEventListener('change', (event) => {
    state.priorityFilter = event.target.value;
    renderAll();
  });

  document.getElementById('sortFilter').addEventListener('change', (event) => {
    state.sort = event.target.value;
    renderAll();
  });

  itemForm.addEventListener('submit', createOrUpdateItem);

  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = passwordInput.value.trim();
    if (!value) {
      document.getElementById('passwordError').hidden = false;
      return;
    }
    state.password = value;
    localStorage.setItem('hommie-app-password', value);
    document.getElementById('passwordError').hidden = true;
    closePasswordDialog();
    await loadItems();
  });

  document.body.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;

    if (action === 'delete') {
      await handleDelete(id);
    }

    if (action === 'edit') {
      const item = state.items.find((entry) => entry.id === id);
      if (item) openItemModal(item);
    }
  });

  document.body.addEventListener('change', async (event) => {
    const target = event.target;
    if (target.matches('[data-action="status"]')) {
      await handleStatusChange(target.dataset.id, target.value);
    }
    if (target.matches('[data-photo-check]')) {
      attachPhotoSelectionHandlers();
    }
    if (target.matches('[data-action="note"]')) {
      await handleNoteChange(target.dataset.id, target.value);
    }
  });

  document.body.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (itemModal.open) {
        closeItemModal();
      }
      if (passwordDialog.open) {
        closePasswordDialog();
      }
    }
  });

  document.body.addEventListener('focusin', () => {
    state.lastInteractionTs = Date.now();
  });

  document.body.addEventListener('input', () => {
    state.lastInteractionTs = Date.now();
  });
}

function startPolling() {
  setInterval(async () => {
    const now = Date.now();
    const isUserActive = now - state.lastInteractionTs < 1000;
    if (isUserActive || state.isModalOpen || state.isMutating || state.isPhotoAnalyzing) return;
    try {
      await loadItems({ silent: true });
    } catch {
      // ignore poll errors
    }
  }, 8000);
}

async function boot() {
  renderAll();
  setupEvents();
  await loadItems();
  startPolling();
  const bilgePanel = document.querySelector('.bilge-panel');
  if (bilgePanel) {
    bilgePanel.innerHTML = renderBilge('dialog');
  }
}

boot();

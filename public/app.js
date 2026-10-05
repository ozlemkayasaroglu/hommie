import {
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  analyzePhoto,
  requestImageLookup,
  uploadUserImage,
  importSheet,
  createSpace,
  joinSpace,
  recoverSpace,
  rotateInvite,
  fetchSpace,
  renameSpace,
  removeSpaceMember
} from './api-client.js';
import { state, saveSpaceSession, clearSpaceSession } from './state.js';
import {
  renderHero,
  renderRoomFilters,
  renderFilters,
  renderTabs,
  renderCards,
  renderPhotoPanel,
  renderPhotoSuggestions,
  renderSpace,
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
  renderTabs();
  renderFilters();
  renderCards();
  renderPhotoPanel();
  renderPhotoSuggestions();
  renderSpace();
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
    itemForm.elements.status.value = item.status || 'Başlamadı';
    itemForm.elements.note.value = item.note || '';
  } else {
    title.textContent = 'Yeni öğe';
    itemForm.elements.room.value = 'Genel';
    itemForm.elements.type.value = 'Alınacak';
    itemForm.elements.priority.value = '2';
    itemForm.elements.status.value = 'Başlamadı';
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
      // Yeni kayıt en üstte ve görünür sekmede olsun.
      state.sort = 'newest';
      if (state.activeTab === 'done') state.activeTab = 'open';
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
  const maxSize = 640;
  const scale = Math.min(1, maxSize / Math.max(imageBitmap.width, imageBitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(imageBitmap.width * scale));
  canvas.height = Math.max(1, Math.round(imageBitmap.height * scale));
  const context = canvas.getContext('2d');
  context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

  // NVIDIA inline image_url payload limiti ~180KB; sigana kadar kaliteyi kis.
  let quality = 0.78;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 170000 && quality > 0.35) {
    quality -= 0.12;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  return dataUrl;
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
    const result = await analyzePhoto(
      state.photoRoom || 'Salon',
      state.photoStyle || 'İskandinav',
      state.items.map((item) => item.name),
      converted
    );
    state.photoSuggestions = Array.isArray(result?.suggestions) ? result.suggestions : [];
    addSuggestedButton.hidden = state.photoSuggestions.length === 0;
    renderPhotoSuggestions();
    attachPhotoSelectionHandlers();
    if (result?.source === 'nvidia') {
      showToast(`${state.photoStyle} tarzında ${state.photoSuggestions.length} öneri hazır.`);
    } else {
      showToast(result?.notice || 'Zürafa cevap veremedi, örnek öneriler gösteriliyor.');
    }
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
        status: 'Başlamadı',
        note: [suggestion.reason, suggestion.style ? `(${suggestion.style})` : ''].filter(Boolean).join(' ')
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
  document.getElementById('importButton').addEventListener('click', () => {
    document.getElementById('importInput').click();
  });
  document.getElementById('importInput').addEventListener('change', handleSheetImport);
  document.getElementById('photoAnalyzeButton').addEventListener('click', handlePhotoAnalyze);
  document.getElementById('addSuggestedButton').addEventListener('click', handleAddSuggested);
  document.getElementById('photoRoom').addEventListener('change', (event) => {
    state.photoRoom = event.target.value;
  });
  document.getElementById('photoStyle').addEventListener('change', (event) => {
    state.photoStyle = event.target.value;
  });

  document.getElementById('roomFilters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-room]');
    if (!button) return;
    state.activeRoom = button.dataset.room;
    renderAll();
  });

  document.getElementById('statusTabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    state.activeTab = button.dataset.tab;
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

  document.getElementById('clearFilters').addEventListener('click', () => {
    state.activeRoom = 'Genel';
    state.activeTab = 'open';
    state.statusFilter = 'Tümü';
    state.priorityFilter = 'Tümü';
    state.sort = 'newest';
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

    if (action === 'invite') {
      renderSpace();
      state.isModalOpen = true;
      spaceDialog.showModal();
      return;
    }

    if (action === 'set-status') {
      const item = state.items.find((entry) => entry.id === id);
      const next = target.dataset.status;
      if (item && next && item.status !== next) {
        await handleStatusChange(id, next);
      }
    }
  });

  document.body.addEventListener('change', async (event) => {
    const target = event.target;
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


const spaceOnboarding = document.getElementById('spaceOnboarding');
const spaceDialog = document.getElementById('spaceDialog');

function openSpaceOnboarding(prefillCode = '') {
  if (spaceOnboarding.open) return;
  if (prefillCode) {
    switchSpaceTab('join');
    document.getElementById('joinSpaceCode').value = prefillCode;
  }
  state.isModalOpen = true;
  spaceOnboarding.showModal();
}

function switchSpaceTab(tab) {
  document.querySelectorAll('[data-space-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.spaceTab === tab);
  });
  document.querySelectorAll('[data-space-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.spacePanel !== tab;
  });
}

async function adoptSpaceResult(result) {
  saveSpaceSession(result.space, result.member);
  state.members = Array.isArray(result.members) ? result.members : [];
  state.isModalOpen = false;
  if (spaceOnboarding.open) spaceOnboarding.close();
  await loadItems();
  renderAll();
}

async function refreshSpace() {
  if (!state.spaceId || !state.memberId) {
    openSpaceOnboarding(readInviteFromUrl());
    return;
  }
  try {
    const result = await fetchSpace();
    saveSpaceSession(result.space, result.member);
    state.members = Array.isArray(result.members) ? result.members : [];
    renderSpace();
  } catch (error) {
    if (error?.message === 'unauthorized') return;
    // Alan silinmiş ya da üyelik düşmüş: baştan başlat.
    clearSpaceSession();
    openSpaceOnboarding(readInviteFromUrl());
  }
}

function readInviteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return (params.get('davet') || '').trim().toUpperCase();
}

function setupSpaceEvents() {
  document.querySelectorAll('[data-space-tab]').forEach((button) => {
    button.addEventListener('click', () => switchSpaceTab(button.dataset.spaceTab));
  });

  document.getElementById('createSpaceForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await createSpace(
        document.getElementById('newSpaceName').value,
        document.getElementById('newSpaceMemberName').value
      );
      await adoptSpaceResult(result);
      showToast('Alanın hazır. Hadi başlayalım!');
    } catch (error) {
      showToast(error?.message || 'Bir şeyler ters gitti.');
    }
  });

  document.getElementById('recoverSpaceForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = document.getElementById('recoverError');
    errorBox.hidden = true;
    try {
      const result = await recoverSpace(document.getElementById('recoverCode').value);
      await adoptSpaceResult(result);
      showToast('Tekrar hoş geldin!');
    } catch (error) {
      errorBox.textContent = error?.message || 'Bu kurtarma kodu geçerli değil.';
      errorBox.hidden = false;
    }
  });

  document.getElementById('rotateInviteButton').addEventListener('click', async () => {
    if (!window.confirm('Eski davet kodu geçersiz olacak. Yeni kod üretilsin mi?')) return;
    try {
      const result = await rotateInvite();
      state.space = result.space;
      renderSpace();
      showToast('Yeni davet kodu hazır.');
    } catch (error) {
      showToast(error?.message || 'Kod yenilenemedi.');
    }
  });

  document.getElementById('copyRecoveryButton').addEventListener('click', async () => {
    const code = state.member?.recovery_code || '';
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      showToast('Kurtarma kodun kopyalandı.');
    } catch {
      showToast(code);
    }
  });

  document.getElementById('joinSpaceForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = document.getElementById('joinSpaceError');
    errorBox.hidden = true;
    try {
      const result = await joinSpace(
        document.getElementById('joinSpaceCode').value,
        document.getElementById('joinSpaceMemberName').value
      );
      await adoptSpaceResult(result);
      showToast('Katıldın!');
    } catch (error) {
      errorBox.textContent = error?.message || 'Bu davet kodu geçerli değil.';
      errorBox.hidden = false;
    }
  });

  document.getElementById('spaceButton').addEventListener('click', () => {
    renderSpace();
    state.isModalOpen = true;
    spaceDialog.showModal();
  });

  document.getElementById('closeSpaceDialog').addEventListener('click', () => {
    state.isModalOpen = false;
    spaceDialog.close();
  });

  document.getElementById('spaceNameForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await renameSpace(document.getElementById('spaceNameInput').value);
      state.space = result.space;
      renderSpace();
      showToast('Alan adı güncellendi.');
    } catch (error) {
      showToast(error?.message || 'Alan adı kaydedilemedi.');
    }
  });

  document.getElementById('copyInviteButton').addEventListener('click', async () => {
    const link = `${window.location.origin}${window.location.pathname}?davet=${state.space?.invite_code || ''}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast('Davet bağlantısı kopyalandı.');
    } catch {
      showToast(link);
    }
  });

  document.getElementById('memberList').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-remove-member]');
    if (!button) return;
    try {
      await removeSpaceMember(button.dataset.removeMember);
      await refreshSpace();
      showToast('Üye çıkarıldı.');
    } catch (error) {
      showToast(error?.message || 'Üye çıkarılamadı.');
    }
  });

  document.getElementById('leaveSpaceButton').addEventListener('click', async () => {
    const isLastMember = state.members.length <= 1;
    let confirmName = '';

    if (isLastMember) {
      // Son üye ayrılırsa liste de kapanıyor; adı yazdırarak teyit alıyoruz.
      const answer = window.prompt(
        `Bu alandan ayrılırsan liste kapanır ve kayıtlar ${30} gün saklandıktan sonra silinir.\nDevam etmek için alanın adını yaz: ${state.space?.name || ''}`,
        ''
      );
      if (answer === null) return;
      confirmName = answer.trim();
    } else if (!window.confirm('Bu alandan ayrılmak istediğine emin misin?')) {
      return;
    }

    try {
      const result = await removeSpaceMember(state.memberId, confirmName);
      clearSpaceSession();
      state.items = [];
      state.isModalOpen = false;
      spaceDialog.close();
      renderAll();
      openSpaceOnboarding();
      showToast(
        result?.spaceClosed
          ? `Alan kapatıldı. Kayıtlar ${result.retentionDays} gün saklanıyor.`
          : 'Alandan ayrıldın.'
      );
    } catch (error) {
      if (error?.message === 'confirm_required') {
        showToast('Alan adını doğru yazman gerekiyor.');
        return;
      }
      showToast(error?.message || 'Alandan ayrılamadın.');
    }
  });
}

async function handleSheetImport(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  state.isMutating = true;
  showToast('Liste okunuyor...');
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',').pop());
      reader.onerror = () => reject(new Error('Dosya okunamadı.'));
      reader.readAsDataURL(file);
    });

    const result = await importSheet(file.name, base64);
    await loadItems();
    renderAll();

    if (result.added === 0) {
      showToast('Hepsi zaten listede.');
    } else {
      const skipped = result.duplicates ? `, ${result.duplicates} tanesi zaten vardı` : '';
      showToast(`${result.added} kayıt eklendi${skipped}.`);
    }
  } catch (error) {
    showToast(error?.message || 'Dosya aktarılamadı.');
  } finally {
    state.isMutating = false;
  }
}

function startPolling() {
  setInterval(async () => {
    const now = Date.now();
    const isUserActive = now - state.lastInteractionTs < 1000;
    if (isUserActive || state.isModalOpen || state.isMutating || state.isPhotoAnalyzing) return;
    if (!state.spaceId) return;
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
  setupSpaceEvents();
  await refreshSpace();
  if (state.spaceId) await loadItems();
  startPolling();
  const bilgePanel = document.querySelector('.bilge-panel');
  if (bilgePanel) {
    bilgePanel.innerHTML = renderBilge('dialog');
  }
}

boot();

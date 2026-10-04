export const state = {
  items: [],
  activeRoom: 'Genel',
  statusFilter: 'Tümü',
  priorityFilter: 'Tümü',
  sort: 'priority',
  password: localStorage.getItem('hommie-app-password') || '',
  isLoading: false,
  isMutating: false,
  isPhotoAnalyzing: false,
  isModalOpen: false,
  photoSuggestions: [],
  selectedPhotoSuggestions: new Set(),
  activeView: 'list',
  photoRoom: 'Salon',
  pollTimer: null,
  lastInteractionTs: Date.now()
};

export function getVisibleItems() {
  const room = state.activeRoom;
  const items = [...state.items];
  return items
    .filter((item) => room === 'Genel' || item.room === room)
    .filter((item) => state.statusFilter === 'Tümü' || item.status === state.statusFilter)
    .filter((item) => state.priorityFilter === 'Tümü' || Number(item.priority) === Number(state.priorityFilter))
    .sort((a, b) => {
      if (state.sort === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (state.sort === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (state.sort === 'completed') return (a.status === 'Tamam' ? 1 : 0) - (b.status === 'Tamam' ? 1 : 0);
      const priorityDiff = (a.priority || 99) - (b.priority || 99);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    });
}

export function getSummary() {
  const total = state.items.length;
  const complete = state.items.filter((item) => item.status === 'Tamam').length;
  const remaining = total - complete;
  const percent = total ? Math.round((complete / total) * 100) : 0;
  return { total, complete, remaining, percent };
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

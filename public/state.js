export const state = {
  items: [],
  comments: [],
  activeRoom: 'Genel',
  statusFilter: 'Tümü',
  priorityFilter: 'Tümü',
  sort: 'newest',
  activeTab: 'open',
  password: localStorage.getItem('hommie-app-password') || '',
  spaceId: localStorage.getItem('hommie-space-id') || '',
  memberId: localStorage.getItem('hommie-member-id') || '',
  space: null,
  member: null,
  members: [],
  isLoading: false,
  isMutating: false,
  isPhotoAnalyzing: false,
  isModalOpen: false,
  photoSuggestions: [],
  selectedPhotoSuggestions: new Set(),
  activeView: 'list',
  photoRoom: 'Salon',
  photoStyle: 'İskandinav',
  pollTimer: null,
  lastInteractionTs: Date.now()
};

export const DONE_STATUS = 'Tamamlandı';

export function getItemComments(itemId) {
  return state.comments.filter((comment) => comment.item_id === itemId);
}

export function isDone(item) {
  return item?.status === DONE_STATUS;
}

export function getTabCounts() {
  const scoped = state.items.filter(
    (item) => state.activeRoom === 'Genel' || item.room === state.activeRoom
  );
  return {
    open: scoped.filter((item) => !isDone(item)).length,
    done: scoped.filter(isDone).length,
    all: scoped.length
  };
}

export function getVisibleItems() {
  const room = state.activeRoom;
  const items = [...state.items];
  return items
    .filter((item) => room === 'Genel' || item.room === room)
    .filter((item) => {
      if (state.activeTab === 'open') return !isDone(item);
      if (state.activeTab === 'done') return isDone(item);
      return true;
    })
    .filter((item) => state.statusFilter === 'Tümü' || item.status === state.statusFilter)
    .filter((item) => state.priorityFilter === 'Tümü' || Number(item.priority) === Number(state.priorityFilter))
    .sort((a, b) => {
      if (state.sort === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (state.sort === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (state.sort === 'completed') return (isDone(a) ? 1 : 0) - (isDone(b) ? 1 : 0);
      const priorityDiff = (a.priority || 99) - (b.priority || 99);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    });
}

export function getSummary() {
  const total = state.items.length;
  const complete = state.items.filter(isDone).length;
  const remaining = total - complete;
  const percent = total ? Math.round((complete / total) * 100) : 0;
  return { total, complete, remaining, percent };
}

export function saveSpaceSession(space, member) {
  state.space = space || null;
  state.member = member || null;
  state.spaceId = space?.id || '';
  state.memberId = member?.id || '';
  if (state.spaceId) localStorage.setItem('hommie-space-id', state.spaceId);
  else localStorage.removeItem('hommie-space-id');
  if (state.memberId) localStorage.setItem('hommie-member-id', state.memberId);
  else localStorage.removeItem('hommie-member-id');
}

export function clearSpaceSession() {
  saveSpaceSession(null, null);
  state.members = [];
}

export function isSpaceOwner() {
  return state.member?.role === 'sahip';
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

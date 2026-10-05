export const ALLOWED_ROOMS = ['Genel', 'Salon', 'Mutfak', 'Yatak Odası', 'Banyo', 'Balkon', 'Antre'];
export const ALLOWED_TYPES = ['Alınacak', 'Yapılacak', 'Tamir', 'Resmi iş'];
export const ALLOWED_PRIORITIES = [1, 2, 3];
export const ALLOWED_STATUSES = ['Başlamadı', 'Devam ediyor', 'Tamamlandı'];
export const DEFAULT_STATUS = 'Başlamadı';
export const DONE_STATUS = 'Tamamlandı';

// Eski kayıtlar ve Excel dosyaları dört durumlu şemayı kullanıyordu.
export const LEGACY_STATUS_MAP = {
  'Yapılmadı': 'Başlamadı',
  'Araştırılıyor': 'Devam ediyor',
  'Sipariş verildi': 'Devam ediyor',
  'Tamam': 'Tamamlandı'
};

export function normalizeStatus(value, fallback = DEFAULT_STATUS) {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  if (ALLOWED_STATUSES.includes(text)) return text;
  return LEGACY_STATUS_MAP[text] || fallback;
}

const ITEM_ALLOWED_FIELDS = new Set([
  'id',
  'name',
  'room',
  'type',
  'priority',
  'status',
  'note',
  'price',
  'image_url',
  'image_path',
  'image_credit',
  'image_tried',
  'created_at'
]);

export function isValidRoom(room) {
  return ALLOWED_ROOMS.includes(room);
}

export function isValidType(type) {
  return ALLOWED_TYPES.includes(type);
}

export function isValidPriority(priority) {
  return ALLOWED_PRIORITIES.includes(Number(priority));
}

export function isValidStatus(status) {
  return ALLOWED_STATUSES.includes(status);
}

export function ensureString(value, fieldName) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
  return trimmed;
}

export function validateCreatePayload(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Payload must be an object.');
  }

  const invalidKeys = Object.keys(input).filter((key) => !ITEM_ALLOWED_FIELDS.has(key));
  if (invalidKeys.length > 0) {
    throw new Error(`Unknown fields not allowed: ${invalidKeys.join(', ')}`);
  }

  const name = ensureString(input.name, 'name');
  const room = ensureString(input.room, 'room');
  const type = ensureString(input.type, 'type');
  const status = normalizeStatus(ensureString(input.status, 'status'), '');
  const note = typeof input.note === 'string' ? input.note : '';

  if (!isValidRoom(room)) throw new Error('Invalid room.');
  if (!isValidType(type)) throw new Error('Invalid type.');
  if (!isValidPriority(input.priority)) throw new Error('Invalid priority.');
  if (!isValidStatus(status)) throw new Error('Invalid status.');

  return {
    name,
    room,
    type,
    priority: Number(input.priority),
    status,
    note,
    price: input.price ?? null,
    image_url: input.image_url ?? null,
    image_path: input.image_path ?? null,
    image_credit: input.image_credit ?? null,
    image_tried: Boolean(input.image_tried),
  };
}

export function validatePatchPayload(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Payload must be an object.');
  }

  const invalidKeys = Object.keys(input).filter((key) => !ITEM_ALLOWED_FIELDS.has(key));
  if (invalidKeys.length > 0) {
    throw new Error(`Unknown fields not allowed: ${invalidKeys.join(', ')}`);
  }

  const allowed = {};

  if ('name' in input) allowed.name = ensureString(input.name, 'name');
  if ('room' in input) {
    if (!isValidRoom(input.room)) throw new Error('Invalid room.');
    allowed.room = input.room;
  }
  if ('type' in input) {
    if (!isValidType(input.type)) throw new Error('Invalid type.');
    allowed.type = input.type;
  }
  if ('priority' in input) {
    if (!isValidPriority(input.priority)) throw new Error('Invalid priority.');
    allowed.priority = Number(input.priority);
  }
  if ('status' in input) {
    const status = normalizeStatus(input.status, '');
    if (!isValidStatus(status)) throw new Error('Invalid status.');
    allowed.status = status;
  }
  if ('note' in input) allowed.note = typeof input.note === 'string' ? input.note : '';
  if ('price' in input) allowed.price = input.price ?? null;
  if ('image_url' in input) allowed.image_url = input.image_url ?? null;
  if ('image_path' in input) allowed.image_path = input.image_path ?? null;
  if ('image_credit' in input) allowed.image_credit = input.image_credit ?? null;
  if ('image_tried' in input) allowed.image_tried = Boolean(input.image_tried);

  return allowed;
}

export function createSortComparator() {
  return (a, b) => {
    const aComplete = a.status === DONE_STATUS ? 1 : 0;
    const bComplete = b.status === DONE_STATUS ? 1 : 0;
    if (aComplete !== bComplete) return aComplete - bComplete;
    if ((a.priority ?? 99) !== (b.priority ?? 99)) return (a.priority ?? 99) - (b.priority ?? 99);
    return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
  };
}

const OFFICIAL_BUSINESS_NAMES = new Set([
  'elektrik abonelik devri',
  'su abonelik devri',
  'dogalgaz abonelik devri',
  'internet aboneligi',
  'e-devlet adres degisikligi',
  'banka adres guncellemesi'
]);

function normalizeText(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function isOfficialItem(item) {
  if (!item || typeof item !== 'object') return false;
  return item.type === 'Resmi iş' || OFFICIAL_BUSINESS_NAMES.has(normalizeText(item.name));
}

export function getRoomColor(room) {
  const colors = {
    Genel: '#8B5CF6',
    Salon: '#FF8A3D',
    Mutfak: '#2BB673',
    'Yatak Odası': '#FF5FA2',
    Banyo: '#26B5E8',
    Balkon: '#A3D133',
    Antre: '#FFC93C'
  };
  return colors[room] || '#1B1A3A';
}

export function buildSearchUrl(itemName, shop) {
  const query = encodeURIComponent(itemName.trim());
  const urls = {
    Akakçe: `https://www.akakce.com/?q=${query}`,
    Trendyol: `https://www.trendyol.com/search?q=${query}`,
    Hepsiburada: `https://www.hepsiburada.com/ara?ara=${query}`
  };
  return urls[shop] || '';
}

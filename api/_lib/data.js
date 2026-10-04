export const ROOM_OPTIONS = ['Genel', 'Salon', 'Mutfak', 'Yatak Odası', 'Banyo', 'Balkon', 'Antre'];
export const STATUS_OPTIONS = ['Yapılmadı', 'Araştırılıyor', 'Sipariş verildi', 'Tamam'];
export const PRIORITY_OPTIONS = [1, 2, 3];
export const TYPE_OPTIONS = ['Alınacak', 'Yapılacak', 'Tamir', 'Resmi iş'];

export const officialBusinessNames = new Set([
  'elektrik abonelik devri',
  'su abonelik devri',
  'doğalgaz abonelik devri',
  'internet aboneliği',
  'e-devlet adres değişikliği',
  'banka adres güncellemesi'
]);

export function isOfficialBusinessItem(item) {
  if (!item || typeof item !== 'object') return false;
  return item.type === 'Resmi iş' || officialBusinessNames.has(String(item.name).trim().toLowerCase());
}

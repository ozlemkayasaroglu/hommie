import * as XLSX from 'xlsx';
import { ALLOWED_ROOMS, ALLOWED_TYPES, ALLOWED_STATUSES } from './validation.js';

const HEADER_ALIASES = {
  room: ['oda', 'oda / alan', 'alan', 'oda/alan', 'bölüm'],
  name: ['kalem', 'ürün', 'urun', 'ad', 'isim', 'başlık', 'baslik', 'eksik'],
  type: ['tür', 'tur', 'tip', 'kategori'],
  priority: ['öncelik', 'oncelik'],
  status: ['durum'],
  note: ['not', 'not / link', 'açıklama', 'aciklama', 'link']
};

const normalize = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('tr-TR');

function matchHeader(cell) {
  const text = normalize(cell);
  if (!text) return null;
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => text === alias || text.startsWith(`${alias} `))) return field;
  }
  return null;
}

// Başlık satırı dosyanın ilk satırı olmayabilir (başlık/açıklama satırları olur),
// bu yüzden en çok sütunu eşleşen satırı başlık kabul ediyoruz.
function findHeaderRow(rows) {
  let best = { index: -1, map: {}, score: 0 };
  const limit = Math.min(rows.length, 15);
  for (let i = 0; i < limit; i += 1) {
    const map = {};
    let score = 0;
    rows[i].forEach((cell, columnIndex) => {
      const field = matchHeader(cell);
      if (field && map[field] === undefined) {
        map[field] = columnIndex;
        score += 1;
      }
    });
    if (score > best.score) best = { index: i, map, score };
  }
  return best.score >= 2 ? best : null;
}

function pickAllowed(value, allowed, fallback) {
  const text = normalize(value);
  if (!text) return fallback;
  const hit = allowed.find((option) => normalize(option) === text);
  if (hit) return hit;
  const partial = allowed.find((option) => text.startsWith(normalize(option)));
  return partial || fallback;
}

function parsePriority(value) {
  const match = String(value ?? '').match(/[123]/);
  if (match) return Number(match[0]);
  const text = normalize(value);
  if (text.includes('acil')) return 1;
  if (text.includes('önemli') || text.includes('onemli')) return 2;
  return 3;
}

export function parseSheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const result = { items: [], skipped: 0 };

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
      defval: ''
    });
    const header = findHeaderRow(rows);
    if (!header || header.map.name === undefined) continue;

    for (let i = header.index + 1; i < rows.length; i += 1) {
      const row = rows[i];
      const name = String(row[header.map.name] ?? '').trim();
      if (!name) continue;
      // Başlık satırı tekrar ediyorsa atla.
      if (matchHeader(name) === 'name') continue;

      result.items.push({
        name: name.slice(0, 120),
        room: pickAllowed(row[header.map.room], ALLOWED_ROOMS, 'Genel'),
        type: pickAllowed(row[header.map.type], ALLOWED_TYPES, 'Alınacak'),
        priority: parsePriority(row[header.map.priority]),
        status: pickAllowed(row[header.map.status], ALLOWED_STATUSES, 'Yapılmadı'),
        note: String(row[header.map.note] ?? '').trim().slice(0, 500)
      });
    }
  }

  return result;
}
